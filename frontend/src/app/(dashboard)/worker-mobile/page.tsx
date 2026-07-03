"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { useVehicles, useWorkers, useUpdateVehicleStage } from "@/hooks/useQueries";
import type { Vehicle, Worker } from "@/types";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock,
  History,
  Play,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function formatElapsed(startedAt: Date): string {
  const diff = Math.floor((Date.now() - startedAt.getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getNextStage(currentStage: string): string {
  const norm = currentStage.toLowerCase();
  if (norm === "received") return "fabrication";
  if (norm === "fabrication") return "paint";
  if (norm === "paint") return "rtd";
  return "dispatch";
}

function getStageProgress(stage: string): number {
  const norm = stage.toLowerCase();
  if (norm === "received") return 0;
  if (norm === "fabrication") return 30;
  if (norm === "paint") return 60;
  if (norm === "rtd" || norm === "readytodispatch") return 90;
  return 100;
}

function WorkerSelector({
  workers,
  selected,
  onSelect,
}: {
  workers: Worker[];
  selected: Worker;
  onSelect: (w: Worker) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        data-ocid="worker_mobile.worker_selector"
        className="flex items-center gap-3 w-full bg-card border border-border rounded-2xl px-4 py-3 min-h-[56px] hover:bg-muted/40 transition-colors duration-200 shadow-sm"
      >
        <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 font-display">
          {getInitials(selected.name)}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-bold text-foreground text-base leading-tight truncate">
            {selected.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selected.employeeId} · {selected.department}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-semibold text-success bg-success/10 px-2.5 py-0.5 rounded-full capitalize">
            {selected.status}
          </span>
          <ChevronDown
            size={18}
            className={`text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-lg z-50 overflow-hidden"
            data-ocid="worker_mobile.worker_dropdown"
          >
            {workers.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  onSelect(w);
                  setOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 min-h-[52px] hover:bg-muted/50 transition-colors duration-150 text-left border-b last:border-b-0 border-border/50 ${
                  w.id === selected.id ? "bg-primary/5" : ""
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0 font-display">
                  {getInitials(w.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">
                    {w.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {w.department}
                  </p>
                </div>
                {w.id === selected.id && (
                  <CheckCircle2
                    size={16}
                    className="text-primary flex-shrink-0"
                  />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActiveJobCard({
  vehicle,
  startedAt,
  onComplete,
}: {
  vehicle: Vehicle;
  startedAt: Date;
  onComplete: () => void;
}) {
  const [completing, setCompleting] = useState(false);
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const iv = setInterval(() => setElapsed(formatElapsed(startedAt)), 1000);
    setElapsed(formatElapsed(startedAt));
    return () => clearInterval(iv);
  }, [startedAt]);

  const handleComplete = async () => {
    setCompleting(true);
    // Introduce a brief animation feedback delay
    await new Promise((r) => setTimeout(r, 600));
    onComplete();
    setCompleting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border-2 border-primary rounded-2xl overflow-hidden shadow-lg"
      data-ocid="worker_mobile.active_job.card"
    >
      <div className="bg-primary/10 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">
          🟢 Active Job
        </span>
        <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
          <Clock size={13} />
          <span className="font-mono">{elapsed}</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <p className="font-mono text-xs text-muted-foreground tracking-wider">
            {vehicle.trackingId}
          </p>
          <PriorityBadge priority={vehicle.priority} />
        </div>
        <p className="text-3xl font-bold font-display text-foreground mb-0.5 tracking-tight">
          {vehicle.vehicleNumber}
        </p>
        <p className="text-sm text-muted-foreground mb-1">
          {vehicle.productCategory}
        </p>
        <p className="text-sm font-semibold text-foreground mb-4">
          Stage:{" "}
          <span className="capitalize text-primary">
            {vehicle.currentStage}
          </span>
        </p>
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-bold text-foreground">
              {vehicle.progressPercent}%
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${vehicle.progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleComplete}
          disabled={completing}
          data-ocid="worker_mobile.active_job.complete_button"
          className="w-full flex items-center justify-center gap-3 rounded-xl font-bold text-xl text-white transition-all duration-200 disabled:opacity-70"
          style={{
            minHeight: "64px",
            background: completing
              ? "oklch(0.62 0.17 142 / 0.7)"
              : "oklch(0.62 0.17 142)",
          }}
        >
          {completing ? (
            <span>Completing…</span>
          ) : (
            <>
              <CheckCircle2 size={24} /> COMPLETE JOB
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

function JobQueueCard({
  vehicle,
  index,
  onStart,
}: {
  vehicle: Vehicle;
  index: number;
  onStart: () => void;
}) {
  const isUrgent = vehicle.priority.toLowerCase() === "urgent";
  const isHigh = vehicle.priority.toLowerCase() === "high";
  const borderClass = isUrgent
    ? "border-destructive ring-2 ring-destructive/20"
    : isHigh
      ? "border-warning/60"
      : "border-border";
  const bgClass = isUrgent
    ? "bg-destructive/5"
    : isHigh
      ? "bg-warning/5"
      : "bg-card";

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`border-2 rounded-2xl p-4 shadow-subtle ${bgClass} ${borderClass}`}
      data-ocid={`worker_mobile.queue.item.${index + 1}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-muted-foreground tracking-wider mb-0.5">
            {vehicle.trackingId}
          </p>
          <p className="text-2xl font-bold font-display text-foreground truncate tracking-tight">
            {vehicle.vehicleNumber}
          </p>
        </div>
        <PriorityBadge priority={vehicle.priority} />
      </div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-sm text-muted-foreground">{vehicle.oemName}</span>
        <span className="text-muted-foreground opacity-50">·</span>
        <span className="text-sm text-muted-foreground capitalize">
          {vehicle.currentStage}
        </span>
        <span className="text-muted-foreground opacity-50">·</span>
        <span className="text-sm text-muted-foreground">
          {vehicle.productCategory}
        </span>
      </div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        data-ocid={`worker_mobile.queue.start_button.${index + 1}`}
        className="w-full flex items-center justify-center gap-2 h-14 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:opacity-90 transition-colors duration-200"
      >
        <Play size={20} fill="currentColor" /> START JOB
      </motion.button>
    </motion.div>
  );
}

function ReportIssueSheet({
  activeVehicle,
  vehicles,
  onClose,
}: {
  activeVehicle: Vehicle | null;
  vehicles: Vehicle[];
  onClose: () => void;
}) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    activeVehicle?.id ?? "",
  );
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!issueType || !description.trim()) {
      toast.error("Please fill in issue type and description");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Issue reported", { description: "Supervisor has been notified." });
    setSubmitting(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-ocid="worker_mobile.report_issue.dialog"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full bg-card rounded-t-3xl px-5 pt-5 pb-8 max-h-[85vh] overflow-y-auto border-t border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold font-display text-foreground">
            Report Issue
          </h2>
          <button
            type="button"
            onClick={onClose}
            data-ocid="worker_mobile.report_issue.close_button"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="report-vehicle-select"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Vehicle / Job
            </label>
            <select
              id="report-vehicle-select"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              data-ocid="worker_mobile.report_issue.vehicle_select"
              className="w-full min-h-[52px] bg-background border border-input rounded-xl px-4 text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
            >
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicleNumber} — {v.trackingId}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="block text-sm font-semibold text-foreground mb-2">
              Issue Type
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["Safety", "Quality", "Equipment", "Other"] as const).map(
                (t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setIssueType(t)}
                    data-ocid={`worker_mobile.report_issue.type_${t.toLowerCase()}`}
                    className={`min-h-[52px] rounded-xl border-2 font-semibold text-sm transition-all duration-150 ${
                      issueType === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {t === "Safety" && "⚠️ "}
                    {t === "Quality" && "🔍 "}
                    {t === "Equipment" && "🔧 "}
                    {t === "Other" && "📝 "}
                    {t}
                  </button>
                ),
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="report-description-textarea"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Brief Description
            </label>
            <textarea
              id="report-description-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder="Describe the issue…"
              rows={3}
              data-ocid="worker_mobile.report_issue.description_textarea"
              className="w-full bg-background border border-input rounded-xl px-4 py-3 text-foreground text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground text-right mt-1 font-mono">
              {description.length}/200
            </p>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            data-ocid="worker_mobile.report_issue.submit_button"
            className="w-full min-h-[56px] bg-destructive text-destructive-foreground rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting ? (
              "Submitting…"
            ) : (
              <>
                <AlertTriangle size={20} /> Submit Report
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function HistorySheet({ onClose }: { onClose: () => void }) {
  const completed = [
    {
      id: "FF-4421",
      vehicle: "MH-12-AB-3456",
      task: "Fabrication",
      completedAt: "09:45 AM",
      duration: "2h 15m",
    },
    {
      id: "FF-4398",
      vehicle: "GJ-01-CD-7890",
      task: "Paint Prep",
      completedAt: "07:20 AM",
      duration: "1h 45m",
    },
    {
      id: "FF-4377",
      vehicle: "DL-09-EF-1234",
      task: "Assembly",
      completedAt: "06:05 AM",
      duration: "55m",
    },
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-ocid="worker_mobile.history.dialog"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full bg-card rounded-t-3xl px-5 pt-5 pb-8 max-h-[70vh] overflow-y-auto border-t border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold font-display text-foreground">
            Today's History
          </h2>
          <button
            type="button"
            onClick={onClose}
            data-ocid="worker_mobile.history.close_button"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3">
          {completed.map((job, i) => (
            <div
              key={job.id}
              className="flex items-center gap-4 bg-background rounded-xl p-4 border border-border/80 shadow-subtle"
              data-ocid={`worker_mobile.history.item.${i + 1}`}
            >
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={20} className="text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-base truncate">
                  {job.vehicle}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {job.task} · {job.id}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-foreground font-mono">
                  {job.completedAt}
                </p>
                <p className="text-xs text-muted-foreground font-mono">{job.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function WorkerMobilePage() {
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles();
  const { data: workers = [], isLoading: isLoadingWorkers } = useWorkers();

  const updateStageMutation = useUpdateVehicleStage();

  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJobStart, setActiveJobStart] = useState<Date | null>(null);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Set default selected worker once list is loaded
  useEffect(() => {
    if (workers.length && !selectedWorkerId) {
      setSelectedWorkerId(String(workers[0].id));
    }
  }, [workers, selectedWorkerId]);

  const worker = useMemo(() => {
    return workers.find((w: Worker) => String(w.id) === selectedWorkerId) ?? workers[0];
  }, [workers, selectedWorkerId]);

  const assignedVehicles = useMemo(() => {
    if (!worker) return [];
    return vehicles.filter((v: Vehicle) =>
      v.assignedWorkerIds?.includes(worker.id),
    );
  }, [vehicles, worker]);

  const activeVehicle = useMemo(() => {
    if (activeJobId == null) return null;
    return assignedVehicles.find((v: Vehicle) => String(v.id) === String(activeJobId)) ?? null;
  }, [assignedVehicles, activeJobId]);

  const queuedVehicles = useMemo(() => {
    return assignedVehicles.filter((v: Vehicle) => String(v.id) !== String(activeJobId));
  }, [assignedVehicles, activeJobId]);

  const handleStart = (vehicleId: string) => {
    setActiveJobId(vehicleId);
    setActiveJobStart(new Date());
    toast.success("Job started — work safely!");
  };

  const handleComplete = () => {
    if (activeVehicle) {
      const nextStage = getNextStage(activeVehicle.currentStage);
      const progress = getStageProgress(nextStage);
      
      updateStageMutation.mutate({ id: activeVehicle.id, stage: nextStage, progress }, {
        onSuccess: () => {
          setActiveJobId(null);
          setActiveJobStart(null);
          toast.success("Job completed! Great work.", {
            description: `Order updated to ${nextStage.toUpperCase()} stage.`,
            duration: 4000,
          });
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.detail || "Failed to update job stage");
        }
      });
    }
  };

  const handlePhotoFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    setPhotoUploading(true);
    setPhotoProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 20 + 10;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setPhotoUploading(false);
        toast.success("Photo uploaded successfully");
      }
      setPhotoProgress(Math.min(p, 100));
    }, 200);
  };

  if (isLoadingVehicles || isLoadingWorkers || !worker) {
    return (
      <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto p-4 gap-4 animate-pulse">
        <div className="h-14 bg-card border border-border rounded-2xl" />
        <div className="h-48 bg-card border border-border rounded-2xl" />
        <div className="h-64 bg-card border border-border rounded-2xl" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative pb-32 border-x border-border/40"
      data-ocid="worker_mobile.page"
    >
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-black text-xs">
                FF
              </span>
            </div>
            <div>
              <p className="font-black text-foreground text-sm font-display tracking-tight">
                FOXFLOW
              </p>
              <p className="text-[10px] text-muted-foreground leading-none">
                Worker Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-success/10 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-semibold text-success">
              Morning Shift
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 space-y-5">
          {/* Worker selector */}
          <WorkerSelector
            workers={workers}
            selected={worker}
            onSelect={(w) => {
              setSelectedWorkerId(String(w.id));
              setActiveJobId(null);
              setActiveJobStart(null);
            }}
          />

          {/* Active job */}
          <AnimatePresence mode="wait">
            {activeVehicle && activeJobStart ? (
              <ActiveJobCard
                key={activeVehicle.id}
                vehicle={activeVehicle}
                startedAt={activeJobStart}
                onComplete={handleComplete}
              />
            ) : null}
          </AnimatePresence>

          {/* Jobs queue */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Assigned Jobs
              </h2>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">
                {queuedVehicles.length}
              </span>
            </div>
            {queuedVehicles.length === 0 ? (
              <div
                className="bg-card border border-border rounded-2xl p-8 text-center shadow-subtle"
                data-ocid="worker_mobile.queue.empty_state"
              >
                <CheckCircle2 size={36} className="text-success mx-auto mb-2" />
                <p className="font-bold text-foreground text-lg">All clear!</p>
                <p className="text-sm text-muted-foreground">
                  No more jobs in queue.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {queuedVehicles.map((vehicle, i) => (
                  <JobQueueCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    index={i}
                    onStart={() => handleStart(vehicle.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Photo preview */}
          {photoPreview && (
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img
                src={photoPreview}
                alt="Upload preview"
                className="w-full h-36 object-cover"
              />
              {photoUploading && (
                <div className="absolute inset-x-0 bottom-0">
                  <div className="h-2 bg-black/30">
                    <motion.div
                      animate={{ width: `${photoProgress}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              )}
              {!photoUploading && (
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom action bar */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-sm border-t border-border px-4 py-3 z-30"
        data-ocid="worker_mobile.bottom_bar"
      >
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handlePhotoFile(f);
          }}
        />
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            data-ocid="worker_mobile.bottom_bar.photo_button"
            className="flex flex-col items-center justify-center gap-1.5 min-h-[64px] bg-muted hover:bg-muted/80 text-foreground rounded-2xl border border-border font-semibold text-xs transition-colors duration-150 cursor-pointer"
          >
            <Camera size={24} className="text-muted-foreground" />
            Upload Photo
          </button>
          <button
            type="button"
            onClick={() => setShowReportSheet(true)}
            data-ocid="worker_mobile.bottom_bar.report_button"
            className="flex flex-col items-center justify-center gap-1.5 min-h-[64px] bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-2xl border border-destructive/30 font-semibold text-xs transition-colors duration-150 cursor-pointer"
          >
            <AlertTriangle size={24} />
            Report Issue
          </button>
          <button
            type="button"
            onClick={() => setShowHistorySheet(true)}
            data-ocid="worker_mobile.bottom_bar.history_button"
            className="flex flex-col items-center justify-center gap-1.5 min-h-[64px] bg-muted hover:bg-muted/80 text-foreground rounded-2xl border border-border font-semibold text-xs transition-colors duration-150 cursor-pointer"
          >
            <History size={24} className="text-muted-foreground" />
            View History
          </button>
        </div>
      </div>

      {/* Sheets */}
      <AnimatePresence>
        {showReportSheet && (
          <ReportIssueSheet
            activeVehicle={activeVehicle}
            vehicles={assignedVehicles}
            onClose={() => setShowReportSheet(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showHistorySheet && (
          <HistorySheet onClose={() => setShowHistorySheet(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
