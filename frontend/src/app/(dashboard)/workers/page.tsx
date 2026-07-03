"use client";

import React, { useState, useMemo } from "react";
import type { ColumnDef } from "@/components/ui/DataTable";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkers, useVehicles, useUpdateWorker, useUpdateWorkerStatus, useArchiveWorker, useResetWorkerPassword, useCreateWorker } from "@/hooks/useQueries";
import type { Worker, Vehicle } from "@/types";
import { Star, MoreHorizontal, Eye, Edit, History, Archive, PowerOff, KeyRound, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import { EditRecordDialog } from "@/components/shared/EditRecordDialog";
import { AuditHistoryDrawer } from "@/components/shared/AuditHistoryDrawer";
import { ReasonPromptDialog } from "@/components/shared/ReasonPromptDialog";
import { toast } from "sonner";

const DEPARTMENTS = ["All", "Fabrication", "Paint", "QC", "Dispatch"];
const STATUSES = ["All", "active", "break", "offline"];

// ... Avatar, Badge, Expand components remain unchanged ...
function WorkerAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("");
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-[10px] flex-shrink-0">
        {initials}
      </div>
      <span className="font-semibold text-foreground truncate">{name}</span>
    </div>
  );
}

function WorkerStatusBadge({ status }: { status: Worker["status"] }) {
  return (
    <span
      className={cn(
        "text-[10px] font-medium px-2 py-0.5 rounded-full capitalize",
        status === "active"
          ? "bg-success/15 text-success"
          : status === "break"
            ? "bg-warning/15 text-warning"
            : "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

function WorkerExpand({ worker }: { worker: Worker }) {
  const tasks = [
    { label: "Welding", pct: worker.performanceScore },
    { label: "Fabrication", pct: Math.round(worker.performanceScore * 0.9) },
    { label: "QC", pct: Math.round(worker.performanceScore * 0.85) },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/10 rounded-xl border border-border/50">
      <div>
        <p className="text-xs font-semibold text-foreground mb-1">Bio</p>
        <p className="text-xs text-muted-foreground">
          {worker.name} is a senior {worker.department} specialist with{" "}
          {worker.hoursToday}h logged today.
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {["Certified Welder", "Safety Trained", "ISO 9001"].map((cert) => (
            <span
              key={cert}
              className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20"
            >
              {cert}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Skills</p>
        <div className="space-y-1.5">
          {tasks.map((t) => (
            <div key={t.label}>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                <span>{t.label}</span>
                <span>{t.pct}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${t.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground mb-1">
          Performance
        </p>
        <div className="flex items-center gap-1.5 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={14}
              className={cn(
                star <= Math.round(worker.performanceScore / 20)
                  ? "text-warning fill-warning"
                  : "text-muted-foreground/30",
              )}
            />
          ))}
          <span className="text-xs font-bold text-foreground">
            {worker.performanceScore}%
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Employee ID: {worker.employeeId}
        </p>
        <p className="text-[10px] text-muted-foreground">
          Department: {worker.department}
        </p>
      </div>
    </div>
  );
}

export default function WorkersPage() {
  const { data: workers = [], isLoading: isLoadingWorkers } = useWorkers();
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles();
  const updateWorker = useUpdateWorker();
  const updateWorkerStatus = useUpdateWorkerStatus();
  const archiveWorker = useArchiveWorker();
  const resetWorkerPassword = useResetWorkerPassword();
  const createWorker = useCreateWorker();
  const userRole = useAuthStore((state: any) => state.role) || "operator";

  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const [editRecord, setEditRecord] = useState<Worker | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState<Worker | null>(null);
  const [viewRecord, setViewRecord] = useState<Worker | null>(null);
  const [actionReason, setActionReason] = useState<{ worker: Worker, action: "deactivate" | "archive" | "resetPassword" } | null>(null);

  const filtered = useMemo(() => {
    return workers.filter((w: Worker) => {
      const deptOk = deptFilter === "All" || w.department.toLowerCase() === deptFilter.toLowerCase();
      const statusOk = statusFilter === "All" || w.status.toLowerCase() === statusFilter.toLowerCase();
      return deptOk && statusOk;
    });
  }, [workers, deptFilter, statusFilter]);

  const columns: ColumnDef<Worker>[] = useMemo(() => [
    {
      id: "name",
      header: "Name",
      accessor: (w: Worker) => <WorkerAvatar name={w.name} />,
      sortable: true,
    },
    {
      id: "employeeId",
      header: "Employee ID",
      accessor: (w: Worker) => (
        <span className="font-mono text-muted-foreground">{w.employeeId}</span>
      ),
      sortable: true,
    },
    {
      id: "department",
      header: "Department",
      accessor: (w: Worker) => w.department,
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      accessor: (w: Worker) => <WorkerStatusBadge status={w.status} />,
    },
    {
      id: "currentTask",
      header: "Current Task",
      accessor: (w: Worker) => {
        const v = w.currentTaskId
          ? vehicles.find((v: Vehicle) => String(v.id) === String(w.currentTaskId))
          : null;
        return v ? (
          <span className="truncate text-primary max-w-36 block font-medium">
            {v.vehicleNumber}
          </span>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        );
      },
    },
    {
      id: "hoursToday",
      header: "Hours Today",
      accessor: (w: Worker) => (
        <span className="tabular-nums font-semibold">{w.hoursToday}h</span>
      ),
      sortable: true,
    },
    {
      id: "performance",
      header: "Performance",
      accessor: (w: Worker) => (
        <span className="inline-flex items-center gap-1">
          <Star size={11} className="text-warning fill-warning" />
          <span className="font-bold tabular-nums">{w.performanceScore}%</span>
        </span>
      ),
      sortable: true,
    },
    {
      id: "actions",
      header: "Actions",
      accessor: (w: Worker) => {
        const canEdit = ["admin", "owner"].includes(userRole);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Administrative</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTimeout(() => setViewRecord(w), 0)}>
                <Eye className="mr-2 h-4 w-4" /> View Full Profile
              </DropdownMenuItem>
              
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTimeout(() => setEditRecord(w), 0)}>
                    <Edit className="mr-2 h-4 w-4 text-primary" /> Edit Record
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeout(() => setActionReason({ worker: w, action: "resetPassword" }), 0)}>
                    <KeyRound className="mr-2 h-4 w-4 text-warning" /> Reset Password
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeout(() => setActionReason({ worker: w, action: "deactivate" }), 0)}>
                    <PowerOff className="mr-2 h-4 w-4 text-destructive" /> Deactivate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeout(() => setActionReason({ worker: w, action: "archive" }), 0)}>
                    <Archive className="mr-2 h-4 w-4 text-destructive" /> Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTimeout(() => setHistoryRecord(w), 0)}>
                    <History className="mr-2 h-4 w-4 text-muted-foreground" /> Audit History
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [vehicles, userRole]);

  const handleReasonAction = (reason: string) => {
    if (!actionReason) return;
    
    switch (actionReason.action) {
      case 'Reset Password':
        resetWorkerPassword.mutate({ id: actionReason.worker.id.toString(), reason });
        break;
      case 'Deactivate':
        updateWorkerStatus.mutate({ id: actionReason.worker.id.toString(), status: 'Inactive', reason });
        break;
      case 'Archive':
        archiveWorker.mutate({ id: actionReason.worker.id.toString(), reason });
        break;
    }
    setActionReason(null);
  };

  if (isLoadingWorkers || isLoadingVehicles) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-lg" />
        <div className="h-64 bg-card border border-border rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6" data-ocid="workers.page">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Workers
          </h1>
          <p className="text-sm text-muted-foreground">
            {workers.length} team members Â·{" "}
            {workers.filter((w: Worker) => w.status.toLowerCase() === "active").length} active now
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={16} /> Add Worker
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        rowId={(w) => String(w.id)}
        searchKey={(w) => `${w.name} ${w.employeeId}`}
        expandable={(w) => <WorkerExpand worker={w} />}
        extraFilters={
          <>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              data-ocid="workers.dept_filter"
              className="h-8 text-xs bg-muted/40 border border-border rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d === "All" ? "All Departments" : d}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              data-ocid="workers.status_filter"
              className="h-8 text-xs bg-muted/40 border border-border rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "All"
                    ? "All Statuses"
                    : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </>
        }
      />
      {/* Enterprise Administration Controls */}
      <AuditHistoryDrawer
        open={!!historyRecord}
        onOpenChange={(open) => !open && setHistoryRecord(null)}
        recordId={historyRecord?.id?.toString() || ""}
        module="workers"
        title={`Audit History: ${historyRecord?.name}`}
      />
      
      <ReasonPromptDialog
        open={!!actionReason}
        onOpenChange={(open) => !open && setActionReason(null)}
        title={`Confirm ${actionReason?.action} for ${actionReason?.worker?.name}`}
        description="Please provide a reason for this administrative action."
        onSubmit={handleReasonAction}
      />
      
      <EditRecordDialog
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
        title={`Edit Worker: ${editRecord?.name}`}
        isSubmitting={updateWorker.isPending}
        initialValues={editRecord ? {
          name: editRecord.name,
          department: editRecord.department,
          status: editRecord.status,
          role: editRecord.role,
          mobileNumber: editRecord.mobileNumber || "",
          email: editRecord.email || "",
        } : undefined}
        fields={[
          { name: "name", label: "Full Name", type: "text" },
          { name: "department", label: "Department", type: "select", options: [
            { label: "Fabrication", value: "Fabrication" },
            { label: "Paint", value: "Paint" },
            { label: "Assembly", value: "Assembly" },
            { label: "QC", value: "QC" },
            { label: "Dispatch", value: "Dispatch" },
          ]},
          { name: "status", label: "Status", type: "select", options: [
            { label: "Active", value: "Active" },
            { label: "Offline", value: "Offline" },
            { label: "Break", value: "Break" },
          ]},
          { name: "role", label: "Role", type: "select", options: [
            { label: "Worker", value: "Worker" },
            { label: "Supervisor", value: "Supervisor" },
            { label: "Manager", value: "Manager" },
          ]},
          { name: "mobileNumber", label: "Mobile Number", type: "text" },
          { name: "email", label: "Email Address", type: "text" },
        ]}
        onSubmit={(data, reason) => {
          if (!editRecord) return;
          updateWorker.mutate({
            id: editRecord.id,
            data: {
              ...editRecord,
              ...data,
              reason,
            }
          }, {
            onSuccess: () => {
              toast.success("Worker updated successfully");
              setEditRecord(null);
            },
            onError: () => toast.error("Failed to update worker")
          });
        }}
      />
      
      <EditRecordDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Add New Worker"
        isSubmitting={createWorker.isPending}
        requireReason={false}
        fields={[
          { name: "name", label: "Full Name", type: "text" },
          { name: "department", label: "Department", type: "select", options: [
            { label: "Fabrication", value: "Fabrication" },
            { label: "Paint", value: "Paint" },
            { label: "Assembly", value: "Assembly" },
            { label: "QC", value: "QC" },
            { label: "Dispatch", value: "Dispatch" },
          ]},
          { name: "role", label: "Role", type: "select", options: [
            { label: "Worker", value: "Worker" },
            { label: "Supervisor", value: "Supervisor" },
            { label: "Manager", value: "Manager" },
          ]},
          { name: "mobileNumber", label: "Mobile Number", type: "text" },
          { name: "employeeId", label: "Employee ID", type: "text" },
        ]}
        onSubmit={(data) => {
          createWorker.mutate({
            ...data,
            status: "Offline", // Default status
            performanceScore: 0,
            hoursToday: 0
          }, {
            onSuccess: () => {
              toast.success("Worker created successfully");
              setIsCreateOpen(false);
            },
            onError: (err: any) => {
              toast.error(err.response?.data?.detail || "Failed to create worker");
            }
          });
        }}
      />
    </div>
  );
}
