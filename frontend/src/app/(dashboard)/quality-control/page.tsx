"use client";

import React, { useState, useMemo, useRef } from "react";
import type { ColumnDef } from "@/components/ui/DataTable";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useQCRecords, useVehicles, useCreateQCRecord, useUpdateQCRecord, useUploadQCPhoto, useCreateDefect } from "@/hooks/useQueries";
import type { QCRecord, Vehicle, DefectRecord } from "@/types";
import { AlertCircle, CheckCircle2, Plus, XCircle, Camera, CheckSquare, Edit, History, ChevronDown } from "lucide-react";
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
import { toast } from "sonner";

const STAGES = ["fabrication", "paint", "assembly"];

function QCResultBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || "pending";
  return (
    <span
      className={cn(
        "text-xs font-medium px-2 py-0.5 rounded capitalize",
        s === "passed"
          ? "bg-success/15 text-success"
          : s === "failed" || s === "rework"
            ? "bg-destructive/15 text-destructive"
            : s === "in progress"
            ? "bg-primary/15 text-primary"
            : "bg-warning/15 text-warning",
      )}
    >
      {s}
    </span>
  );
}

const DEFAULT_CHECKLIST = [
  { item: "Dimensions Check", category: "Fabrication", passed: null },
  { item: "Weld Penetration", category: "Fabrication", passed: null },
  { item: "Surface Smoothness", category: "Paint", passed: null },
  { item: "Paint Thickness", category: "Paint", passed: null },
];

function QCDetailsDrawer({ 
  record, 
  open, 
  onClose,
  vehicles
}: { 
  record: QCRecord | null, 
  open: boolean, 
  onClose: () => void,
  vehicles: Vehicle[] 
}) {
  const updateMutation = useUpdateQCRecord();
  const uploadMutation = useUploadQCPhoto();
  const createDefectMutation = useCreateDefect();
  
  const [defectDesc, setDefectDesc] = useState("");
  const [defectType, setDefectType] = useState("Weld defect");
  const [severity, setSeverity] = useState("Medium");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const vehicle = record ? vehicles.find((v) => String(v.id) === String(record.vehicleId)) : null;
  const checklist = record?.checklist && record.checklist.length > 0 ? record.checklist : DEFAULT_CHECKLIST;

  const handleUpdateStatus = (status: string) => {
    if (!record) return;
    updateMutation.mutate({ id: record.id, data: { status } }, {
      onSuccess: () => toast.success(`Status updated to ${status}`),
      onError: () => toast.error("Failed to update status")
    });
  };

  const handleChecklistChange = (index: number, val: boolean) => {
    if (!record) return;
    const updated = [...checklist];
    updated[index].passed = val;
    updateMutation.mutate({ id: record.id, data: { checklist: updated } }, {
      onSuccess: () => toast.success("Checklist saved"),
    });
  };

  const handleDefectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;
    createDefectMutation.mutate({
      qc_record_id: record.id,
      vehicle_id: record.vehicleId,
      defect_type: defectType,
      severity,
      category: "General",
      description: defectDesc
    }, {
      onSuccess: () => {
        toast.success("Defect logged");
        setDefectDesc("");
      }
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!record) return;
    if (e.target.files && e.target.files[0]) {
      uploadMutation.mutate({ id: record.id, file: e.target.files[0] }, {
        onSuccess: () => toast.success("Photo uploaded successfully")
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        {record && (
          <>
            <SheetHeader className="mb-4">
              <SheetTitle className="flex items-center justify-between mt-4">
                <span>QC Record #{record.id}</span>
                <QCResultBadge status={record.status} />
              </SheetTitle>
              <div className="text-sm text-muted-foreground flex gap-4 mt-2">
                <div><strong>Vehicle:</strong> {vehicle?.vehicleNumber}</div>
                <div><strong>Stage:</strong> <span className="capitalize">{record.stage}</span></div>
              </div>
            </SheetHeader>
        
        <div className="flex gap-2 mb-6 p-3 bg-muted/30 rounded-lg border border-border">
          <Button size="sm" variant={record.status === "Passed" ? "default" : "outline"} onClick={() => handleUpdateStatus("Passed")}>
             Pass
          </Button>
          <Button size="sm" variant={record.status === "Failed" ? "destructive" : "outline"} onClick={() => handleUpdateStatus("Failed")}>
             Fail
          </Button>
          <Button size="sm" variant={record.status === "Rework" ? "secondary" : "outline"} onClick={() => handleUpdateStatus("Rework")}>
             Send to Rework
          </Button>
        </div>

        <Tabs defaultValue="checklist" className="w-full">
          <div className="w-full overflow-x-auto no-scrollbar pb-1 mb-3">
            <TabsList className="w-max sm:w-full inline-flex sm:grid sm:grid-cols-3 gap-1">
              <TabsTrigger value="checklist" className="flex-1 whitespace-nowrap px-3"><CheckSquare className="mr-2 h-4 w-4 shrink-0" /> Checklist</TabsTrigger>
              <TabsTrigger value="defects" className="flex-1 whitespace-nowrap px-3"><AlertCircle className="mr-2 h-4 w-4 shrink-0" /> Defects ({record.defects?.length || 0})</TabsTrigger>
              <TabsTrigger value="photos" className="flex-1 whitespace-nowrap px-3"><Camera className="mr-2 h-4 w-4 shrink-0" /> Photos ({record.photos?.length || 0})</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="checklist" className="space-y-4">
            <div className="border border-border rounded-lg overflow-hidden">
              {checklist.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 border-b border-border/50 last:border-b-0 gap-2">
                  <div className="text-sm min-w-0 flex-1">
                    <p className="font-medium truncate">{c.item}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.category}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant={c.passed === true ? "default" : "outline"} className="h-7 text-xs" onClick={() => handleChecklistChange(i, true)}>Yes</Button>
                    <Button size="sm" variant={c.passed === false ? "destructive" : "outline"} className="h-7 text-xs" onClick={() => handleChecklistChange(i, false)}>No</Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="defects" className="space-y-4">
            <form onSubmit={handleDefectSubmit} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
              <h4 className="text-sm font-semibold">Log New Defect</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1">Defect Type</Label>
                  <select value={defectType} onChange={e => setDefectType(e.target.value)} className="w-full h-8 text-xs rounded border border-border bg-background px-2">
                    <option>Weld defect</option>
                    <option>Paint blister</option>
                    <option>Dimension out of spec</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs mb-1">Severity</Label>
                  <select value={severity} onChange={e => setSeverity(e.target.value)} className="w-full h-8 text-xs rounded border border-border bg-background px-2">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1">Description</Label>
                <textarea required value={defectDesc} onChange={e => setDefectDesc(e.target.value)} className="w-full text-xs rounded border border-border bg-background p-2" rows={2} />
              </div>
              <Button type="submit" size="sm" disabled={createDefectMutation.isPending}>Add Defect</Button>
            </form>
            
            <div className="space-y-2">
              {record.defects?.map(d => (
                <div key={d.id} className="p-3 border border-border rounded-lg text-sm bg-card">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">{d.defectType}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded", 
                      d.severity === "High" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
                    )}>{d.severity}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{d.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="photos" className="space-y-4">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/10">
              <Camera className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">Upload photo evidence of inspection or defects</p>
              <input type="file" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" />
              <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? "Uploading..." : "Select File"}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              {record.photos?.map((photo, i) => (
                <div key={i} className="rounded-lg border border-border overflow-hidden h-32 bg-muted relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`http://127.0.0.1:8000${photo}`} alt="QC Evidence" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        </>)}
      </SheetContent>
    </Sheet>
  );
}

function AddQCModal({ vehicles }: { vehicles: Vehicle[] }) {
  const createMutation = useCreateQCRecord();
  const [open, setOpen] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [stage, setStage] = useState("fabrication");
  
  const matchedVehicles = useMemo(() => {
    if (!vehicleSearch || (selectedVehicle && selectedVehicle.vehicleNumber === vehicleSearch)) {
      return [];
    }
    return vehicles.filter((v: Vehicle) =>
      v.vehicleNumber.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.trackingId.toLowerCase().includes(vehicleSearch.toLowerCase())
    );
  }, [vehicles, vehicleSearch, selectedVehicle]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVehicle && matchedVehicles.length === 0) {
      toast.error("Please select a valid vehicle");
      return;
    }
    const vehicle = selectedVehicle || matchedVehicles[0];

    createMutation.mutate({
      vehicle_id: vehicle.id,
      stage: stage,
    }, {
      onSuccess: () => {
        toast.success("QC record created successfully");
        setOpen(false);
        setVehicleSearch("");
        setSelectedVehicle(null);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.detail || "Failed to create QC record");
      }
    });
  }

  const inputCls = "w-full bg-background border border-input rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus size={14} /> Start Inspection</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>New QC Inspection</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-xs mb-1 block">Vehicle / Tracking ID *</Label>
            <input type="text" required placeholder="Search..." value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)} className={inputCls} />
            {matchedVehicles.length > 0 && (
              <div className="mt-1 border border-border bg-card rounded-lg overflow-hidden max-h-32 overflow-y-auto">
                {matchedVehicles.slice(0, 4).map((v) => (
                  <button type="button" key={v.id} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted border-b border-border/40 last:border-b-0" onClick={() => { setSelectedVehicle(v); setVehicleSearch(v.vehicleNumber); }}>
                    <span className="font-semibold">{v.vehicleNumber}</span> ({v.trackingId})
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs mb-1 block">Stage</Label>
            <select value={stage} onChange={e => setStage(e.target.value)} className={cn(inputCls, "appearance-none pr-7 capitalize")}>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={createMutation.isPending}>{createMutation.isPending ? "Starting..." : "Start QC"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function QualityControlPage() {
  const { data: qcRecords = [], isLoading: isLoadingQC } = useQCRecords();
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles();
  const [selectedRecord, setSelectedRecord] = useState<QCRecord | null>(null);
  
  const updateMutation = useUpdateQCRecord();
  
  const { useAuthStore } = require("@/store/authStore");
  const userRole = useAuthStore((state: any) => state.role) || "operator";
  const canEdit = ["admin", "owner"].includes(userRole);

  const [editRecord, setEditRecord] = useState<QCRecord | null>(null);
  const [historyRecord, setHistoryRecord] = useState<QCRecord | null>(null);
  const [reworkRecord, setReworkRecord] = useState<QCRecord | null>(null);

  const stats = useMemo(() => {
    const passed = qcRecords.filter((q: QCRecord) => q.status?.toLowerCase() === "passed").length;
    const failed = qcRecords.filter((q: QCRecord) => q.status?.toLowerCase() === "failed" || q.status?.toLowerCase() === "rework").length;
    const passRate = qcRecords.length > 0 ? Math.round((passed / qcRecords.length) * 100) : 0;
    return { passed, failed, passRate };
  }, [qcRecords]);

  const columns: ColumnDef<QCRecord>[] = useMemo(() => [
    {
      id: "id",
      header: "QC ID",
      accessor: (q: QCRecord) => <span className="font-mono text-xs text-muted-foreground">#{q.id}</span>,
    },
    {
      id: "trackingId",
      header: "Tracking ID",
      accessor: (q: QCRecord) => {
        const v = vehicles.find((v: Vehicle) => String(v.id) === String(q.vehicleId));
        return <span className="font-mono text-primary font-semibold text-[11px]">{v?.trackingId ?? `ID: ${q.vehicleId}`}</span>;
      },
    },
    {
      id: "vehicleNumber",
      header: "Vehicle #",
      accessor: (q: QCRecord) => {
        const v = vehicles.find((v: Vehicle) => String(v.id) === String(q.vehicleId));
        return <span className="font-medium">{v?.vehicleNumber ?? "—"}</span>;
      },
    },
    {
      id: "stage",
      header: "Stage",
      accessor: (q: QCRecord) => <span className="capitalize text-xs">{q.stage}</span>,
    },
    {
      id: "status",
      header: "Status",
      accessor: (q: QCRecord) => <QCResultBadge status={q.status} />,
    },
    {
      id: "defects",
      header: "Defects",
      accessor: (q: QCRecord) => (
        <span className={cn("tabular-nums font-semibold", q.defects && q.defects.length > 0 ? "text-destructive" : "text-muted-foreground")}>
          {q.defects?.length || 0}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      accessor: (q: QCRecord) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setSelectedRecord(q)}>Manage</Button>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline"><ChevronDown size={14} /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Enterprise Admin</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTimeout(() => setEditRecord(q), 0)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit QC Record
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeout(() => setReworkRecord(q), 0)}>
                  <AlertCircle className="mr-2 h-4 w-4 text-warning" /> Rework
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTimeout(() => setHistoryRecord(q), 0)}>
                  <History className="mr-2 h-4 w-4 text-muted-foreground" /> Audit History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ),
    }
  ], [vehicles, canEdit]);

  const [actionReason, setActionReason] = useState<{ action: string; record: QCRecord } | null>(null);

  const handleReasonAction = (reason: string) => {
    setActionReason(null);
  };

  if (isLoadingQC || isLoadingVehicles) {
    return <div className="p-4 md:p-6 space-y-4 animate-pulse"><div className="h-10 w-48 bg-muted rounded-lg" /><div className="h-64 bg-card border border-border rounded-xl" /></div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Quality Control</h1>
          <p className="text-sm text-muted-foreground">Inspection workflow, checklists, and defect management</p>
        </div>
        <AddQCModal vehicles={vehicles} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Passed", count: stats.passed, icon: <CheckCircle2 size={18} />, cls: "text-success bg-success/15" },
          { label: "Failed/Rework", count: stats.failed, icon: <XCircle size={18} />, cls: "text-destructive bg-destructive/15" },
          { label: "Pass Rate", count: `${stats.passRate}%`, icon: <AlertCircle size={18} />, cls: "text-primary bg-primary/15" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-subtle">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", s.cls)}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={qcRecords} rowId={(q) => String(q.id)} searchKey={(q) => `${q.stage} ${q.status}`} />

      <QCDetailsDrawer record={selectedRecord} open={!!selectedRecord} onClose={() => setSelectedRecord(null)} vehicles={vehicles} />
      
      <EditRecordDialog
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
        title={`Edit QC Record #${editRecord?.id}`}
        fields={editRecord ? [
          { name: "status", label: "Status", type: "select", defaultValue: editRecord.status, options: ["Pending", "In Progress", "Passed", "Failed", "Rework"] },
          { name: "notes", label: "Notes", type: "text", defaultValue: editRecord.notes || "" },
        ] : []}
        onSubmit={(data) => {
          if (!editRecord) return;
          updateMutation.mutate({ 
            id: editRecord.id, 
            data: { 
              status: data.status,
              notes: data.notes,
              reason: data.reason
            }
          }, {
            onSuccess: () => setEditRecord(null)
          });
        }}
        isSubmitting={updateMutation.isPending}
      />

      <ReasonPromptDialog
        open={!!actionReason}
        onOpenChange={(open) => !open && setActionReason(null)}
        title={`Confirm ${actionReason?.action} for QC #${actionReason?.record?.id}`}
        description="Please provide a reason for this action."
        onSubmit={handleReasonAction}
      />

      <AuditHistoryDrawer
        open={!!historyRecord}
        onOpenChange={(open) => !open && setHistoryRecord(null)}
        recordId={historyRecord?.vehicleId?.toString() || ""}
        module="quality_records"
        title={`Audit History: QC for Vehicle #${historyRecord?.vehicleId}`}
      />
    </div>
  );
}
