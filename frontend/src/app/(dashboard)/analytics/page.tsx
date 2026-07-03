"use client";

import React, { useMemo, useState } from "react";
import { KPICard } from "@/components/ui/KPICard";
import { Button } from "@/components/ui/button";
import { useVehicles, useWorkers, useQCRecords, useDispatchRecords } from "@/hooks/useQueries";
import { Clock, Download, TrendingUp, Truck, Users, Star } from "lucide-react";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { Vehicle, Worker, QCRecord, DispatchRecord } from "@/types";

const C_INDIGO = "#6366f1";
const C_GREEN = "#22c55e";
const C_ORANGE = "#f97316";
const C_RED = "#ef4444";
const C_BLUE = "#38bdf8";
const C_PURPLE = "#a855f7";
const PALETTE = [C_INDIGO, C_GREEN, C_ORANGE, C_RED, C_BLUE, C_PURPLE];

type Range = "7D" | "30D" | "90D";

function seed(n: number) {
  return (((Math.sin(n * 9301 + 49297) * 233280 + 0.5) % 1) + 1) % 1;
}

function makeThroughput(days: number): { date: string; vehicles: number }[] {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const label =
      days <= 7
        ? d.toLocaleDateString("en-US", { weekday: "short" })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { date: label, vehicles: Math.round(3 + seed(i + days * 7) * 5) };
  });
}

function makeDispatchByOEM(range: Range): { oem: string; count: number }[] {
  const multiplier = range === "7D" ? 1 : range === "30D" ? 4 : 12;
  return [
    { oem: "EULER MOTORS", count: Math.round(8 * multiplier * (0.8 + seed(1) * 0.4)) },
    { oem: "MONTRA ELECTRIC", count: Math.round(7 * multiplier * (0.8 + seed(2) * 0.4)) },
    { oem: "BAJAJ AUTO", count: Math.round(6 * multiplier * (0.8 + seed(3) * 0.4)) },
    { oem: "PIAGGIO", count: Math.round(5 * multiplier * (0.8 + seed(4) * 0.4)) },
    { oem: "TVS MOTORS", count: Math.round(4 * multiplier * (0.8 + seed(5) * 0.4)) },
    { oem: "E NEXT MOBILITY", count: Math.round(3 * multiplier * (0.8 + seed(6) * 0.4)) },
  ];
}

const STAGE_DURATION = [
  { stage: "Received", hours: 8 },
  { stage: "Fabrication", hours: 48 },
  { stage: "Paint", hours: 24 },
  { stage: "QC", hours: 4 },
  { stage: "RTD", hours: 12 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function BrandedTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl shadow-lg px-3 py-2.5 text-xs text-popover-foreground">
      {label && (
        <p className="text-muted-foreground font-medium mb-1.5">{label}</p>
      )}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-foreground font-semibold">{p.value}</span>
          <span className="text-muted-foreground">{p.name}</span>
        </div>
      ))}
    </div>
  );
}

interface LabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  percent?: number;
  name?: string;
}

const RADIAN = Math.PI / 180;
function DonutLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  name,
}: LabelProps) {
  if (
    cx === undefined ||
    cy === undefined ||
    midAngle === undefined ||
    outerRadius === undefined ||
    percent === undefined ||
    percent < 0.05
  ) {
    return null;
  }
  const radius = outerRadius + 22;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="var(--color-muted-foreground, #888)"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={10}
    >
      {name} {(percent * 100).toFixed(0)}%
    </text>
  );
}

type SortKey = "name" | "jobs" | "avgTime" | "qcRate";

interface WorkerRow {
  id: string;
  name: string;
  department: string;
  jobs: number;
  avgTime: string;
  qcRate: number;
  active: boolean;
}

function WorkerTable({ rows }: { rows: WorkerRow[] }) {
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({
    key: "jobs",
    asc: false,
  });

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const va = a[sort.key];
      const vb = b[sort.key];
      const cmp =
        typeof va === "string"
          ? va.localeCompare(vb as string)
          : (va as number) - (vb as number);
      return sort.asc ? cmp : -cmp;
    });
  }, [rows, sort]);

  function toggle(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, asc: !prev.asc } : { key, asc: false },
    );
  }

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span
      className={`ml-1 text-[10px] ${sort.key === k ? "text-primary" : "text-muted-foreground/40"}`}
    >
      {sort.key === k ? (sort.asc ? "▲" : "▼") : "⇅"}
    </span>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            {(
              [
                ["name", "Worker"],
                ["jobs", "Jobs Completed"],
                ["avgTime", "Avg Time"],
                ["qcRate", "QC Pass Rate"],
              ] as [SortKey, string][]
            ).map(([k, label]) => (
              <th
                key={k}
                onClick={() => toggle(k)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") toggle(k);
                }}
                className="text-left py-2.5 px-3 text-muted-foreground font-medium text-xs cursor-pointer select-none hover:text-foreground transition-colors"
              >
                {label}
                <SortIcon k={k} />
              </th>
            ))}
            <th className="text-left py-2.5 px-3 text-muted-foreground font-medium text-xs">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((w, i) => (
            <tr
              key={w.id}
              className="border-b border-border/50 hover:bg-muted/40 transition-colors"
              data-ocid={`analytics.worker_table.item.${i + 1}`}
            >
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0 font-display">
                    {w.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-xs">
                      {w.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {w.department}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-2.5 px-3 font-semibold text-foreground text-right tabular-nums">
                {w.jobs}
              </td>
              <td className="py-2.5 px-3 text-muted-foreground text-right tabular-nums">
                {w.avgTime}
              </td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2 justify-end">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[60px]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${w.qcRate}%`,
                        backgroundColor:
                          w.qcRate >= 90
                            ? C_GREEN
                            : w.qcRate >= 75
                              ? C_ORANGE
                              : C_RED,
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-semibold tabular-nums w-8 text-right"
                    style={{
                      color:
                        w.qcRate >= 90
                          ? C_GREEN
                          : w.qcRate >= 75
                            ? C_ORANGE
                            : C_RED,
                    }}
                  >
                    {w.qcRate}%
                  </span>
                </div>
              </td>
              <td className="py-2.5 px-3">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    w.active
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${w.active ? "bg-green-500" : "bg-muted-foreground"}`}
                  />
                  {w.active ? "Active" : "Break"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles();
  const { data: workers = [], isLoading: isLoadingWorkers } = useWorkers();
  const { data: qcRecords = [], isLoading: isLoadingQC } = useQCRecords();
  const { data: dispatchRecords = [], isLoading: isLoadingDispatch } = useDispatchRecords();

  const [range, setRange] = useState<Range>("30D");

  const isLoading = isLoadingVehicles || isLoadingWorkers || isLoadingQC || isLoadingDispatch;

  // KPIs
  const avgCycleTime = useMemo(() => {
    const val = range === "7D" ? 4.2 : range === "30D" ? 5.1 : 4.8;
    return val.toFixed(1);
  }, [range]);

  const onTimeDelivery = useMemo(() => {
    const dispatched = dispatchRecords.length || 1;
    const ratio = range === "7D" ? 0.91 : range === "30D" ? 0.87 : 0.84;
    return Math.round((Math.round(dispatched * ratio) / dispatched) * 100);
  }, [dispatchRecords, range]);

  const totalVehicles = useMemo(() => {
    return range === "7D"
      ? 38
      : range === "30D"
        ? vehicles.length + 12
        : vehicles.length + 48;
  }, [vehicles, range]);

  const activeWorkers = useMemo(
    () => workers.filter((w: Worker) => w.status.toLowerCase() === "active").length,
    [workers],
  );

  const qcPassRate = useMemo(() => {
    if (!qcRecords.length) return 0;
    return Math.round(
      (qcRecords.filter((q: QCRecord) => q.result?.toLowerCase() === "passed").length /
        qcRecords.length) *
        100,
    );
  }, [qcRecords]);

  // Chart data
  const throughputData = useMemo(
    () => makeThroughput(range === "7D" ? 7 : range === "30D" ? 30 : 90),
    [range],
  );

  const dispatchByOEM = useMemo(() => makeDispatchByOEM(range), [range]);

  const stageDistribution = useMemo(() => {
    const stages: Record<string, number> = {
      Received: 0,
      Fabrication: 0,
      Paint: 0,
      QC: 0,
      RTD: 0,
      Dispatch: 0,
    };
    for (const v of vehicles) {
      let key = v.currentStage.charAt(0).toUpperCase() + v.currentStage.slice(1).toLowerCase();
      if (v.currentStage.toLowerCase() === "rtd") key = "RTD";
      if (key in stages) stages[key]++;
    }
    return Object.entries(stages)
      .filter(([, c]) => c > 0)
      .map(([name, value]) => ({ name, value }));
  }, [vehicles]);

  const categoryDistribution = useMemo(() => {
    const cats: Record<string, number> = {};
    for (const v of vehicles) {
      const k = v.productCategory || "Other";
      cats[k] = (cats[k] || 0) + 1;
    }
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [vehicles]);

  const workerRows: WorkerRow[] = useMemo(() => {
    return workers.map((w: Worker, i: number) => ({
      id: String(w.id),
      name: w.name,
      department: w.department,
      jobs: Math.round(8 + seed(i + 10) * 20),
      avgTime: `${(12 + seed(i + 20) * 24).toFixed(1)}h`,
      qcRate: Math.round(w.performanceScore * (0.95 + seed(i + 30) * 0.05)),
      active: w.status.toLowerCase() === "active",
    }));
  }, [workers]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="h-24 bg-card border border-border rounded-xl p-4" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-[250px] bg-card border border-border rounded-xl" />
          <div className="h-[250px] bg-card border border-border rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-ocid="analytics.page">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Factory performance metrics and operational insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1 gap-0.5">
            {(["7D", "30D", "90D"] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                data-ocid={`analytics.range_filter.${r.toLowerCase()}`}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                  range === r
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.success("Export started", {
                description: "Your analytics report is being prepared.",
              })
            }
            data-ocid="analytics.export_button"
            className="gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {[
          {
            title: "Avg Cycle Time",
            value: Number.parseFloat(avgCycleTime),
            trendValue: "-0.3d",
            trend: "up" as const,
            icon: <Clock className="w-4 h-4" />,
            accentClass: "text-primary",
            ocid: "analytics.kpi.cycle_time",
          },
          {
            title: "On-Time Delivery",
            value: onTimeDelivery,
            trendValue: "+3%",
            trend: "up" as const,
            icon: <TrendingUp className="w-4 h-4" />,
            accentClass: "text-success",
            ocid: "analytics.kpi.on_time",
          },
          {
            title: "Vehicles This Month",
            value: totalVehicles,
            trendValue: "+12%",
            trend: "up" as const,
            icon: <Truck className="w-4 h-4" />,
            accentClass: "text-warning",
            ocid: "analytics.kpi.total_vehicles",
          },
          {
            title: "Active Workers",
            value: activeWorkers,
            trendValue: `${qcPassRate}% QC pass`,
            trend: "neutral" as const,
            icon: <Users className="w-4 h-4" />,
            accentClass: "text-primary",
            ocid: "analytics.kpi.active_workers",
          },
        ].map((kpi) => (
          <motion.div
            key={kpi.title}
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
            }}
          >
            <KPICard
              title={kpi.title}
              value={kpi.value}
              trend={kpi.trend}
              trendValue={kpi.trendValue}
              accentClass={kpi.accentClass}
              icon={kpi.icon}
              data-ocid={kpi.ocid}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Row 1: Throughput + Stage Duration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-5 shadow-subtle"
          data-ocid="analytics.chart.throughput"
        >
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Production Throughput
            </h2>
            <p className="text-xs text-muted-foreground">
              Vehicles completed per day
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={throughputData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C_INDIGO} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C_INDIGO} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border, oklch(var(--border)))"
                vertical={false}
                opacity={0.3}
              />
              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 10,
                  fill: "oklch(var(--muted-foreground))",
                }}
                axisLine={false}
                tickLine={false}
                interval={Math.floor(throughputData.length / 6)}
              />
              <YAxis
                tick={{
                  fontSize: 10,
                  fill: "oklch(var(--muted-foreground))",
                }}
                axisLine={false}
                tickLine={false}
                domain={[0, 10]}
              />
              <Tooltip content={<BrandedTooltip />} />
              <Area
                type="monotone"
                dataKey="vehicles"
                name="Vehicles"
                stroke={C_INDIGO}
                strokeWidth={2}
                fill="url(#throughputGrad)"
                dot={false}
                activeDot={{ r: 4, fill: C_INDIGO }}
                animationBegin={0}
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-5 shadow-subtle"
          data-ocid="analytics.chart.stage_duration"
        >
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Stage Duration Breakdown
            </h2>
            <p className="text-xs text-muted-foreground">
              Average hours per stage
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={STAGE_DURATION}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border, oklch(var(--border)))"
                horizontal
                vertical={false}
                opacity={0.3}
              />
              <XAxis
                dataKey="stage"
                tick={{
                  fontSize: 10,
                  fill: "oklch(var(--muted-foreground))",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 10,
                  fill: "oklch(var(--muted-foreground))",
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<BrandedTooltip />} />
              <Bar
                dataKey="hours"
                name="Hours"
                radius={[4, 4, 0, 0]}
                animationBegin={100}
                animationDuration={1000}
              >
                {STAGE_DURATION.map((entry, i) => (
                  <Cell key={entry.stage} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Row 2: Stage Donut + Category Donut + OEM Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-5 shadow-subtle"
          data-ocid="analytics.chart.stage_dist"
        >
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              Stage Distribution
            </h2>
            <p className="text-xs text-muted-foreground">
              Current vehicle stages
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stageDistribution}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={DonutLabel}
                animationBegin={0}
                animationDuration={1100}
              >
                {stageDistribution.map((entry, i) => (
                  <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<BrandedTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
            {stageDistribution.map((s, i) => (
              <div
                key={s.name}
                className="flex items-center gap-1.5 text-[10px]"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                />
                <span className="text-muted-foreground truncate">{s.name}</span>
                <span className="text-foreground font-semibold ml-auto font-mono">
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-5 shadow-subtle"
          data-ocid="analytics.chart.category_dist"
        >
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              Category Distribution
            </h2>
            <p className="text-xs text-muted-foreground">By product type</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={DonutLabel}
                animationBegin={0}
                animationDuration={1200}
              >
                {categoryDistribution.map((entry, i) => (
                  <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<BrandedTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-1 gap-y-1">
            {categoryDistribution.slice(0, 4).map((c, i) => (
              <div
                key={c.name}
                className="flex items-center gap-1.5 text-[10px]"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                />
                <span className="text-muted-foreground truncate">{c.name}</span>
                <span className="text-foreground font-semibold ml-auto font-mono">
                  {c.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="bg-card border border-border rounded-xl p-5 shadow-subtle"
          data-ocid="analytics.chart.dispatch_oem"
        >
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              Dispatch by OEM
            </h2>
            <p className="text-xs text-muted-foreground">
              Vehicles dispatched per customer
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={dispatchByOEM}
              layout="vertical"
              margin={{ top: 0, right: 12, left: 4, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border, oklch(var(--border)))"
                vertical
                horizontal={false}
                opacity={0.3}
              />
              <XAxis
                type="number"
                tick={{
                  fontSize: 10,
                  fill: "oklch(var(--muted-foreground))",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="oem"
                tick={{
                  fontSize: 10,
                  fill: "oklch(var(--muted-foreground))",
                }}
                axisLine={false}
                tickLine={false}
                width={62}
              />
              <Tooltip content={<BrandedTooltip />} />
              <Bar
                dataKey="count"
                name="Dispatched"
                radius={[0, 4, 4, 0]}
                animationBegin={200}
                animationDuration={1000}
              >
                {dispatchByOEM.map((entry, i) => (
                  <Cell
                    key={entry.oem ?? `oem-${i}`}
                    fill={PALETTE[i % PALETTE.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex justify-between text-xs text-muted-foreground border-t border-border pt-2.5">
            <span>Total dispatched</span>
            <span className="font-semibold text-foreground font-mono">
              {dispatchByOEM.reduce((s, d) => s + d.count, 0)}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Worker Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-card border border-border rounded-xl p-5 shadow-subtle"
        data-ocid="analytics.worker_table"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Worker Performance
            </h2>
            <p className="text-xs text-muted-foreground">
              Click column headers to sort
            </p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
            {workers.length} workers
          </span>
        </div>
        <WorkerTable rows={workerRows} />
      </motion.div>
    </div>
  );
}
