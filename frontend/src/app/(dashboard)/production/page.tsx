"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useVehicles, useWorkers, useUpdateVehicleStage, useCreateVehicle, useVerifyVehicle, useRejectVehicle } from "@/hooks/useQueries";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { cn } from "@/lib/utils";
import type { Priority, Stage, Vehicle } from "@/types";
import { AlertTriangle, ChevronDown, Inbox, Plus, Search, X, CheckCircle2, XCircle, Edit, Tag, History, UserPlus } from "lucide-react";
import { AddVehicleDialog } from "@/components/vehicles/AddVehicleDialog";
import { GateEntryDrawer } from "@/components/vehicles/GateEntryDrawer";
import { AssignJobDialog } from "@/components/vehicles/AssignJobDialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditRecordDialog } from "@/components/shared/EditRecordDialog";
import { ReasonPromptDialog } from "@/components/shared/ReasonPromptDialog";
import { AuditHistoryDrawer } from "@/components/shared/AuditHistoryDrawer";

const STAGES: Stage[] = [
  "oem", 
  "incoming_verification", 
  "supervisor_verification", 
  "received", 
  "fabrication", 
  "paint", 
  "quality", 
  "rtd", 
  "dispatch", 
  "delivered"
];

const STAGE_CONFIG: Record<
  Stage,
  {
    label: string;
    color: string;
    headerClass: string;
    borderClass: string;
    progressClass: string;
  }
> = {
  oem: {
    label: "OEM",
    color: "text-muted-foreground",
    headerClass: "bg-muted/60 border-b border-border",
    borderClass: "border-l-muted-foreground",
    progressClass: "bg-muted-foreground",
  },
  incoming_verification: {
    label: "Verify (In)",
    color: "text-warning",
    headerClass: "bg-warning/10 border-b border-warning/30",
    borderClass: "border-l-warning",
    progressClass: "bg-warning",
  },
  supervisor_verification: {
    label: "Verify (Sup)",
    color: "text-warning",
    headerClass: "bg-warning/10 border-b border-warning/30",
    borderClass: "border-l-warning",
    progressClass: "bg-warning",
  },
  rejected: {
    label: "Rejected",
    color: "text-destructive",
    headerClass: "bg-destructive/10 border-b border-destructive/30",
    borderClass: "border-l-destructive",
    progressClass: "bg-destructive",
  },
  received: {
    label: "Received",
    color: "text-muted-foreground",
    headerClass: "bg-muted/60 border-b border-border",
    borderClass: "border-l-muted-foreground",
    progressClass: "bg-muted-foreground",
  },
  fabrication: {
    label: "Fabrication",
    color: "text-primary",
    headerClass: "bg-primary/10 border-b border-primary/30",
    borderClass: "border-l-primary",
    progressClass: "bg-primary",
  },
  paint: {
    label: "Paint",
    color: "text-secondary",
    headerClass: "bg-secondary/10 border-b border-secondary/30",
    borderClass: "border-l-secondary",
    progressClass: "bg-secondary",
  },
  quality: {
    label: "Quality",
    color: "text-primary",
    headerClass: "bg-primary/10 border-b border-primary/30",
    borderClass: "border-l-primary",
    progressClass: "bg-primary",
  },
  rtd: {
    label: "Ready-to-Dispatch",
    color: "text-success",
    headerClass: "bg-success/10 border-b border-success/30",
    borderClass: "border-l-success",
    progressClass: "bg-success",
  },
  dispatch: {
    label: "Dispatch",
    color: "text-foreground",
    headerClass: "bg-card border-b border-border",
    borderClass: "border-l-foreground",
    progressClass: "bg-foreground",
  },
  delivered: {
    label: "Delivered",
    color: "text-success",
    headerClass: "bg-success/20 border-b border-success/40",
    borderClass: "border-l-success",
    progressClass: "bg-success",
  },
};

const PRODUCT_CATEGORIES = [
  "All Categories",
  "Cargo Box",
  "Garbage Body",
  "Grocery Cart",
  "Food Cart",
];

function getTimeInStage(receivedAt: string): string {
  const diff = Date.now() - new Date(receivedAt).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "< 1h";
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function isOverdue(estimatedDelivery: string): boolean {
  return Date.now() > new Date(estimatedDelivery).getTime();
}

function getWorkerInitial(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Vehicle Card ─────────────────────────────────────────────────────────
interface VehicleCardProps {
  workerMap?: Record<string, string>;
  vehicle: Vehicle;
  workerName: string | null;
  index: number;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, vehicleId: string) => void;
  onClick: () => void;
  onAssign?: (vehicleId: string) => void;
  canEdit?: boolean;
  onAction?: (action: string, vehicle: Vehicle) => void;
}

function VehicleCard({
  vehicle,
  workerMap,
  index,
  onDragStart,
  onClick,
  onAssign,
  canEdit,
  onAction
}: VehicleCardProps) {
  const normStage = (vehicle.currentStage.toLowerCase() === "readytodispatch" ? "rtd" : vehicle.currentStage.toLowerCase()) as Stage;
  const cfg = STAGE_CONFIG[normStage] || STAGE_CONFIG.received;
  
  // Find active job for current stage
  const activeJob = vehicle.productionJobs?.find(j => j.stage === normStage && !["completed", "rejected"].includes(j.status));
  const isAssigned = !!activeJob;
  
  // Compute active job timer if in progress
  const [elapsed, setElapsed] = useState("");
  const isDelayed = activeJob && activeJob.start_time && activeJob.expected_duration_minutes 
    ? (new Date().getTime() - new Date(activeJob.start_time).getTime()) > (activeJob.expected_duration_minutes * 60000)
    : false;

  useEffect(() => {
    if (activeJob?.status === "in_progress" && activeJob.start_time) {
      const interval = setInterval(() => {
        const start = new Date(activeJob.start_time!).getTime();
        const now = new Date().getTime();
        const diff = now - start;
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setElapsed(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeJob]);

  const overdue = isDelayed || (isOverdue(vehicle.estimatedDelivery) && vehicle.currentStage.toLowerCase() !== "dispatch" && vehicle.currentStage.toLowerCase() !== "dispatched");
  const isUrgent = vehicle.priority.toLowerCase() === "urgent";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <div
        draggable
        onDragStart={(e) => onDragStart(e, vehicle.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClick?.();
        }}
        onClick={onClick}
        data-ocid={`production.kanban.${vehicle.currentStage}.item.${index + 1}`}
        className={cn(
          "relative p-3 bg-card rounded-xl border-l-4 cursor-grab active:cursor-grabbing",
          "border border-border transition-all duration-200",
          "hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30",
          "select-none flex flex-col gap-2",
          cfg.borderClass,
          isUrgent && [
            "shadow-[0_0_0_1px_hsl(var(--destructive)/0.4),0_4px_20px_hsl(var(--destructive)/0.2)]",
            "border-destructive/50",
          ],
        )}
      >
        {(isUrgent || normStage === "oem") && (
          <span className="absolute -top-1 -right-1 w-3 h-3 z-10">
            <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
          </span>
        )}

        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground truncate leading-tight">
              {vehicle.vehicleNumber}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              {vehicle.trackingId}
            </p>
          </div>
          <PriorityBadge priority={vehicle.priority} showLabel={false} />
        </div>

        <p className="text-[11px] text-muted-foreground truncate">
          {vehicle.oemName}
          <span className="text-muted-foreground/50 mx-1">Â·</span>
          <span className="text-muted-foreground/70">
            {vehicle.productCategory}
          </span>
        </p>
        
        {/* Job Status Banner */}
        {activeJob && (
          <div className="flex items-center justify-between bg-muted/30 p-1.5 rounded-md border border-border/50">
            <span className="text-[10px] font-semibold capitalize text-primary">{activeJob.status.replace("_", " ")}</span>
            {activeJob.status === "in_progress" && (
              <span className={cn("text-[10px] font-mono tabular-nums font-bold", isDelayed ? "text-destructive" : "text-success")}>
                â± {elapsed || "00:00:00"}
              </span>
            )}
          </div>
        )}

        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${vehicle.progressPercent}%` }}
            transition={{ duration: 0.7, delay: index * 0.04, ease: "easeOut" }}
            className={cn("h-full rounded-full", cfg.progressClass)}
          />
        </div>

        <div className="flex items-center justify-between gap-1 mt-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {isAssigned && activeJob.workers && activeJob.workers.length > 0 ? (
              <div className="flex -space-x-1 overflow-hidden">
                {activeJob.workers.map((w: any) => (
                  <span
                    key={w.id}
                    className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 text-primary flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                    title={w.name}
                  >
                    {getWorkerInitial(w.name)}
                  </span>
                ))}
              </div>
            ) : normStage !== "received" && normStage !== "oem" && normStage !== "incoming_verification" ? (
              <button 
                onClick={(e) => { e.stopPropagation(); onAssign?.(vehicle.id); }}
                className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors"
              >
                + Assign
              </button>
            ) : (
              <span className="text-[10px] text-muted-foreground/50 italic">
                Unassigned
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {overdue && (
              <AlertTriangle size={10} className="text-destructive animate-pulse" />
            )}
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {getTimeInStage(vehicle.receivedAt)}
            </span>
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground">
                    <ChevronDown size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Vehicle Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onClick()}>
                    <Search className="mr-2 h-4 w-4" /> View Details
                  </DropdownMenuItem>
                  
                  {canEdit && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Enterprise Admin</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setTimeout(() => onAction?.("edit", vehicle), 0)}>
                        <Edit className="mr-2 h-4 w-4 text-primary" /> Edit Vehicle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeout(() => onAction?.("change_stage", vehicle), 0)}>
                        <Tag className="mr-2 h-4 w-4" /> Change Stage
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeout(() => onAction?.("change_priority", vehicle), 0)}>
                        <AlertTriangle className="mr-2 h-4 w-4 text-warning" /> Change Priority
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeout(() => onAction?.("reassign", vehicle), 0)}>
                        <UserPlus className="mr-2 h-4 w-4" /> Reassign Supervisor
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeout(() => onAction?.(vehicle.currentStage === "hold" ? "resume" : "hold", vehicle), 0)}>
                        <XCircle className="mr-2 h-4 w-4 text-destructive" /> {vehicle.currentStage === "hold" ? "Resume Vehicle" : "Hold Vehicle"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setTimeout(() => onAction?.("history", vehicle), 0)}>
                        <History className="mr-2 h-4 w-4 text-muted-foreground" /> Audit History
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────
interface KanbanColumnProps {
  stage: Stage;
  vehicles: Vehicle[];
  workerMap: Record<string, string>;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, stage: Stage) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, vehicleId: string) => void;
  onCardClick: (vehicleId: string) => void;
  onAddVehicle?: () => void;
  onAssign?: (vehicleId: string) => void;
  canEdit?: boolean;
  onAction?: (action: string, vehicle: Vehicle) => void;
}

function KanbanColumn({
  stage,
  vehicles,
  workerMap,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onCardClick,
  onAddVehicle,
  onAssign,
  canEdit,
  onAction
}: KanbanColumnProps) {
  const cfg = STAGE_CONFIG[stage];
  const hasOverdue = vehicles.some((v) => isOverdue(v.estimatedDelivery) && v.currentStage.toLowerCase() !== "dispatch" && v.currentStage.toLowerCase() !== "dispatched");

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border overflow-hidden transition-all duration-200",
        "w-[280px] min-w-[260px] flex-shrink-0",
        isDragOver
          ? "border-primary border-dashed bg-primary/5 shadow-[0_0_0_2px_hsl(var(--primary)/0.3)]"
          : "border-border bg-muted/20",
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, stage)}
      data-ocid={`production.kanban.${stage}.column`}
    >
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2.5",
          cfg.headerClass,
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("text-xs font-semibold truncate", cfg.color)}>
            {cfg.label}
          </span>
          {hasOverdue && (
            <AlertTriangle
              size={12}
              className="text-destructive flex-shrink-0 animate-pulse"
            />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center",
              stage === "fabrication"
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {vehicles.length}
          </span>
          {stage === "received" && onAddVehicle && (
            <button
              type="button"
              onClick={onAddVehicle}
              data-ocid="production.received.open_modal_button"
              className="w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors"
              aria-label="Add vehicle"
            >
              <Plus size={13} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 40 }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-2 mt-2 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 flex items-center justify-center"
          >
            <span className="text-[10px] text-primary/60 font-medium">
              Drop here
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
        <AnimatePresence>
          {vehicles.length === 0 && !isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 gap-2"
              data-ocid={`production.kanban.${stage}.empty_state`}
            >
              <Inbox size={22} className="text-muted-foreground/30" />
              <p className="text-[11px] text-muted-foreground/50">
                No vehicles
              </p>
            </motion.div>
          )}
          {vehicles.map((vehicle, vi) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              workerMap={workerMap}
              workerName={null}
              index={vi}
              onDragStart={onDragStart}
              onClick={() => onCardClick(vehicle.id)}
              onAssign={onAssign}
              canEdit={canEdit}
              onAction={onAction}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Production Page ──────────────────────────────────────────────────────
export default function ProductionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles();
  const { data: workers = [] } = useWorkers();
  
  const [assignJobState, setAssignJobState] = useState<{vehicle: Vehicle, stage: Stage} | null>(null);

  const updateStageMutation = useUpdateVehicleStage();
  const createVehicleMutation = useCreateVehicle();
  const verifyVehicleMutation = useVerifyVehicle();
  const rejectVehicleMutation = useRejectVehicle();

  const categoryParam = searchParams.get("category");
  const tabParam = searchParams.get("tab");

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [categoryFilter, setCategoryFilter] = useState(categoryParam || "All Categories");

  // Enterprise Admin
  const { useAuthStore } = require("@/store/authStore");
  const userRole = useAuthStore((state: any) => state.role) || "operator";
  const canEdit = ["admin", "owner"].includes(userRole);
  const [editRecord, setEditRecord] = useState<Vehicle | null>(null);
  const [historyRecord, setHistoryRecord] = useState<Vehicle | null>(null);
  const [holdRecord, setHoldRecord] = useState<Vehicle | null>(null);

  const handleAction = useCallback((action: string, vehicle: Vehicle) => {
    if (action === "edit" || action === "change_stage" || action === "change_priority") {
      setEditRecord(vehicle);
    } else if (action === "reassign") {
      setAssignJobState({ vehicle, stage: (vehicle.currentStage === "readytodispatch" ? "rtd" : vehicle.currentStage) as Stage });
    } else if (action === "hold" || action === "resume") {
      setHoldRecord(vehicle);
    } else if (action === "history") {
      setHistoryRecord(vehicle);
    }
  }, []);

  useEffect(() => {
    if (categoryParam) {
      setCategoryFilter(categoryParam);
    } else {
      setCategoryFilter("All Categories");
    }
  }, [categoryParam]);

  const [activeTab, setActiveTab] = useState<"incoming" | "board" | "history">(
    (tabParam === "incoming" || tabParam === "history") ? tabParam : "board"
  );

  useEffect(() => {
    if (tabParam && ["incoming", "board", "history"].includes(tabParam)) {
      setActiveTab(tabParam as "incoming" | "board" | "history");
    }
  }, [tabParam]);

  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [drawerVehicle, setDrawerVehicle] = useState<Vehicle | null>(null);

  const draggingId = useRef<string | null>(null);

  const workerMap = useMemo(() => {
    return workers.reduce<Record<string, string>>((acc, w) => {
      acc[w.id] = w.name;
      return acc;
    }, {});
  }, [workers]);

  const filtered = useMemo(() => {
    return vehicles.filter((v: Vehicle) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        v.trackingId.toLowerCase().includes(q) ||
        v.vehicleNumber.toLowerCase().includes(q) ||
        v.oemName.toLowerCase().includes(q);
      const matchesPriority =
        priorityFilter === "all" || v.priority.toLowerCase() === priorityFilter.toLowerCase();
      const matchesCategory =
        categoryFilter === "All Categories" ||
        v.productCategory.toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesPriority && matchesCategory;
    });
  }, [vehicles, search, priorityFilter, categoryFilter]);

  const byStage = useMemo(() => {
    // Generate initial grouped object from STAGES plus 'rejected'
    const initialGrouped = STAGES.reduce((acc, stage) => {
      acc[stage] = [];
      return acc;
    }, {} as any);

    const grouped = STAGES.reduce<any>(
      (acc, s) => {
        acc[s] = filtered.filter((v: Vehicle) => {
          const norm = v.currentStage.toLowerCase() === "readytodispatch" ? "rtd" : v.currentStage.toLowerCase();
          return norm === s.toLowerCase();
        });
        return acc;
      },
      initialGrouped,
    );
    
    // Handle rejected separately since it's not in STAGES
    grouped.rejected = filtered.filter((v: Vehicle) => v.currentStage.toLowerCase() === "rejected");
    
    return grouped;
  }, [filtered]);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, vehicleId: string) => {
      draggingId.current = vehicleId;
      e.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, stage: Stage) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverStage(stage);
    },
    [],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverStage(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, stage: Stage) => {
      e.preventDefault();
      if (draggingId.current) {
        // Calculate dynamic progress percent based on the target stage
        let progress = 0;
        if (stage === "received") progress = 0;
        else if (stage === "fabrication") progress = 30;
        else if (stage === "paint") progress = 60;
        else if (stage === "rtd") progress = 90;
        else if (stage === "dispatch") progress = 100;

        updateStageMutation.mutate({ id: draggingId.current, stage, progress });
        draggingId.current = null;
      }
      setDragOverStage(null);
    },
    [updateStageMutation],
  );

  const handleCardClick = useCallback(
    (vehicleId: string) => {
      router.push(`/vehicle/${vehicleId}`);
    },
    [router],
  );

  const handleAddVehicle = useCallback((data: any) => {
    createVehicleMutation.mutate(data);
  }, [createVehicleMutation]);

  const urgentCount = useMemo(() => vehicles.filter((v: Vehicle) => v.priority.toLowerCase() === "urgent").length, [vehicles]);
  const highCount = useMemo(() => vehicles.filter((v: Vehicle) => v.priority.toLowerCase() === "high").length, [vehicles]);
  const isFiltered = search || priorityFilter !== "all" || categoryFilter !== "All Categories";

  if (isLoadingVehicles) {
    return (
      <div className="flex flex-col h-full overflow-hidden p-6 gap-6 animate-pulse">
        <div className="h-12 w-64 bg-muted rounded-lg" />
        <div className="flex gap-4 overflow-x-auto">
          {STAGES.map((s) => (
            <div key={s} className="w-[280px] min-w-[260px] h-[400px] bg-card border border-border rounded-2xl p-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-[calc(100vh-64px)] bg-background"
      data-ocid="production.page"
    >
      {/* Top bar */}
      <div className="flex-shrink-0 p-4 md:px-6 md:pt-5 md:pb-4 border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground tracking-tight flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
              Production Board
              
              {/* Tabs */}
              <div className="flex flex-nowrap overflow-x-auto no-scrollbar bg-muted rounded-lg p-1 mt-1 border border-border w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("incoming")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap",
                    activeTab === "incoming" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Verification
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("board")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap",
                    activeTab === "board" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Production Board
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap",
                    activeTab === "history" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Work History
                </button>
              </div>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {vehicles.length} vehicles &mdash;&nbsp;
              <span className="text-destructive font-medium">
                {urgentCount} urgent
              </span>
              {" Â· "}
              <span className="text-warning font-medium">{highCount} high</span>
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {priorityFilter !== "all" && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                {priorityFilter}
                <button
                  type="button"
                  onClick={() => setPriorityFilter("all")}
                  className="ml-0.5 hover:text-primary/60"
                  aria-label="Clear priority filter"
                >
                  <X size={9} />
                </button>
              </span>
            )}
            {categoryFilter !== "All Categories" && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                {categoryFilter}
                <button
                  type="button"
                  onClick={() => setCategoryFilter("All Categories")}
                  className="ml-0.5 hover:text-primary/60"
                  aria-label="Clear category filter"
                >
                  <X size={9} />
                </button>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2">
          <div className="relative w-full sm:flex-1 sm:min-w-[180px] sm:max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search tracking ID, vehicle, OEM…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-input rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
              data-ocid="production.search_input"
            />
          </div>

          <div className="flex items-center w-full sm:w-auto overflow-x-auto no-scrollbar gap-1 bg-muted/50 rounded-lg p-0.5 border border-border">
            {(["all", "normal", "high", "urgent"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setPriorityFilter(f)}
                data-ocid={`production.priority.${f}.tab`}
                className={cn(
                  "px-2.5 py-1.5 rounded-md text-[11px] font-semibold capitalize transition-all duration-150 whitespace-nowrap flex-1 text-center",
                  priorityFilter === f
                    ? f === "urgent"
                      ? "bg-destructive text-white shadow-sm"
                      : f === "high"
                        ? "bg-warning text-white shadow-sm"
                        : "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f === "all" ? `All (${vehicles.length})` : f}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowCategoryDropdown((v) => !v)}
              data-ocid="production.category.select"
              className="flex items-center justify-between gap-1.5 px-3 py-2 text-[11px] font-medium bg-muted/50 border border-border rounded-lg text-foreground hover:border-primary/40 transition-all w-full"
            >
              <span className="truncate">{categoryFilter}</span>
              <ChevronDown
                size={11}
                className={cn(
                  "transition-transform",
                  showCategoryDropdown && "rotate-180",
                )}
              />
            </button>
            <AnimatePresence>
              {showCategoryDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-20 py-1 min-w-[170px]"
                  data-ocid="production.category.dropdown_menu"
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategoryFilter(cat);
                        setShowCategoryDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs transition-colors",
                        categoryFilter === cat
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isFiltered && (
            <span className="text-[11px] text-muted-foreground w-full sm:w-auto text-center">
              {filtered.length} / {vehicles.length} shown
            </span>
          )}
        </div>
      </div>

      {/* Board area */}
      {activeTab === "board" && (
        <div
          className="flex-1 overflow-x-auto overflow-y-hidden no-scrollbar pb-6"
          onClick={() => showCategoryDropdown && setShowCategoryDropdown(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowCategoryDropdown(false);
          }}
          data-ocid="production.board"
        >
          <div className="flex gap-4 p-4 sm:p-6 min-w-max h-full">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                vehicles={byStage[stage]}
                workerMap={workerMap}
                isDragOver={dragOverStage === stage}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage)}
                onCardClick={(id) => handleCardClick(String(id))}
                onDragStart={(e, id) => handleDragStart(e, String(id))}
                onAddVehicle={
                  stage === "received" ? () => setShowAddModal(true) : undefined
                }
                onAssign={(vId) => {
                  const v = byStage[stage].find((v: Vehicle) => v.id === vId);
                  if (v) setAssignJobState({ vehicle: v, stage });
                }}
                canEdit={canEdit}
                onAction={handleAction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Incoming Verification Tab Content */}
      {activeTab === "incoming" && (
        <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-lg font-bold">Incoming Vehicles for Verification</h2>
            {byStage["oem"].length === 0 ? (
              <div className="text-center py-10 bg-card rounded-xl border border-border">
                <p className="text-muted-foreground">No vehicles pending verification.</p>
              </div>
            ) : (
              (byStage["oem"] || []).map((v: Vehicle) => (
                <div key={v.id} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">OEM: {v.oemName}</p>
                    <p className="text-base font-bold text-foreground">{v.vehicleNumber}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span>Tracking: {v.trackingId}</span>
                      {v.driverName && <span>Driver: {v.driverName}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {v.verificationStatus === "hold" ? (
                      <span className="px-2 py-1 bg-warning/10 text-warning border border-warning/20 text-xs font-bold rounded-lg">
                        On Hold
                      </span>
                    ) : v.verificationStatus === "rejected" ? (
                      <span className="px-2 py-1 bg-destructive/10 text-destructive border border-destructive/20 text-xs font-bold rounded-lg">
                        Rejected
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-primary/10 text-primary border border-primary/20 text-xs font-bold rounded-lg">
                        Pending Verification
                      </span>
                    )}
                    <button
                      onClick={() => setDrawerVehicle(v)}
                      className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Work History Tab Content */}
      {activeTab === "history" && (
        <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
          <div className="max-w-4xl mx-auto text-center py-10 bg-card rounded-xl border border-border">
             <p className="text-muted-foreground">Work history will appear here.</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <AddVehicleDialog
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddVehicle}
            isOemSubmission={false}
          />
        )}
      </AnimatePresence>

      <GateEntryDrawer 
        vehicle={drawerVehicle} 
        open={!!drawerVehicle} 
        onOpenChange={(open) => !open && setDrawerVehicle(null)}
        onVerificationComplete={() => {
          // The query will auto-refresh via websocket, but we can close the drawer
          setDrawerVehicle(null);
        }}
      />
      
      <AssignJobDialog 
        vehicle={assignJobState?.vehicle}
        stage={assignJobState?.stage || ""}
        workers={workers}
        open={!!assignJobState}
        onClose={() => setAssignJobState(null)}
        onAssignComplete={() => setAssignJobState(null)}
      />

      {/* Enterprise Admin Dialogs */}
      <EditRecordDialog
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
        title={`Edit Vehicle: ${editRecord?.vehicleNumber}`}
        fields={[
          { name: "priority", label: "Priority", type: "select", defaultValue: editRecord?.priority, options: ["Normal", "High", "Urgent"] },
          { name: "stage", label: "Stage", type: "select", defaultValue: editRecord?.currentStage, options: ["oem", "received", "fabrication", "paint", "quality", "rtd", "dispatch"] },
        ]}
        onSubmit={(data) => {
          if (!editRecord) return;
          updateStageMutation.mutate({ 
            id: editRecord.id, 
            stage: data.stage,
            priority: data.priority,
            reason: data.reason
          }, {
            onSuccess: () => setEditRecord(null)
          });
        }}
        isSubmitting={updateStageMutation.isPending}
      />

      <ReasonPromptDialog
        open={!!holdRecord}
        onOpenChange={(open) => !open && setHoldRecord(null)}
        title={holdRecord?.currentStage === "hold" ? "Resume Vehicle" : "Hold Vehicle"}
        description={holdRecord?.currentStage === "hold" ? `Resume production for ${holdRecord?.vehicleNumber}?` : `Put ${holdRecord?.vehicleNumber} on hold?`}
        onSubmit={(reason) => {
          if (!holdRecord) return;
          updateStageMutation.mutate({ 
            id: holdRecord.id, 
            stage: holdRecord.currentStage === "hold" ? "received" : "hold",
            reason 
          }, {
            onSuccess: () => setHoldRecord(null)
          });
        }}
      />

      <AuditHistoryDrawer
        open={!!historyRecord}
        onOpenChange={(open) => !open && setHistoryRecord(null)}
        recordId={historyRecord?.id?.toString() || ""}
        module="vehicles"
        title={`Audit History: ${historyRecord?.vehicleNumber}`}
      />
    </div>
  );
}
