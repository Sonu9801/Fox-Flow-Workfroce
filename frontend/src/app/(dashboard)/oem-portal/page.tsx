"use client";

import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useVehicles, useDispatchRecords, useOemSubmitVehicle, useUpdateDispatchRecord } from "@/hooks/useQueries";
import type { DispatchRecord, Stage, Vehicle } from "@/types";
import { AddVehicleDialog } from "@/components/vehicles/AddVehicleDialog";
import {
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Package,
  Search,
  Truck,
  Plus,
  Activity,
  AlertTriangle,
  PenTool,
  Check,
  Edit,
  History,
  MoreVertical
} from "lucide-react";
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
import { AnimatePresence, motion } from "motion/react";

const STAGES: {
  key: Stage;
  label: string;
  friendlyLabel: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "received",
    label: "Order Received",
    friendlyLabel: "Order confirmed, preparing materials",
    icon: <Package size={14} />,
  },
  {
    key: "fabrication",
    label: "Manufacturing",
    friendlyLabel: "Actively being manufactured",
    icon: <Clock size={14} />,
  },
  {
    key: "paint",
    label: "Finishing",
    friendlyLabel: "Finishing and coating",
    icon: <CheckCircle2 size={14} />,
  },
  {
    key: "rtd",
    label: "Ready to Ship",
    friendlyLabel: "Quality checked and ready to ship",
    icon: <Package size={14} />,
  },
  {
    key: "dispatch",
    label: "Shipped",
    friendlyLabel: "Shipped and in transit",
    icon: <Truck size={14} />,
  },
];

const STAGE_INDEX: Partial<Record<Stage, number>> = {
  oem: -1,
  rejected: -1,
  received: 0,
  fabrication: 1,
  paint: 2,
  rtd: 3,
  dispatch: 4,
};

function normalizeStage(stageStr: string): Stage {
  const s = stageStr.toLowerCase();
  if (s === "readytodispatch" || s === "rtd") return "rtd";
  if (s === "dispatched" || s === "dispatch") return "dispatch";
  return s as Stage;
}

function stageStatus(
  vehicleStage: Stage,
  colStage: Stage,
): "done" | "active" | "pending" {
  const vi = STAGE_INDEX[vehicleStage] ?? 0;
  const ci = STAGE_INDEX[colStage] ?? 0;
  if (ci < vi) return "done";
  if (ci === vi) return "active";
  return "pending";
}

function etaLabel(v: Vehicle, dispatch?: DispatchRecord): string {
  const norm = normalizeStage(v.currentStage);
  if (dispatch?.status.toLowerCase() === "delivered") {
    return `Delivered on ${new Date(dispatch.deliveredTime || Date.now()).toLocaleDateString()}`;
  }
  if (norm === "dispatch" && dispatch?.scheduledDate) {
    return `Shipped on ${new Date(dispatch.scheduledDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
  }
  const eta = new Date(v.estimatedDelivery);
  const now = new Date();
  const diff = Math.ceil((eta.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return "Delivery overdue";
  if (diff === 0) return "Estimated delivery: Today";
  return `Est. delivery in ${diff} day${diff !== 1 ? "s" : ""}`;
}

function isDelayed(v: Vehicle): boolean {
  const norm = normalizeStage(v.currentStage);
  if (norm === "dispatch") return false;
  return new Date(v.estimatedDelivery) < new Date();
}

// ─── Stage progress bar ───────────────────────────────────────────────────────
function StageProgressBar({ vehicle }: { vehicle: Vehicle }) {
  const normStage = normalizeStage(vehicle.currentStage);
  const currentIdx = STAGE_INDEX[normStage] ?? 0;
  const delayed = isDelayed(vehicle);
  const fillColor =
    normStage === "dispatch"
      ? "bg-success"
      : delayed
        ? "bg-warning"
        : "bg-primary";

  return (
    <div className="w-full">
      <div className="relative flex items-center justify-between mb-2">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-border" />
        <motion.div
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-[2px] ${fillColor}`}
          initial={{ width: 0 }}
          animate={{
            width: `${(Math.max(0, currentIdx) / (STAGES.length - 1)) * 100}%`,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {STAGES.map((s, i) => {
          const status = stageStatus(normStage, s.key);
          return (
            <div
              key={s.key}
              className="relative z-10 flex flex-col items-center gap-1"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                  status === "done"
                    ? "bg-success text-success-foreground"
                    : status === "active"
                      ? delayed
                        ? "bg-warning text-white ring-4 ring-warning/20"
                        : "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {status === "done" ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <span className="text-[10px] font-bold">{i + 1}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between">
        {STAGES.map((s) => {
          const status = stageStatus(normStage, s.key);
          return (
            <span
              key={s.key}
              className={`text-[9px] font-medium text-center leading-tight ${
                status === "active"
                  ? delayed
                    ? "text-warning"
                  : "text-primary"
                  : status === "done"
                    ? "text-success"
                  : "text-muted-foreground"
              }`}
              style={{ width: "18%" }}
            >
              {s.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Order timeline ───────────────────────────────────────────────────────────
function OrderTimeline({ vehicle, dispatch }: { vehicle: Vehicle, dispatch?: DispatchRecord }) {
  
  const timelineEvents = [
    { label: "OEM Submitted", time: vehicle.submittedAt, icon: <Activity size={14} /> },
    { label: "Gate Entry Verification", time: vehicle.gateEntryTime, icon: <CheckCircle2 size={14} /> },
    { label: "Production Started", time: vehicle.receivedAt, icon: <PenTool size={14} /> },
    { label: "Ready For Dispatch", time: normalizeStage(vehicle.currentStage) === "rtd" || normalizeStage(vehicle.currentStage) === "dispatch" ? (new Date(new Date(vehicle.receivedAt).getTime() + 86400000*2).toISOString()) : null, icon: <Package size={14} /> },
    { label: "Dispatched", time: dispatch?.scheduledDate, icon: <Truck size={14} /> },
    { label: "Delivered", time: dispatch?.deliveredTime, icon: <MapPin size={14} /> }
  ];

  return (
    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {timelineEvents.map((evt, i) => {
        const isCompleted = !!evt.time;
        return (
          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 border-card shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {evt.icon}
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card p-3 rounded-xl border border-border shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h5 className={`font-semibold text-sm ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>{evt.label}</h5>
                {isCompleted && <CheckCircle2 size={14} className="text-success" />}
              </div>
              <time className="text-xs text-muted-foreground font-mono">
                {isCompleted ? new Date(evt.time as string).toLocaleString() : "Pending"}
              </time>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Individual order card ────────────────────────────────────────────────────
function OrderCard({
  vehicle,
  dispatch,
  canEdit,
  onAction,
}: {
  vehicle: Vehicle;
  dispatch?: DispatchRecord;
  canEdit: boolean;
  onAction: (action: string, vehicle: Vehicle) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const delayed = isDelayed(vehicle);
  const normStage = normalizeStage(vehicle.currentStage);
  const idx = STAGE_INDEX[normStage] ?? 0;
  const currentStageInfo = idx >= 0 ? STAGES[idx] : {
    key: normStage,
    label: normStage === "rejected" ? "Rejected" : "OEM Submitted",
    friendlyLabel: normStage === "rejected" ? "Rejected by production" : "Submitted for verification",
    icon: <Clock size={14} />,
  };
  const etaText = etaLabel(vehicle, dispatch);

  const updateDispatchMutation = useUpdateDispatchRecord();
  
  const handleDeliveryConfirm = () => {
    if (dispatch && dispatch.status !== "Delivered") {
      updateDispatchMutation.mutate({
        id: dispatch.id,
        data: { status: "Delivered", deliveryRemarks: "Confirmed via portal" }
      });
    }
  };

  return (
    <motion.div
      layout
      className={`bg-card border rounded-2xl overflow-hidden shadow-sm transition-shadow duration-200 hover:shadow-md ${
        delayed
          ? "border-warning/50"
          : normStage === "dispatch"
            ? "border-success/40"
            : "border-border"
      }`}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left cursor-pointer"
      >
        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">
                  {vehicle.trackingId}
                </span>
                {delayed && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30">
                    Delayed
                  </span>
                )}
                {vehicle.gateEntryNumber && (
                   <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary-foreground border border-border">
                     Gate: {vehicle.gateEntryNumber}
                   </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-foreground mt-0.5">
                {vehicle.vehicleNumber}
              </h3>
              <p className="text-sm text-muted-foreground">
                {vehicle.productCategory} • {vehicle.vehicleType || "Standard"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                  normStage === "dispatch"
                    ? "bg-success/10 text-success border border-success/20"
                    : delayed
                      ? "bg-warning/10 text-warning border border-warning/20"
                      : "bg-primary/10 text-primary border border-primary/20"
                }`}
              >
                {normStage === "dispatch" ? (
                  <Truck size={11} />
                ) : (
                  <Clock size={11} />
                )}
                {currentStageInfo.label}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
                {canEdit && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-muted rounded text-muted-foreground">
                          <MoreVertical size={14} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Enterprise Admin</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setTimeout(() => onAction('edit', vehicle), 0)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Vehicle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTimeout(() => onAction('approve', vehicle), 0)}>
                          <Check className="mr-2 h-4 w-4 text-success" /> Approve Order
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTimeout(() => onAction('reject', vehicle), 0)}>
                          <AlertTriangle className="mr-2 h-4 w-4 text-destructive" /> Reject Order
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setTimeout(() => onAction('history', vehicle), 0)}>
                          <History className="mr-2 h-4 w-4 text-muted-foreground" /> Audit History
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>
          </div>

          <StageProgressBar vehicle={vehicle} />

          <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  normStage === "dispatch"
                    ? "bg-success"
                    : delayed
                      ? "bg-warning animate-pulse"
                      : "bg-primary animate-pulse"
                }`}
              />
              <p className="text-sm text-foreground font-medium">
                {currentStageInfo.friendlyLabel}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar size={13} className="text-muted-foreground" />
              <span
                className={`font-semibold ${
                  normStage === "dispatch"
                    ? "text-success"
                    : delayed
                      ? "text-warning"
                      : "text-foreground"
                }`}
              >
                {etaText}
              </span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border bg-muted/10">
              <div className="p-5 space-y-8">
                
                {/* Vehicle Details Grid */}
                <div>
                   <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    Vehicle Details
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-card rounded-xl p-3 border border-border shadow-sm">
                      <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Dealer</p>
                      <p className="text-sm font-semibold text-foreground">{vehicle.dealerName || "N/A"}</p>
                    </div>
                    <div className="bg-card rounded-xl p-3 border border-border shadow-sm">
                      <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Platform Number</p>
                      <p className="text-sm font-semibold text-foreground font-mono">{vehicle.platformNumber || "N/A"}</p>
                    </div>
                    <div className="bg-card rounded-xl p-3 border border-border shadow-sm">
                      <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Chassis Number</p>
                      <p className="text-sm font-semibold text-foreground font-mono">{vehicle.chassisNumber || "N/A"}</p>
                    </div>
                    <div className="bg-card rounded-xl p-3 border border-border shadow-sm">
                      <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Supervisor</p>
                      <p className="text-sm font-semibold text-foreground">{vehicle.workers?.find(w => w.role === "supervisor")?.name || "Unassigned"}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    Live Timeline
                  </h4>
                  <OrderTimeline vehicle={vehicle} dispatch={dispatch} />
                </div>

                {/* Dispatch Details */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    Dispatch & Logistics
                  </h4>
                  {dispatch ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="bg-card rounded-xl p-4 border border-border shadow-sm col-span-1 sm:col-span-2">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Truck size={18} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium mb-0.5">Transport Company</p>
                            <p className="text-base font-bold text-foreground">{dispatch.carrier}</p>
                            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin size={12}/> {dispatch.destination}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                        <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Tracking Number</p>
                        <p className="text-sm font-bold text-foreground font-mono mb-2">{dispatch.trackingNumber}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Driver / Truck</p>
                        <p className="text-sm font-semibold text-foreground">{vehicle.driverName || "N/A"} • {vehicle.truckNumber || "N/A"}</p>
                      </div>

                      <div className="bg-card rounded-xl p-4 border border-border shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-20">
                          {dispatch.status.toLowerCase() === "delivered" ? <CheckCircle2 size={40} className="text-success" /> : <Clock size={40} />}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Delivery Status</p>
                        <p className={`text-lg font-black mb-2 ${dispatch.status.toLowerCase() === "delivered" ? "text-success" : "text-primary"}`}>
                          {dispatch.status}
                        </p>
                        {dispatch.status.toLowerCase() !== "delivered" && (
                          <button
                            onClick={handleDeliveryConfirm}
                            disabled={updateDispatchMutation.isPending}
                            className="w-full bg-success text-success-foreground text-xs font-bold py-2 rounded-lg hover:bg-success/90 transition-colors shadow-sm"
                          >
                            {updateDispatchMutation.isPending ? "Confirming..." : "Confirm Delivery"}
                          </button>
                        )}
                        {dispatch.status.toLowerCase() === "delivered" && dispatch.deliveredTime && (
                           <p className="text-xs text-muted-foreground font-medium">
                             {new Date(dispatch.deliveredTime).toLocaleString()}
                           </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/40 rounded-xl p-6 text-center border border-border/60">
                      <Truck
                        size={24}
                        className="text-muted-foreground mx-auto mb-2 opacity-60"
                      />
                      <p className="text-sm text-muted-foreground font-medium">
                        Dispatch details will appear once your order is shipped.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
function DashboardStats({ vehicles, dispatchRecords }: { vehicles: Vehicle[], dispatchRecords: DispatchRecord[] }) {
  const total = vehicles.length;
  const inProduction = vehicles.filter(v => v.currentStage === "fabrication" || v.currentStage === "paint").length;
  const qcPending = vehicles.filter(v => v.qcStatus === "Pending").length;
  const rtd = vehicles.filter(v => normalizeStage(v.currentStage) === "rtd").length;
  const dispatched = vehicles.filter(v => normalizeStage(v.currentStage) === "dispatch").length;
  const delivered = dispatchRecords.filter(d => d.status.toLowerCase() === "delivered").length;
  const delayed = vehicles.filter(isDelayed).length;

  const kpis = [
    { label: "Total Orders", value: total, icon: <Package size={16}/>, color: "text-foreground", bg: "bg-muted" },
    { label: "In Production", value: inProduction, icon: <PenTool size={16}/>, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "QC Pending", value: qcPending, icon: <Activity size={16}/>, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Ready to Ship", value: rtd, icon: <CheckCircle2 size={16}/>, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "In Transit", value: dispatched - delivered, icon: <Truck size={16}/>, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Delivered", value: delivered, icon: <MapPin size={16}/>, color: "text-success", bg: "bg-success/10" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {kpis.map((kpi, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col items-center text-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${kpi.bg} ${kpi.color}`}>
            {kpi.icon}
          </div>
          <p className="text-2xl font-black text-foreground leading-none mb-1">{kpi.value}</p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{kpi.label}</p>
        </div>
      ))}
      {delayed > 0 && (
         <div className="col-span-2 md:col-span-3 lg:col-span-6 bg-warning/10 border border-warning/30 rounded-xl p-3 flex items-center justify-center gap-2">
            <AlertTriangle size={16} className="text-warning" />
            <p className="text-sm text-warning font-semibold">{delayed} orders are currently delayed past their estimated delivery date.</p>
         </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OEMPortalPage() {
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles();
  const { data: dispatchRecords = [], isLoading: isLoadingDispatch } = useDispatchRecords();
  const oemSubmitMutation = useOemSubmitVehicle();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const { useAuthStore } = require("@/store/authStore");
  const userRole = useAuthStore((state: any) => state.role) || "operator";
  const canEdit = ["admin", "owner"].includes(userRole);

  const { useUpdateVehicleStage } = require("@/hooks/useQueries");
  const updateStageMutation = useUpdateVehicleStage();

  const [editRecord, setEditRecord] = useState<Vehicle | null>(null);
  const [approveRecord, setApproveRecord] = useState<Vehicle | null>(null);
  const [rejectRecord, setRejectRecord] = useState<Vehicle | null>(null);
  const [historyRecord, setHistoryRecord] = useState<Vehicle | null>(null);

  const filtered = useMemo(() => {
    let list = [...vehicles];
    
    // Sort by newest first
    list.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v => 
        v.trackingId.toLowerCase().includes(q) ||
        v.vehicleNumber.toLowerCase().includes(q) ||
        v.productCategory.toLowerCase().includes(q)
      );
    }
    return list;
  }, [vehicles, search]);

  const isSearching = search.trim().length > 0;

  const handleAction = (action: string, vehicle: Vehicle) => {
    switch (action) {
      case 'edit':
        setEditRecord(vehicle);
        break;
      case 'approve':
        setApproveRecord(vehicle);
        break;
      case 'reject':
        setRejectRecord(vehicle);
        break;
      case 'history':
        setHistoryRecord(vehicle);
        break;
    }
  };

  if (isLoadingVehicles || isLoadingDispatch) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-lg" />
        <div className="h-24 w-full bg-card border border-border rounded-xl" />
        <div className="h-64 bg-card border border-border rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-black text-xs">
                  FF
                </span>
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground tracking-tight">
                  Live Tracking Portal
                </h1>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                  Enterprise Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Add Vehicle Dispatch</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Top-Level KPIs */}
        {!isSearching && (
          <DashboardStats vehicles={vehicles} dispatchRecords={dispatchRecords} />
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search by tracking ID, vehicle number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 bg-card rounded-xl border-border text-sm shadow-sm"
          />
        </div>

        {/* Vehicle List */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
             <div className="flex flex-col items-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 border border-border/40">
                <Search size={24} className="text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                No orders found
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {isSearching ? "Adjust your search terms to find orders." : "You have not submitted any vehicles yet."}
              </p>
            </div>
          ) : (
              filtered.map((v) => (
                <OrderCard
                  key={v.id}
                  vehicle={v}
                  dispatch={dispatchRecords.find((d: DispatchRecord) => String(d.vehicleId) === String(v.id))}
                  canEdit={canEdit}
                  onAction={handleAction}
                />
             ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddVehicleDialog
            onClose={() => setShowAddModal(false)}
            onAdd={(data) => {
              oemSubmitMutation.mutate(data, {
                onSuccess: () => setShowAddModal(false)
              });
            }}
            isOemSubmission={true}
          />
        )}
      </AnimatePresence>
      <EditRecordDialog
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
        title={`Edit Vehicle ${editRecord?.vehicleNumber}`}
        fields={editRecord ? [
          { name: "vehicleNumber", label: "Vehicle Number", type: "text", defaultValue: editRecord.vehicleNumber },
          { name: "trackingId", label: "Tracking ID", type: "text", defaultValue: editRecord.trackingId },
          { name: "productCategory", label: "Product Category", type: "text", defaultValue: editRecord.productCategory },
        ] : []}
        onSubmit={(data) => {
          // Reusing vehicle update mutation from queries or just call a new one
        }}
        isSubmitting={false}
      />

      <ReasonPromptDialog
        open={!!approveRecord}
        onOpenChange={(open) => !open && setApproveRecord(null)}
        title="Approve Order"
        description={`Are you sure you want to approve order ${approveRecord?.vehicleNumber} and move it to production?`}
        onSubmit={(reason) => {
          if (!approveRecord) return;
          updateStageMutation.mutate({ 
            id: approveRecord.id.toString(), 
            stage: "received", 
            reason 
          }, {
            onSuccess: () => setApproveRecord(null)
          });
        }}
      />

      <ReasonPromptDialog
        open={!!rejectRecord}
        onOpenChange={(open) => !open && setRejectRecord(null)}
        title="Reject Order"
        description={`Are you sure you want to reject order ${rejectRecord?.vehicleNumber}?`}
        onSubmit={(reason) => {
          if (!rejectRecord) return;
          updateStageMutation.mutate({ 
            id: rejectRecord.id.toString(), 
            stage: "rejected", 
            reason 
          }, {
            onSuccess: () => setRejectRecord(null)
          });
        }}
      />

      <AuditHistoryDrawer
        open={!!historyRecord}
        onOpenChange={(open) => !open && setHistoryRecord(null)}
        recordId={historyRecord?.id?.toString() || ""}
        module="vehicles"
        title={`Audit History: Vehicle ${historyRecord?.vehicleNumber}`}
      />
    </div>
  );
}
