"use client";

import { KPICard } from "@/components/ui/KPICard";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useVehicles, useActivities } from "@/hooks/useQueries";
import { useUIStore } from "@/store/uiStore";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Factory,
  Inbox,
  Truck,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Vehicle, ActivityEvent, Stage } from "@/types";

const STAGE_ORDER: Stage[] = [
  "received",
  "fabrication",
  "paint",
  "rtd",
  "dispatch",
];

const STAGE_LABELS: Partial<Record<Stage, string>> = {
  oem: "OEM Submitted",
  rejected: "Rejected",
  received: "Received",
  fabrication: "Fabrication",
  paint: "Paint",
  rtd: "Ready for Dispatch",
  dispatch: "Dispatched",
};

const STAGE_COLORS: Partial<Record<Stage, string>> = {
  oem: "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20 hover:border-red-500/40 hover:bg-red-500/20",
  received:
    "bg-muted text-muted-foreground border-border hover:border-primary/40 hover:bg-primary/5",
  fabrication:
    "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15",
  paint: "bg-warning/10 text-warning border-warning/30 hover:bg-warning/15",
  rtd: "bg-success/10 text-success border-success/30 hover:bg-success/15",
  dispatch: "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted",
};

const EVENT_CONFIG: Record<
  string,
  { bg: string; icon: React.ReactNode; borderColor: string; pulse?: boolean }
> = {
  worker_started: {
    icon: <Factory size={11} />,
    bg: "bg-primary/15 text-primary",
    borderColor: "border-l-primary",
  },
  qc_passed: {
    icon: <CheckCircle2 size={11} />,
    bg: "bg-success/15 text-success",
    borderColor: "border-l-success",
  },
  qc_failed: {
    icon: <AlertTriangle size={11} />,
    bg: "bg-destructive/15 text-destructive",
    borderColor: "border-l-destructive",
  },
  vehicle_dispatched: {
    icon: <Truck size={11} />,
    bg: "bg-primary/10 text-primary",
    borderColor: "border-l-primary/60",
  },
  emergency_created: {
    icon: <Zap size={11} />,
    bg: "bg-destructive/15 text-destructive",
    borderColor: "border-l-destructive",
    pulse: true,
  },
  stage_changed: {
    icon: <Activity size={11} />,
    bg: "bg-warning/15 text-warning",
    borderColor: "border-l-warning",
  },
};

function ActivityItem({
  event,
  isNew,
}: { event: ActivityEvent; isNew?: boolean }) {
  const config = EVENT_CONFIG[event.eventType] ?? EVENT_CONFIG.stage_changed;
  const relTime = new Date(event.timestamp);
  const mins = Math.floor((Date.now() - relTime.getTime()) / 60000);
  const timeLabel =
    mins < 1
      ? "Just now"
      : mins < 60
        ? `${mins}m ago`
        : `${Math.floor(mins / 60)}h ago`;

  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: 24 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "flex gap-3 py-2.5 px-3 border-b border-border/40 hover:bg-muted/25 transition-smooth border-l-2",
        config.borderColor,
        event.eventType === "emergency_created" && "bg-destructive/5",
      )}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5",
          config.bg,
          event.eventType === "emergency_created" && "animate-pulse",
        )}
      >
        {config.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
          {event.description}
        </p>
        <span className="text-[10px] text-muted-foreground mt-0.5 block">
          {timeLabel}
        </span>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles();
  const { data: activities = [], isLoading: isLoadingActivities } = useActivities();
  const { searchQuery } = useUIStore();

  const isLoading = isLoadingVehicles || isLoadingActivities;

  // Filter vehicles by search query
  const filteredVehicles = vehicles.filter((v: Vehicle) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      v.vehicleNumber.toLowerCase().includes(query) ||
      v.trackingId.toLowerCase().includes(query) ||
      v.oemName.toLowerCase().includes(query)
    );
  });

  // Group vehicles by stage
  const vehiclesByStage = STAGE_ORDER.reduce<Partial<Record<Stage, Vehicle[]>>>(
    (acc, stage) => {
      // Stage strings on backend can be lowercase or title case
      acc[stage] = filteredVehicles.filter(
        (v: Vehicle) => v.currentStage.toLowerCase() === stage.toLowerCase()
      );
      return acc;
    },
    { oem: [], rejected: [], received: [], fabrication: [], paint: [], rtd: [], dispatch: [] }
  );

  // Compute live KPI Stats
  const stats = {
    vehiclesReceived: vehicles.length,
    inFabrication: vehicles.filter((v: Vehicle) => v.currentStage.toLowerCase() === "fabrication").length,
    inPaint: vehicles.filter((v: Vehicle) => v.currentStage.toLowerCase() === "paint").length,
    readyToDispatch: vehicles.filter(
      (v: Vehicle) => v.currentStage.toLowerCase() === "rtd" || v.currentStage.toLowerCase() === "readytodispatch"
    ).length,
    dispatchToday: vehicles.filter(
      (v: Vehicle) => v.currentStage.toLowerCase() === "dispatch" || v.currentStage.toLowerCase() === "dispatched"
    ).length,
    delayedOrders: vehicles.filter(
      (v: Vehicle) =>
        v.estimatedDelivery &&
        new Date(v.estimatedDelivery) < new Date() &&
        v.currentStage.toLowerCase() !== "dispatch" &&
        v.currentStage.toLowerCase() !== "dispatched"
    ).length,
    emergencyOrders: vehicles.filter(
      (v: Vehicle) =>
        v.priority.toLowerCase() === "urgent" &&
        v.currentStage.toLowerCase() !== "dispatch" &&
        v.currentStage.toLowerCase() !== "dispatched"
    ).length,
  };

  const kpiCards = [
    {
      title: "Vehicles Received",
      value: stats.vehiclesReceived,
      trend: "up" as const,
      trendValue: "+8%",
      sparklineData: [110, 125, 118, 130, 135, 140, 148],
      sparklineColor: "oklch(var(--primary))",
      icon: <Factory size={14} />,
    },
    {
      title: "In Fabrication",
      value: stats.inFabrication,
      trend: "up" as const,
      trendValue: "+5%",
      sparklineData: [60, 65, 70, 68, 72, 74, 75],
      sparklineColor: "oklch(var(--primary))",
      icon: <Activity size={14} />,
    },
    {
      title: "In Paint",
      value: stats.inPaint,
      trend: "down" as const,
      trendValue: "-3%",
      accentClass: "text-warning",
      sparklineData: [38, 35, 36, 34, 33, 32, 32],
      sparklineColor: "oklch(var(--warning))",
    },
    {
      title: "RTD",
      value: stats.readyToDispatch,
      trend: "up" as const,
      trendValue: "+12%",
      accentClass: "text-success",
      sparklineData: [70, 75, 80, 82, 85, 88, 91],
      sparklineColor: "oklch(var(--success))",
      icon: <CheckCircle2 size={14} />,
    },
    {
      title: "Dispatch Today",
      value: stats.dispatchToday,
      trend: "up" as const,
      trendValue: "+18%",
      accentClass: "text-success",
      sparklineData: [90, 95, 100, 105, 108, 112, 115],
      sparklineColor: "oklch(var(--success))",
      icon: <Truck size={14} />,
    },
    {
      title: "Delayed Orders",
      value: stats.delayedOrders,
      trend: "down" as const,
      trendValue: "-2",
      accentClass: "text-warning",
      sparklineData: [16, 15, 14, 14, 13, 13, 12],
      sparklineColor: "oklch(var(--warning))",
      highlight: "warning",
      icon: <AlertTriangle size={14} />,
    },
    {
      title: "Emergency",
      value: stats.emergencyOrders,
      trend: "up" as const,
      trendValue: "+1",
      accentClass: "text-destructive",
      sparklineData: [2, 2, 3, 3, 4, 4, 4],
      sparklineColor: "oklch(var(--destructive))",
      highlight: "destructive",
      icon: <Zap size={14} />,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-full">
        <div className="flex-1 min-w-0 overflow-y-auto p-6">
          <div className="mb-6">
            <Skeleton className="h-7 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7].map((k) => (
              <div
                key={k}
                className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3"
              >
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <Skeleton className="h-4 w-40 mb-4" />
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((k) => (
                <Skeleton key={k} className="h-14 flex-1 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex h-full flex-col md:flex-row"
    >
      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
              Factory Command Center
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Live manufacturing operations overview ·{" "}
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats.emergencyOrders > 0 && (
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 border border-destructive/30 rounded-lg"
                data-ocid="dashboard.emergency_alert"
              >
                <Zap size={14} className="text-destructive" />
                <span className="text-xs font-semibold text-destructive">
                  {stats.emergencyOrders} Emergency
                </span>
              </motion.div>
            )}
            {stats.delayedOrders > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 border border-warning/30 rounded-lg">
                <AlertTriangle size={13} className="text-warning" />
                <span className="text-xs font-semibold text-warning">
                  {stats.delayedOrders} Delayed
                </span>
              </div>
            )}
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
          {kpiCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: "easeOut" }}
              whileHover={{
                y: -2,
                boxShadow: "0 8px 24px oklch(var(--primary) / 0.12)",
              }}
              className={cn(
                "rounded-xl transition-smooth relative",
                card.highlight === "warning" &&
                  "ring-1 ring-warning/40 ring-offset-0",
                card.highlight === "destructive" &&
                  "ring-1 ring-destructive/40 ring-offset-0",
              )}
            >
              <KPICard
                title={card.title}
                value={card.value}
                trend={card.trend}
                trendValue={card.trendValue}
                sparklineData={card.sparklineData}
                sparklineColor={card.sparklineColor}
                accentClass={card.accentClass}
                icon={card.icon}
                className={cn(
                  card.highlight === "warning" &&
                    "bg-warning/5 border-warning/30",
                  card.highlight === "destructive" &&
                    "bg-destructive/5 border-destructive/30",
                )}
                data-ocid={`dashboard.kpi.${card.title.toLowerCase().replace(/\s+/g, "-")}.card`}
              />
              {card.highlight === "destructive" && (
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  animate={{ opacity: [0, 0.06, 0] }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 2.5,
                  }}
                  style={{ background: "oklch(var(--destructive))" }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Stage Flow Pills */}
        <div
          className="bg-card border border-border rounded-xl shadow-subtle overflow-hidden mb-6"
          data-ocid="dashboard.stage_flow"
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Production Flow
            </h2>
            <Link
              href="/production"
              className="text-xs text-primary hover:underline flex items-center gap-1"
              data-ocid="dashboard.stage_flow.view_board_link"
            >
              Open Board <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="flex items-center gap-0 p-4 overflow-x-auto no-scrollbar">
            {STAGE_ORDER.map((stage, si) => (
              <div key={stage} className="flex items-center flex-shrink-0">
                <Link
                  href="/production"
                  data-ocid={`dashboard.stage_flow.${stage}.pill`}
                  className={cn(
                    "flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl border transition-smooth cursor-pointer",
                    STAGE_COLORS[stage],
                  )}
                >
                  <span className="text-2xl font-bold font-display tabular-nums leading-none">
                    {(vehiclesByStage[stage] || []).length}
                  </span>
                  <span className="text-[11px] font-medium whitespace-nowrap">
                    {STAGE_LABELS[stage]}
                  </span>
                </Link>
                {si < STAGE_ORDER.length - 1 && (
                  <div className="flex items-center px-2 text-muted-foreground/40">
                    <svg
                      width="20"
                      height="12"
                      viewBox="0 0 20 12"
                      fill="none"
                      role="img"
                      aria-label="Next stage arrow"
                    >
                      <path
                        d="M0 6h16M12 1l5 5-5 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Production Board Preview */}
        <div
          className="bg-card border border-border rounded-xl shadow-subtle overflow-hidden"
          data-ocid="dashboard.production_board"
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Live Production Board
            </h2>
            <Link
              href="/production"
              className="text-xs text-primary hover:underline flex items-center gap-1"
              data-ocid="dashboard.production_board.view_all_link"
            >
              View Full Board <ArrowRight size={11} />
            </Link>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-0 min-w-max">
              {STAGE_ORDER.map((stage, si) => (
                <div
                  key={stage}
                  className={cn(
                    "flex-1 min-w-48 border-r border-border/50 last:border-r-0",
                    si % 2 === 1 && "bg-muted/20",
                  )}
                >
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
                    <span className="text-xs font-semibold text-foreground">
                      {STAGE_LABELS[stage]}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                      {(vehiclesByStage[stage] || []).length}
                    </span>
                  </div>
                  <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
                    {(vehiclesByStage[stage] || []).slice(0, 4).map((vehicle, vi) => (
                      <Link
                        key={vehicle.id}
                        href={`/vehicle/${vehicle.id}`}
                        data-ocid={`production_board.${stage}.item.${vi + 1}`}
                        className="block"
                      >
                        <motion.div
                          whileHover={{ y: -1, scale: 1.005 }}
                          className={cn(
                            "p-2.5 rounded-lg border bg-background hover:border-primary/40 transition-smooth cursor-pointer",
                            vehicle.priority.toLowerCase() === "urgent"
                              ? "border-destructive/40"
                              : vehicle.priority.toLowerCase() === "high"
                                ? "border-warning/30"
                                : "border-border/60",
                          )}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-foreground truncate">
                              {vehicle.vehicleNumber}
                            </span>
                            <PriorityBadge
                              priority={vehicle.priority}
                              showLabel={false}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground mb-1.5 truncate">
                            {vehicle.oemName}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${vehicle.progressPercent}%`,
                                }}
                                transition={{ duration: 0.8, delay: si * 0.1 }}
                                className={cn(
                                  "h-full rounded-full",
                                  vehicle.progressPercent >= 80
                                    ? "bg-success"
                                    : vehicle.progressPercent >= 40
                                      ? "bg-primary"
                                      : "bg-warning",
                                )}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground tabular-nums">
                              {vehicle.progressPercent}%
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 font-mono truncate">
                            {vehicle.trackingId}
                          </p>
                        </motion.div>
                      </Link>
                    ))}
                    {(vehiclesByStage[stage] || []).length > 4 && (
                      <Link
                        href="/production"
                        className="block text-[10px] text-primary hover:underline text-center py-1.5"
                      >
                        +{(vehiclesByStage[stage] || []).length - 4} more
                      </Link>
                    )}
                    {(vehiclesByStage[stage] || []).length === 0 && (
                      <div
                        className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-1.5"
                        data-ocid={`production_board.${stage}.empty_state`}
                      >
                        <Inbox size={20} className="opacity-30" />
                        <span className="text-[10px]">No vehicles</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity panel */}
      <div
        className="w-80 flex-shrink-0 border-l border-border bg-card overflow-hidden hidden xl:flex flex-col"
        data-ocid="dashboard.activity_panel"
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Live Factory Feed
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
              className="w-1.5 h-1.5 rounded-full bg-success"
            />
            <span className="text-[10px] text-muted-foreground font-medium">
              Live
            </span>
          </div>
        </div>
        <div
          className="flex-1 overflow-y-auto"
          data-ocid="dashboard.activity_feed"
        >
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-1">
              <Activity size={24} className="opacity-20" />
              <span className="text-xs">No activity yet</span>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {activities.slice(0, 20).map((event: ActivityEvent) => (
                <ActivityItem
                  key={event.id}
                  event={event}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
        <div className="px-4 py-2.5 border-t border-border/50 bg-muted/20">
          <p className="text-[10px] text-muted-foreground text-center">
            Synchronized via live WebSockets
          </p>
        </div>
      </div>
    </motion.div>
  );
}
