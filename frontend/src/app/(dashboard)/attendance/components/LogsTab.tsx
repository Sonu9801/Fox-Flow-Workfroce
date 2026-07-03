import React, { useState } from "react";
import { useAttendanceLogs, useAttendanceExceptions, useApproveException } from "@/hooks/useQueries";
import AttendanceDetailsDrawer from "./AttendanceDetailsDrawer";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, differenceInMinutes, parseISO } from "date-fns";
import { Download, FileText, MapPin, Camera, AlertCircle } from "lucide-react";

import { EditRecordDialog } from "@/components/shared/EditRecordDialog";
import { ReasonPromptDialog } from "@/components/shared/ReasonPromptDialog";
import { AuditHistoryDrawer } from "@/components/shared/AuditHistoryDrawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, History, PowerOff, KeyRound } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUpdateAttendance } from "@/hooks/useQueries";
import { toast } from "sonner";

export default function LogsTab() {
  const { data: logs, isLoading } = useAttendanceLogs();
  const { data: exceptions } = useAttendanceExceptions();
  const approveMutation = useApproveException();
  const updateAttendance = useUpdateAttendance();
  const userRole = useAuthStore((state: any) => state.role) || "operator";
  
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [historyRecord, setHistoryRecord] = useState<any>(null);
  const [exceptionToApprove, setExceptionToApprove] = useState<any>(null);

  const columns: ColumnDef<any>[] = [
    {
      id: "date",
      header: "Date",
      accessor: (row) => row.date ? format(parseISO(row.date), "MMM dd, yyyy") : "N/A",
      sortable: true,
    },
    {
      id: "employee",
      header: "Employee",
      accessor: (row) => (
        <div>
          <p className="font-medium">{row.employee_name}</p>
          <p className="text-xs text-muted-foreground">{row.employee_id} • {row.department}</p>
        </div>
      ),
      sortable: true,
    },
    {
      id: "punchIn",
      header: "Punch In",
      accessor: (row) => row.punch_in ? format(parseISO(row.punch_in), "hh:mm a") : "--:--",
      sortable: true,
    },
    {
      id: "punchOut",
      header: "Punch Out",
      accessor: (row) => row.punch_out ? format(parseISO(row.punch_out), "hh:mm a") : "--:--",
      sortable: true,
    },
    {
      id: "workingHours",
      header: "Working Hours",
      accessor: (row) => {
        if (row.punch_in && row.punch_out) {
          const mins = differenceInMinutes(parseISO(row.punch_out), parseISO(row.punch_in));
          const hrs = Math.floor(mins / 60);
          const remainingMins = mins % 60;
          return `${hrs}h ${remainingMins}m`;
        }
        return "--";
      },
    },
    {
      id: "otHours",
      header: "OT Hours",
      accessor: (row) => row.ot_hours > 0 ? `${row.ot_hours} hrs` : "--",
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      accessor: (row) => {
        let variant: any = "outline";
        let colorClass = "bg-muted";
        
        switch (row.status) {
          case "Present":
            colorClass = "border-emerald-500 text-emerald-500 bg-emerald-500/10";
            break;
          case "Half Day":
            colorClass = "border-yellow-500 text-yellow-500 bg-yellow-500/10";
            break;
          case "Late":
            colorClass = "border-orange-500 text-orange-500 bg-orange-500/10";
            break;
          case "Absent":
            colorClass = "border-red-500 text-red-500 bg-red-500/10";
            break;
          case "Sunday Work":
            colorClass = "border-blue-500 text-blue-500 bg-blue-500/10";
            break;
        }

        return <Badge variant={variant} className={colorClass}>{row.status}</Badge>;
      },
      sortable: true,
    },
    {
      id: "verification",
      header: "Verification",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-full ${row.location_status === 'Verified' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`} title="Location Verified">
            <MapPin size={12} />
          </div>
          <div className={`p-1 rounded-full ${row.photo_status === 'Verified' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`} title="Photo Verified">
            <Camera size={12} />
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      accessor: (row) => {
        const canEdit = ["admin", "owner"].includes(userRole);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTimeout(() => { setSelectedRecord(row); setIsDrawerOpen(true); }, 0)}>
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" /> View Details
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Enterprise Admin</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTimeout(() => setEditRecord(row), 0)}>
                    <Edit className="mr-2 h-4 w-4 text-primary" /> Edit Attendance
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTimeout(() => setHistoryRecord(row), 0)}>
                    <History className="mr-2 h-4 w-4 text-muted-foreground" /> Audit History
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading logs...</div>;

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Attendance Logs
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Daily records of all punches, locations, and hours.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none justify-center gap-2">
            <FileText size={14} /> Export CSV
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none justify-center gap-2">
            <Download size={14} /> Export PDF
          </Button>
        </div>
      </div>

      {exceptions && exceptions.filter((e: any) => e.status === "Pending").length > 0 && (
        <div className="p-5 border-b border-border bg-orange-500/5">
           <h3 className="text-sm font-semibold text-orange-600 mb-3 flex items-center gap-2"><AlertCircle size={16} /> Pending Exceptions</h3>
           <div className="grid gap-3">
             {exceptions.filter((e: any) => e.status === "Pending").map((exc: any) => (
                <div key={exc.id} className="bg-card p-3 rounded-lg border border-border flex justify-between items-center shadow-sm">
                   <div>
                      <p className="font-medium text-sm">Worker ID: {exc.worker_id}</p>
                      <p className="text-xs text-muted-foreground">{exc.date} • {exc.exception_type} • {exc.notes}</p>
                   </div>
                   <Button size="sm" onClick={() => setExceptionToApprove(exc)} disabled={approveMutation.isPending}>
                     Approve
                   </Button>
                </div>
             ))}
           </div>
        </div>
      )}

      <div className="flex-1 p-5 overflow-hidden">
        <DataTable
          columns={columns}
          data={logs || []}
          searchKey={(row) => `${row.employee_name} ${row.employee_id} ${row.department} ${row.status}`}
          rowId={(row) => row.id.toString()}
        />
      </div>
      <AttendanceDetailsDrawer 
        open={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen} 
        record={selectedRecord} 
      />
      <EditRecordDialog
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
        title={`Edit Attendance: ${editRecord?.employee_name}`}
        fields={editRecord ? [
          { name: "status", label: "Status", type: "select", defaultValue: editRecord.status, options: ["Present", "Absent", "Half Day", "Late", "Sunday Work"] },
          { name: "punch_in", label: "Punch In (ISO)", type: "text", defaultValue: editRecord.punch_in || "" },
          { name: "punch_out", label: "Punch Out (ISO)", type: "text", defaultValue: editRecord.punch_out || "" },
          { name: "net_working_hours", label: "Net Working Hours", type: "number", defaultValue: editRecord.net_working_hours || 0 },
          { name: "ot_hours", label: "OT Hours", type: "number", defaultValue: editRecord.ot_hours || 0 },
          { name: "late_minutes", label: "Late Minutes", type: "number", defaultValue: editRecord.late_minutes || 0 },
        ] : []}
        onSubmit={(data) => {
          if (!editRecord) return;
          updateAttendance.mutate({ id: editRecord.id, data }, {
            onSuccess: () => {
              toast.success("Attendance updated");
              setEditRecord(null);
            }
          });
        }}
        isSubmitting={updateAttendance.isPending}
      />
      <AuditHistoryDrawer
        open={!!historyRecord}
        onOpenChange={(open) => !open && setHistoryRecord(null)}
        recordId={historyRecord?.id?.toString() || ""}
        module="attendance"
        title={`Audit History: ${historyRecord?.employee_name}`}
      />
      <ReasonPromptDialog
        open={!!exceptionToApprove}
        onOpenChange={(open) => !open && setExceptionToApprove(null)}
        title="Approve Exception"
        description={`Please provide a reason to approve this exception for Worker ID ${exceptionToApprove?.worker_id}.`}
        onSubmit={(reason) => {
          if (!exceptionToApprove) return;
          approveMutation.mutate({ id: exceptionToApprove.id, reason }, {
            onSuccess: () => {
              toast.success("Exception approved");
              setExceptionToApprove(null);
            }
          });
        }}
      />
    </div>
  );
}
