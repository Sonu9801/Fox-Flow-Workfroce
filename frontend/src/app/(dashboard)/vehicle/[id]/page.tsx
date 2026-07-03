"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useVehicles, useWorkers, useQCRecords, useDispatchRecords, useActivities } from "@/hooks/useQueries";
import type { ActivityEvent, DispatchRecord, QCRecord, Stage, Vehicle, Worker } from "@/types";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Download,
  FileText,
  Package,
  Tag,
  Truck,
  Upload,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { motion } from "motion/react";

const STAGES: { id: string; label: string }[] = [
  { id: "received", label: "Received" },
  { id: "fabrication", label: "Fabrication" },
  { id: "paint", label: "Paint" },
  { id: "quality_check", label: "Quality Check" },
  { id: "rtd", label: "Ready to Dispatch" },
  { id: "dispatch", label: "Dispatched" },
];

const STAGE_ORDER: Record<string, number> = {
  received: 0,
  fabrication: 1,
  paint: 2,
  quality_check: 3,
  rtd: 4,
  dispatch: 5,
};

function getStageIndex(stage: string): number {
  const s = stage.toLowerCase();
  if (s === "rtd" || s === "readytodispatch") return 4;
  if (s === "dispatch" || s === "dispatched") return 5;
  if (s === "quality_check" || s === "qc") return 3;
  return STAGE_ORDER[s] ?? 0;
}

const PHOTO_GRADIENTS = [
  "from-indigo-500/30 to-purple-500/30",
  "from-blue-500/30 to-cyan-500/30",
  "from-emerald-500/30 to-teal-500/30",
  "from-orange-500/30 to-amber-500/30",
  "from-pink-500/30 to-rose-500/30",
  "from-violet-500/30 to-indigo-500/30",
  "from-sky-500/30 to-blue-500/30",
  "from-green-500/30 to-emerald-500/30",
  "from-purple-500/30 to-pink-500/30",
];

const PHOTO_LABELS = [
  "Intake Inspection",
  "Fabrication Start",
  "Frame Assembly",
  "Welding Complete",
  "Pre-Paint Surface",
  "Paint Application",
  "Paint Cured",
  "QC Inspection",
  "Ready for Dispatch",
];

const activityConfig: Record<
  string,
  { dot: string; bg: string; textClass: string; label: string }
> = {
  stage_changed: {
    dot: "bg-primary",
    bg: "bg-primary/10",
    textClass: "text-primary",
    label: "Stage",
  },
  qc_passed: {
    dot: "bg-success",
    bg: "bg-success/10",
    textClass: "text-success",
    label: "QC",
  },
  qc_failed: {
    dot: "bg-destructive",
    bg: "bg-destructive/10",
    textClass: "text-destructive",
    label: "QC",
  },
  worker_started: {
    dot: "bg-blue-500",
    bg: "bg-blue-500/10",
    textClass: "text-blue-500",
    label: "Worker",
  },
  vehicle_dispatched: {
    dot: "bg-success",
    bg: "bg-success/10",
    textClass: "text-success",
    label: "Dispatch",
  },
  emergency_created: {
    dot: "bg-destructive",
    bg: "bg-destructive/10",
    textClass: "text-destructive",
    label: "Alert",
  },
};

function InfoRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground mt-0.5 flex-shrink-0">{icon}</span>
      <span className="text-xs text-muted-foreground w-24 flex-shrink-0 pt-px">
        {label}
      </span>
      <span
        className={cn(
          "text-xs font-semibold text-foreground break-words min-w-0 flex-1",
          mono && "font-mono",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 border",
        accent
          ? "bg-primary/5 border-primary/20"
          : "bg-muted/40 border-border/60",
      )}
    >
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>
      <p
        className={cn(
          "text-sm font-bold",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function ActivityEntry({
  event,
  index,
}: { event: ActivityEvent; index: number }) {
  const cfg = activityConfig[event.eventType] ?? activityConfig.stage_changed;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex gap-3"
    >
      <div className="flex flex-col items-center">
        <div
          className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1", cfg.dot)}
        />
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      <div className="pb-4 min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={cn(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded",
              cfg.bg,
              cfg.textClass,
            )}
          >
            {cfg.label}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(event.timestamp).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <p className="text-xs text-foreground leading-relaxed">
          {event.description}
        </p>
      </div>
    </motion.div>
  );
}

function QCRecordRow({ record, index }: { record: QCRecord; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-2"
      data-ocid={`vehicle_detail.qc.item.${index + 1}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-full",
              record.result === "passed"
                ? "bg-success/15 text-success border border-success/30"
                : record.result === "failed"
                  ? "bg-destructive/15 text-destructive border border-destructive/30"
                  : "bg-warning/15 text-warning border border-warning/30",
            )}
          >
            {record.result === "passed"
              ? "✓ Passed"
              : record.result === "failed"
                ? "✗ Failed"
                : "⚠ Conditional"}
          </span>
          <span className="text-xs text-muted-foreground">
            {record.inspectorName}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {new Date(record.inspectedAt || "").toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
      {record.notes && (
        <p className="text-xs text-muted-foreground">{record.notes}</p>
      )}
      {(record.defectsFound || 0) > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
          {record.defectsFound || 0} defect{(record.defectsFound || 0) > 1 ? "s" : ""} found
        </div>
      )}
    </motion.div>
  );
}

export default function VehicleDetailPage() {
  const { id } = useParams() as { id: string };
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles();
  const { data: workers = [], isLoading: isLoadingWorkers } = useWorkers();
  const { data: qcRecords = [], isLoading: isLoadingQC } = useQCRecords();
  const { data: dispatchRecords = [], isLoading: isLoadingDispatch } = useDispatchRecords();
  const { data: activities = [], isLoading: isLoadingActivities } = useActivities();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const vehicle = useMemo(() => {
    return vehicles.find((v: Vehicle) => String(v.id) === String(id));
  }, [vehicles, id]);

  const isLoading = isLoadingVehicles || isLoadingWorkers || isLoadingQC || isLoadingDispatch || isLoadingActivities;

  const assignedWorkers = useMemo(() => {
    if (!vehicle || !workers.length) return [];
    return workers.filter((w: Worker) =>
      vehicle.assignedWorkerIds?.includes(w.id),
    );
  }, [vehicle, workers]);

  const vehicleQC = useMemo(() => {
    if (!vehicle) return [];
    return qcRecords.filter((q: QCRecord) => String(q.vehicleId) === String(vehicle.id));
  }, [qcRecords, vehicle]);

  const vehicleDispatch = useMemo(() => {
    if (!vehicle) return undefined;
    return dispatchRecords.find((d: DispatchRecord) => String(d.vehicleId) === String(vehicle.id));
  }, [dispatchRecords, vehicle]);

  const vehicleActivities = useMemo(() => {
    if (!vehicle) return [];
    return activities
      .filter((a: ActivityEvent) => String(a.vehicleId) === String(vehicle.id))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 20);
  }, [activities, vehicle]);

  const stats = useMemo(() => {
    if (!vehicle) return null;
    const receivedDate = new Date(vehicle.receivedAt);
    const etaDate = new Date(vehicle.estimatedDelivery);
    const now = new Date();
    const norm = vehicle.currentStage.toLowerCase();
    const isDelayed = etaDate < now && norm !== "dispatch" && norm !== "dispatched";
    const daysRemaining = Math.ceil(
      (etaDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysInFactory = Math.ceil(
      (now.getTime() - receivedDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const currentStageIdx = getStageIndex(vehicle.currentStage);
    return { receivedDate, etaDate, isDelayed, daysRemaining, daysInFactory, currentStageIdx };
  }, [vehicle]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-14 w-full bg-card border border-border rounded-xl" />
        <div className="h-64 bg-card border border-border rounded-xl" />
      </div>
    );
  }

  if (!vehicle || !stats) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-6 p-8"
        data-ocid="vehicle_detail.not_found"
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Package size={28} className="text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">
            Vehicle Not Found
          </h2>
          <p className="text-sm text-muted-foreground">
            The vehicle with ID{" "}
            <span className="font-mono text-foreground">{id}</span> does not
            exist.
          </p>
        </div>
        <Link href="/" data-ocid="vehicle_detail.back_button">
          <Button variant="outline" className="gap-2">
            <ArrowLeft size={15} /> Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full" data-ocid="vehicle_detail.page">
      <div className="px-6 pt-5 pb-0">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4"
          data-ocid="vehicle_detail.breadcrumb"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight size={12} />
          <Link
            href="/production"
            className="hover:text-foreground transition-colors"
          >
            Production
          </Link>
          <ChevronRight size={12} />
          <span className="text-foreground font-semibold">
            {vehicle.trackingId}
          </span>
        </nav>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5"
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
                {vehicle.vehicleNumber}
              </h1>
              <PriorityBadge priority={vehicle.priority} />
              <StatusBadge stage={vehicle.currentStage} />
              {stats.isDelayed && (
                <Badge
                  variant="destructive"
                  className="text-[10px] px-2 py-0.5 font-semibold animate-pulse"
                >
                  Delayed
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span
                className="font-mono text-xs bg-muted px-2 py-0.5 rounded"
                data-ocid="vehicle_detail.tracking_id"
              >
                {vehicle.trackingId}
              </span>
              <span className="flex items-center gap-1">
                <Building2 size={12} /> {vehicle.oemName}
              </span>
              <span className="flex items-center gap-1">
                <Package size={12} /> {vehicle.productCategory}
              </span>
            </div>
          </div>
          <div
            className="flex items-center gap-2 flex-wrap"
            data-ocid="vehicle_detail.actions"
          >
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              data-ocid="vehicle_detail.update_stage_button"
            >
              <Tag size={13} /> Update Stage
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              data-ocid="vehicle_detail.add_worker_button"
            >
              <UserPlus size={13} /> Add Worker
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              data-ocid="vehicle_detail.upload_photo_button"
            >
              <Upload size={13} /> Upload Photo
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              data-ocid="vehicle_detail.export_pdf_button"
            >
              <Download size={13} /> Export PDF
            </Button>
          </div>
        </motion.div>

        {/* Horizontal Manufacturing Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-5 mb-5 shadow-subtle"
          data-ocid="vehicle_detail.timeline"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Manufacturing Progress
            </h2>
            <span className="text-xs text-muted-foreground">
              Stage {stats.currentStageIdx + 1} of {STAGES.length}
            </span>
          </div>
          <div className="flex items-start overflow-x-auto pb-1">
            {STAGES.map((stage, index) => {
              const isDone = index < stats.currentStageIdx;
              const isActive = index === stats.currentStageIdx;
              const isLast = index === STAGES.length - 1;
              return (
                <div key={stage.id} className="flex items-start flex-shrink-0">
                  <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: isActive ? [1, 1.08, 1] : 1 }}
                      transition={{
                        duration: isActive ? 2 : 0.3,
                        repeat: isActive ? Number.POSITIVE_INFINITY : 0,
                        delay: 0.2 + index * 0.06,
                      }}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                        isDone &&
                          "bg-success border-success text-success-foreground shadow-sm",
                        isActive &&
                          "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/30",
                        !isDone &&
                          !isActive &&
                          "bg-muted border-border text-muted-foreground",
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 size={14} />
                      ) : isActive ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
                      ) : (
                        <Circle size={12} />
                      )}
                    </motion.div>
                    <span
                      className={cn(
                        "text-[10px] font-medium text-center leading-tight max-w-[68px]",
                        isActive
                          ? "text-primary"
                          : isDone
                            ? "text-success"
                            : "text-muted-foreground",
                      )}
                    >
                      {stage.label}
                    </span>
                    {isActive && (
                      <span className="text-[9px] text-primary/70 font-semibold uppercase tracking-wide">
                        Current
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[9px] text-success/70 font-semibold">
                        ✓
                      </span>
                    )}
                  </div>
                  {!isLast && (
                    <div className="flex items-center mt-4">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{
                          delay: 0.3 + index * 0.08,
                          duration: 0.4,
                        }}
                        style={{ transformOrigin: "left" }}
                        className={cn(
                          "h-0.5 w-8 sm:w-12 transition-colors duration-500",
                          index < stats.currentStageIdx ? "bg-success" : "bg-border",
                        )}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Overall completion</span>
              <span className="font-bold text-foreground">
                {vehicle.progressPercent}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${vehicle.progressPercent}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                className={cn(
                  "h-full rounded-full transition-colors",
                  vehicle.progressPercent === 100
                    ? "bg-success"
                    : stats.isDelayed
                      ? "bg-destructive"
                      : "bg-primary",
                )}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex-1 px-6 pb-6">
        <Tabs
          defaultValue="overview"
          className="w-full"
          data-ocid="vehicle_detail.tabs"
        >
          <TabsList className="mb-5 h-9" data-ocid="vehicle_detail.tab_list">
            <TabsTrigger
              value="overview"
              className="text-xs"
              data-ocid="vehicle_detail.tab.overview"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="qc"
              className="text-xs"
              data-ocid="vehicle_detail.tab.qc"
            >
              QC Records {vehicleQC.length > 0 && `(${vehicleQC.length})`}
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="text-xs"
              data-ocid="vehicle_detail.tab.activity"
            >
              Activity Log
            </TabsTrigger>
            <TabsTrigger
              value="dispatch"
              className="text-xs"
              data-ocid="vehicle_detail.tab.dispatch"
            >
              Dispatch
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Vehicle Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-card border border-border rounded-xl p-4 shadow-subtle"
                data-ocid="vehicle_detail.info_card"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                    <Package size={12} className="text-primary" />
                  </div>
                  <h3 className="text-xs font-semibold text-foreground">
                    Vehicle Info
                  </h3>
                </div>
                <InfoRow
                  icon={<Tag size={12} />}
                  label="VIN"
                  value={vehicle.vehicleNumber}
                  mono
                />
                <InfoRow
                  icon={<Tag size={12} />}
                  label="Tracking ID"
                  value={vehicle.trackingId}
                  mono
                />
                <InfoRow
                  icon={<Package size={12} />}
                  label="Category"
                  value={vehicle.productCategory}
                />
                <InfoRow
                  icon={<Building2 size={12} />}
                  label="OEM"
                  value={vehicle.oemName}
                />
                {vehicle.notes && (
                  <InfoRow
                    icon={<FileText size={12} />}
                    label="Notes"
                    value={vehicle.notes}
                  />
                )}
              </motion.div>

              {/* Timing Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-xl p-4 shadow-subtle"
                data-ocid="vehicle_detail.timing_card"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-warning/10 flex items-center justify-center">
                    <Clock size={12} className="text-warning" />
                  </div>
                  <h3 className="text-xs font-semibold text-foreground">
                    Timing
                  </h3>
                </div>
                <InfoRow
                  icon={<Calendar size={12} />}
                  label="Received"
                  value={stats.receivedDate.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                />
                <InfoRow
                  icon={<Clock size={12} />}
                  label="Est. Delivery"
                  value={stats.etaDate.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                />
                <InfoRow
                  icon={<Clock size={12} />}
                  label="In Factory"
                  value={`${stats.daysInFactory} day${stats.daysInFactory !== 1 ? "s" : ""}`}
                />
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <StatCard
                    label="Days Left"
                    value={stats.daysRemaining > 0 ? `${stats.daysRemaining}d` : "0d"}
                    accent={!stats.isDelayed}
                  />
                  <StatCard
                    label="Status"
                    value={stats.isDelayed ? "Overdue" : "On Track"}
                    sub={
                      stats.isDelayed ? `${Math.abs(stats.daysRemaining)}d late` : undefined
                    }
                    accent={!stats.isDelayed}
                  />
                </div>
                {stats.isDelayed && (
                  <div
                    className="mt-2 text-[10px] text-destructive bg-destructive/10 border border-destructive/20 rounded px-2 py-1.5 flex items-center gap-1.5"
                    data-ocid="vehicle_detail.overdue_indicator"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                    Order is past estimated delivery
                  </div>
                )}
              </motion.div>

              {/* Assignment Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-card border border-border rounded-xl p-4 shadow-subtle"
                data-ocid="vehicle_detail.assignment_card"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                      <User size={12} className="text-blue-500" />
                    </div>
                    <h3 className="text-xs font-semibold text-foreground">
                      Assignment
                    </h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {assignedWorkers.length} worker{assignedWorkers.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {assignedWorkers.length === 0 ? (
                  <div
                    className="text-center py-4"
                    data-ocid="vehicle_detail.workers.empty_state"
                  >
                    <User
                      size={20}
                      className="text-muted-foreground mx-auto mb-2 opacity-50"
                    />
                    <p className="text-xs text-muted-foreground italic">
                      No workers assigned
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {assignedWorkers.map((w) => (
                      <div key={w.id} className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0 font-display">
                          {w.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {w.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {w.department}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize",
                            w.status.toLowerCase() === "active"
                              ? "bg-success/15 text-success"
                              : w.status.toLowerCase() === "break"
                                ? "bg-warning/15 text-warning"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {w.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <Separator className="my-3" />
                <InfoRow
                  icon={<Clock size={12} />}
                  label="Start time"
                  value={stats.receivedDate.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
              </motion.div>

              {/* Dispatch Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-xl p-4 shadow-subtle"
                data-ocid="vehicle_detail.dispatch_card"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-success/10 flex items-center justify-center">
                    <Truck size={12} className="text-success" />
                  </div>
                  <h3 className="text-xs font-semibold text-foreground">
                    Dispatch
                  </h3>
                </div>
                {!vehicleDispatch ? (
                  <div
                    className="text-center py-4"
                    data-ocid="vehicle_detail.dispatch.empty_state"
                  >
                    <Truck
                      size={20}
                      className="text-muted-foreground mx-auto mb-2 opacity-50"
                    />
                    <p className="text-xs text-muted-foreground italic">
                      Not yet scheduled
                    </p>
                  </div>
                ) : (
                  <div>
                    <InfoRow
                      icon={<Truck size={12} />}
                      label="Carrier"
                      value={vehicleDispatch.carrier}
                    />
                    <InfoRow
                      icon={<Building2 size={12} />}
                      label="Destination"
                      value={vehicleDispatch.destination}
                    />
                    <InfoRow
                      icon={<Tag size={12} />}
                      label="Tracking #"
                      value={vehicleDispatch.trackingNumber}
                      mono
                    />
                    <InfoRow
                      icon={<Calendar size={12} />}
                      label="Scheduled"
                      value={new Date(
                        vehicleDispatch.scheduledDate,
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    />
                    <div className="mt-2.5">
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          vehicleDispatch.status.toLowerCase() === "dispatched"
                            ? "bg-success/15 text-success"
                            : vehicleDispatch.status.toLowerCase() === "in_transit"
                              ? "bg-primary/15 text-primary"
                              : vehicleDispatch.status.toLowerCase() === "scheduled"
                                ? "bg-warning/15 text-warning"
                                : "bg-muted text-muted-foreground",
                        )}
                      >
                        {vehicleDispatch.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Photo Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-card border border-border rounded-xl p-5 shadow-subtle"
              data-ocid="vehicle_detail.photos_section"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Camera size={15} className="text-muted-foreground animate-pulse" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Photos
                  </h3>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 font-mono"
                  >
                    {PHOTO_LABELS.length}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs h-7"
                  data-ocid="vehicle_detail.photos.upload_button"
                >
                  <Upload size={12} /> Upload
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {PHOTO_GRADIENTS.map((gradient, i) => (
                  <motion.button
                    key={gradient}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLightboxIndex(i)}
                    className={cn(
                      "relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br cursor-pointer group border border-border/20",
                      gradient,
                    )}
                    data-ocid={`vehicle_detail.photo.item.${i + 1}`}
                    aria-label={`View photo: ${PHOTO_LABELS[i]}`}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                      <Camera size={16} className="text-foreground/40" />
                      <span className="text-[9px] text-foreground/50 font-medium px-1 text-center">
                        {PHOTO_LABELS[i]}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                      <span className="text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* QC Records Tab */}
          <TabsContent value="qc" className="mt-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
              data-ocid="vehicle_detail.qc_section"
            >
              {vehicleQC.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-border rounded-xl"
                  data-ocid="vehicle_detail.qc.empty_state"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <FileText size={20} className="text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">
                      No QC Records
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Quality control records will appear here once inspections
                      are completed.
                    </p>
                  </div>
                </div>
              ) : (
                vehicleQC.map((qc, i) => (
                  <QCRecordRow key={qc.id} record={qc} index={i} />
                ))
              )}
            </motion.div>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity" className="mt-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card border border-border rounded-xl p-5 shadow-subtle"
              data-ocid="vehicle_detail.activity_section"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Activity Log
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {vehicleActivities.length} events
                </span>
              </div>
              {vehicleActivities.length === 0 ? (
                <div
                  className="text-center py-10"
                  data-ocid="vehicle_detail.activity.empty_state"
                >
                  <Clock
                    size={20}
                    className="text-muted-foreground mx-auto mb-2 opacity-50"
                  />
                  <p className="text-sm text-muted-foreground italic">
                    No activity recorded yet
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {vehicleActivities.map((event, i) => (
                    <ActivityEntry key={event.id} event={event} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Dispatch Tab */}
          <TabsContent value="dispatch" className="mt-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
              data-ocid="vehicle_detail.dispatch_section"
            >
              {!vehicleDispatch ? (
                <div
                  className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-border rounded-xl"
                  data-ocid="vehicle_detail.dispatch.empty_state"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Truck size={20} className="text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Dispatch Not Scheduled
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Details will appear here once the vehicle is ready for
                      dispatch.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={cn(
                      "rounded-xl p-4 border flex items-center gap-3 shadow-subtle",
                      vehicleDispatch.status.toLowerCase() === "dispatched"
                        ? "bg-success/10 border-success/30"
                        : vehicleDispatch.status.toLowerCase() === "in_transit"
                          ? "bg-primary/10 border-primary/30"
                          : "bg-warning/10 border-warning/30",
                    )}
                    data-ocid="vehicle_detail.dispatch.status_banner"
                  >
                    <Truck
                      size={18}
                      className={cn(
                        vehicleDispatch.status.toLowerCase() === "dispatched"
                          ? "text-success"
                          : vehicleDispatch.status.toLowerCase() === "in_transit"
                            ? "text-primary"
                            : "text-warning",
                      )}
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground capitalize">
                        {vehicleDispatch.status.replace("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Scheduled for{" "}
                        {new Date(
                          vehicleDispatch.scheduledDate,
                        ).toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-xl p-4 shadow-subtle">
                      <h4 className="text-xs font-semibold text-foreground mb-3">
                        Carrier Information
                      </h4>
                      <InfoRow
                        icon={<Truck size={12} />}
                        label="Carrier"
                        value={vehicleDispatch.carrier}
                      />
                      <InfoRow
                        icon={<Building2 size={12} />}
                        label="Destination"
                        value={vehicleDispatch.destination}
                      />
                      <InfoRow
                        icon={<Calendar size={12} />}
                        label="Scheduled"
                        value={new Date(
                          vehicleDispatch.scheduledDate,
                        ).toLocaleDateString("en-IN")}
                      />
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4 shadow-subtle">
                      <h4 className="text-xs font-semibold text-foreground mb-3">
                        Tracking Details
                      </h4>
                      <InfoRow
                        icon={<Tag size={12} />}
                        label="Tracking #"
                        value={vehicleDispatch.trackingNumber}
                        mono
                      />
                      <InfoRow
                        icon={<Package size={12} />}
                        label="Vehicle"
                        value={vehicle.vehicleNumber}
                      />
                      <InfoRow
                        icon={<Tag size={12} />}
                        label="Order"
                        value={vehicle.trackingId}
                        mono
                      />
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-5 shadow-subtle">
                    <h4 className="text-xs font-semibold text-foreground mb-4">
                      Delivery Progress
                    </h4>
                    <div className="flex items-center">
                      {(
                        [
                          "Order Ready",
                          "Carrier Assigned",
                          "In Transit",
                          "Delivered",
                        ] as const
                      ).map((step, i) => {
                        const statusIdx = [
                          "pending",
                          "scheduled",
                          "in_transit",
                          "dispatched",
                        ].indexOf(vehicleDispatch.status.toLowerCase());
                        const isDone = i <= statusIdx;
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div className="flex flex-col items-center gap-1.5">
                              <div
                                className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center border-2 text-xs",
                                  isDone
                                    ? "bg-success border-success text-success-foreground"
                                    : "bg-muted border-border text-muted-foreground",
                                )}
                              >
                                {isDone ? (
                                  <CheckCircle2 size={12} />
                                ) : (
                                  <span>{i + 1}</span>
                                )}
                              </div>
                              <span className="text-[9px] text-center text-muted-foreground max-w-[56px] leading-tight">
                                {step}
                              </span>
                            </div>
                            {i < 3 && (
                              <div
                                className={cn(
                                  "h-0.5 flex-1 mx-1",
                                  i < statusIdx ? "bg-success" : "bg-border",
                                )}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Photo Lightbox */}
      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={() => setLightboxIndex(null)}
      >
        <DialogContent
          className="max-w-2xl p-0 overflow-hidden bg-background"
          data-ocid="vehicle_detail.lightbox.dialog"
        >
          <DialogTitle className="sr-only">Vehicle Photo Lightbox</DialogTitle>
          <div className="relative">
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
              data-ocid="vehicle_detail.lightbox.close_button"
              aria-label="Close lightbox"
            >
              <X size={14} />
            </button>
            {lightboxIndex !== null && (
              <div
                className={cn(
                  "aspect-video bg-gradient-to-br flex flex-col items-center justify-center gap-3",
                  PHOTO_GRADIENTS[lightboxIndex],
                )}
              >
                <Camera size={48} className="text-foreground/30 animate-pulse" />
                <p className="text-sm font-semibold text-foreground/60">
                  {PHOTO_LABELS[lightboxIndex]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {vehicle.vehicleNumber} · {vehicle.trackingId}
                </p>
              </div>
            )}
            {lightboxIndex !== null && (
              <div className="p-4 bg-card">
                <p className="text-sm font-semibold text-foreground">
                  {PHOTO_LABELS[lightboxIndex]}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {vehicle.oemName} · {vehicle.productCategory}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
