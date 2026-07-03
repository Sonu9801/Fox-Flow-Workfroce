"use client";

import React, { useState, useMemo } from "react";
import type { ColumnDef } from "@/components/ui/DataTable";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDispatchRecords, useVehicles, useUpdateDispatchRecord } from "@/hooks/useQueries";
import type { DispatchRecord, Vehicle } from "@/types";
import { Calendar, ExternalLink, MapPin, Package, Truck, Edit, History, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditRecordDialog } from "@/components/shared/EditRecordDialog";
import { AuditHistoryDrawer } from "@/components/shared/AuditHistoryDrawer";

const STATUS_CONFIG: Record<
  DispatchRecord["status"],
  { label: string; cls: string }
> = {
  pending: { label: "Pending", cls: "bg-muted text-muted-foreground" },
  scheduled: { label: "Scheduled", cls: "bg-primary/15 text-primary" },
  in_transit: { label: "In Transit", cls: "bg-warning/15 text-warning" },
  dispatched: { label: "Delivered", cls: "bg-success/15 text-success" },
};

const STATUSES = ["All", "pending", "scheduled", "in_transit", "dispatched"];
const CARRIERS = ["All", "BlueDart", "DHL", "FedEx", "DTDC", "Gati"];

function DispatchStatusBadge({ status }: { status: DispatchRecord["status"] }) {
  const normStatus = status.toLowerCase() as DispatchRecord["status"];
  const cfg = STATUS_CONFIG[normStatus] || STATUS_CONFIG.pending;
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

function DispatchExpand({ record }: { record: DispatchRecord }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/10 rounded-xl border border-border/50">
      <div>
        <p className="text-xs font-semibold text-foreground mb-1">
          Destination
        </p>
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin size={11} className="mt-0.5 flex-shrink-0" />
          <span>{record.destination}</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground mb-1">Tracking</p>
        <a
          href={`https://track.dtdc.com/trace-tracking.do?trackingNo=${record.trackingNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
        >
          <ExternalLink size={11} />
          {record.trackingNumber}
        </a>
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground mb-1">
          Special Instructions
        </p>
        <p className="text-xs text-muted-foreground">
          Handle with care. Fragile mounting hardware.
        </p>
      </div>
    </div>
  );
}

export default function DispatchPage() {
  const { data: dispatchRecords = [], isLoading: isLoadingDispatch } = useDispatchRecords();
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles();
  const updateDispatchMutation = useUpdateDispatchRecord();

  const { useAuthStore } = require("@/store/authStore");
  const userRole = useAuthStore((state: any) => state.role) || "operator";
  const canEdit = ["admin", "owner"].includes(userRole);

  const [editRecord, setEditRecord] = useState<DispatchRecord | null>(null);
  const [historyRecord, setHistoryRecord] = useState<DispatchRecord | null>(null);

  const [statusFilter, setStatusFilter] = useState("All");
  const [carrierFilter, setCarrierFilter] = useState("All");

  const stats = useMemo(() => {
    const scheduled = dispatchRecords.filter((d: DispatchRecord) => d.status.toLowerCase() === "scheduled").length;
    const inTransit = dispatchRecords.filter((d: DispatchRecord) => d.status.toLowerCase() === "in_transit").length;
    const delivered = dispatchRecords.filter((d: DispatchRecord) => d.status.toLowerCase() === "dispatched").length;
    return { scheduled, inTransit, delivered };
  }, [dispatchRecords]);

  const filtered = useMemo(() => {
    return dispatchRecords.filter((d: DispatchRecord) => {
      const statusOk = statusFilter === "All" || d.status.toLowerCase() === statusFilter.toLowerCase();
      const carrierOk =
        carrierFilter === "All" ||
        d.carrier.toLowerCase().includes(carrierFilter.toLowerCase());
      return statusOk && carrierOk;
    });
  }, [dispatchRecords, statusFilter, carrierFilter]);

  const columns: ColumnDef<DispatchRecord>[] = useMemo(() => [
    {
      id: "trackingId",
      header: "Tracking ID",
      accessor: (d: DispatchRecord) => {
        const v = vehicles.find((v: Vehicle) => v.id === d.vehicleId.toString());
        return (
          <span className="font-mono text-primary font-semibold text-[11px]">
            {v?.trackingId ?? `ID: ${d.vehicleId}`}
          </span>
        );
      },
      sortable: true,
    },
    {
      id: "vehicle",
      header: "Vehicle #",
      accessor: (d: DispatchRecord) => {
        const v = vehicles.find((v: Vehicle) => v.id === d.vehicleId.toString());
        return (
          <span className="font-semibold">
            {v?.vehicleNumber ?? `ID: ${d.vehicleId}`}
          </span>
        );
      },
      sortable: true,
    },
    {
      id: "oem",
      header: "OEM",
      accessor: (d: DispatchRecord) => {
        const v = vehicles.find((v: Vehicle) => v.id === d.vehicleId.toString());
        return (
          <span className="text-muted-foreground text-[12px]">
            {v?.oemName ?? "-"}
          </span>
        );
      },
      sortable: true,
    },
    {
      id: "readyDate",
      header: "Ready Date",
      accessor: (d: DispatchRecord) => {
        const v = vehicles.find((v: Vehicle) => v.id === d.vehicleId.toString());
        return (
          <span className="tabular-nums text-muted-foreground">
            {v?.estimatedDelivery ? new Date(v.estimatedDelivery).toLocaleDateString("en-IN") : "-"}
          </span>
        );
      },
      sortable: true,
    },
    {
      id: "dispatchDate",
      header: "Dispatch Date",
      accessor: (d: DispatchRecord) => (
        <span className="tabular-nums text-muted-foreground">
          {d.scheduledDate ? new Date(d.scheduledDate).toLocaleDateString("en-IN") : "-"}
        </span>
      ),
      sortable: true,
    },
    {
      id: "carrier",
      header: "Carrier",
      accessor: (d: DispatchRecord) => (
        <span className="flex items-center gap-1">
          <Truck size={11} className="text-muted-foreground" />
          {d.carrier}
        </span>
      ),
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      accessor: (d: DispatchRecord) => <DispatchStatusBadge status={d.status} />,
    },
    {
      id: "actions",
      header: "",
      accessor: (d: DispatchRecord) => {
        if (!canEdit) return null;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline"><ChevronDown size={14} /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Enterprise Admin</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTimeout(() => setEditRecord(d), 0)}>
                  <Edit className="mr-2 h-4 w-4 text-primary" /> Edit Dispatch Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTimeout(() => setHistoryRecord(d), 0)}>
                  <History className="mr-2 h-4 w-4 text-muted-foreground" /> Audit History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    }
  ], [vehicles, canEdit]);

  if (isLoadingDispatch || isLoadingVehicles) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-24 bg-card border border-border rounded-xl p-4" />
          ))}
        </div>
        <div className="h-64 bg-card border border-border rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6" data-ocid="dispatch.page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Dispatch
          </h1>
          <p className="text-sm text-muted-foreground">
            Outbound shipments and carrier tracking
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Scheduled",
            count: stats.scheduled,
            icon: <Calendar size={18} />,
            cls: "bg-muted/50 text-muted-foreground",
          },
          {
            label: "In Transit",
            count: stats.inTransit,
            icon: <Truck size={18} />,
            cls: "bg-warning/15 text-warning",
          },
          {
            label: "Delivered Today",
            count: stats.delivered,
            icon: <Package size={18} />,
            cls: "bg-success/15 text-success",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-subtle"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                s.cls,
              )}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">
                {s.count}
              </p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowId={(d) => String(d.id)}
        searchKey={(d) => {
          const v = vehicles.find((v: Vehicle) => v.id === d.vehicleId.toString());
          return `${v?.trackingId ?? d.vehicleId} ${v?.vehicleNumber ?? ""} ${d.carrier} ${d.trackingNumber}`;
        }}
        expandable={(d) => <DispatchExpand record={d} />}
        bulkAction={(rows) => (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                toast.success(`${rows.length} dispatch(es) scheduled`)
              }
              data-ocid="dispatch.schedule_button"
            >
              Schedule Dispatch
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                toast.success(`${rows.length} marked as delivered`)
              }
              data-ocid="dispatch.mark_delivered_button"
            >
              Mark Delivered
            </Button>
          </div>
        )}
        extraFilters={
          <>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              data-ocid="dispatch.status_filter"
              className="h-8 text-xs bg-muted/40 border border-border rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "All"
                    ? "All Statuses"
                    : s
                        .split("_")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                </option>
              ))}
            </select>
            <select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              data-ocid="dispatch.carrier_filter"
              className="h-8 text-xs bg-muted/40 border border-border rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {CARRIERS.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Carriers" : c}
                </option>
              ))}
            </select>
          </>
        }
      />

      <EditRecordDialog
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
        title={`Edit Dispatch #${editRecord?.id}`}
        fields={editRecord ? [
          { name: "status", label: "Status", type: "select", defaultValue: editRecord.status, options: ["Scheduled", "In Transit", "Delivered", "Delayed"] },
          { name: "driverName", label: "Driver Name", type: "text", defaultValue: editRecord.driverName || "" },
          { name: "driverPhone", label: "Driver Phone", type: "text", defaultValue: editRecord.driverPhone || "" },
          { name: "dispatchDate", label: "Dispatch Date", type: "text", defaultValue: editRecord.dispatchDate || "" },
        ] : []}
        onSubmit={(data) => {
          if (!editRecord) return;
          updateDispatchMutation.mutate({ 
            id: editRecord.id, 
            data: { ...data, reason: data.reason } 
          }, {
            onSuccess: () => setEditRecord(null)
          });
        }}
        isSubmitting={updateDispatchMutation.isPending}
      />



      <AuditHistoryDrawer
        open={!!historyRecord}
        onOpenChange={(open) => !open && setHistoryRecord(null)}
        recordId={historyRecord?.vehicleId?.toString() || ""}
        module="dispatch_records"
        title={`Audit History: Dispatch for Vehicle #${historyRecord?.vehicleId}`}
      />
    </div>
  );
}
