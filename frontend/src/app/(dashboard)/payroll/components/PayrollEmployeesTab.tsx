"use client";

import React, { useState, useMemo } from "react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Search, ChevronRight, Calculator, CalendarDays, Edit, History, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { useEmployeePayroll, useUpdateEmployeePayroll, useGeneratePayroll } from "@/hooks/useQueries";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function PayrollEmployeesTab() {
  const { data: employees = [], isLoading: loading } = useEmployeePayroll();
  const updatePayroll = useUpdateEmployeePayroll();
  const generatePayroll = useGeneratePayroll();
  
  const userRole = useAuthStore((state: any) => state.role) || "operator";
  const canEdit = ["admin", "owner"].includes(userRole);

  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [historyRecord, setHistoryRecord] = useState<any>(null);
  const [markPaidRecord, setMarkPaidRecord] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEmployees = useMemo(() => {
    return employees.filter((e: any) => e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [employees, searchTerm]);

  const generatePayslipPDF = (emp: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text("FOX ENTERPRISES", 105, 20, { align: "center" });
    doc.setFontSize(14);
    doc.text("Salary Slip", 105, 28, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 34, { align: "center" });

    // Employee Details
    doc.setFontSize(12);
    doc.text(`Employee Name: ${emp.employeeName}`, 14, 50);
    doc.text(`Employee ID: ${emp.employeeId}`, 14, 58);
    doc.text(`Department: ${emp.department}`, 14, 66);
    doc.text(`Role: ${emp.role}`, 14, 74);

    // Attendance Summary
    autoTable(doc, {
      startY: 85,
      head: [["Present Days", "Half Days", "Absent Days", "OT Hours", "Sunday Hours"]],
      body: [[
        emp.presentDays.toString(), 
        emp.halfDays.toString(), 
        emp.absentDays.toString(), 
        emp.otHours.toString(), 
        emp.sundayHours.toString()
      ]],
      theme: 'grid'
    });

    // Salary Breakdown
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    autoTable(doc, {
      startY: finalY,
      head: [["Earnings / Deductions", "Amount (INR)"]],
      body: [
        ["Base Salary", `Rs. ${emp.baseSalary.toFixed(2)}`],
        ["Overtime Pay", `+ Rs. ${emp.otAmount.toFixed(2)}`],
        ["Sunday Pay", `+ Rs. ${emp.sundayAmount.toFixed(2)}`],
        ["Bonus", `+ Rs. ${emp.bonusAmount.toFixed(2)}`],
        ["Advances / Deductions", `- Rs. ${emp.deductions.toFixed(2)}`]
      ],
      foot: [
        ["Net Final Salary", `Rs. ${emp.finalSalary.toFixed(2)}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
      footStyles: { fillColor: [46, 204, 113] }
    });

    // Save
    doc.save(`Payslip_${emp.employeeId}_${new Date().getMonth() + 1}_${new Date().getFullYear()}.pdf`);
  };

  const columns: ColumnDef<any>[] = [
    {
      id: "employeeId",
      header: "EMP ID",
      accessor: (row) => <span className="font-mono text-xs">{row.employeeId}</span>,
    },
    {
      id: "employeeName",
      header: "Name",
      accessor: (row) => <span className="font-semibold">{row.employeeName}</span>,
    },
    {
      id: "department",
      header: "Dept",
      accessor: (row) => row.department,
    },
    {
      id: "role",
      header: "Role",
      accessor: (row) => row.role,
    },
    {
      id: "baseSalary",
      header: "Base",
      accessor: (row) => <span className="font-mono text-muted-foreground">₹{row.baseSalary}</span>,
    },
    {
      id: "otAmount",
      header: "OT",
      accessor: (row) => <span className="font-mono text-orange-500">₹{row.otAmount}</span>,
    },
    {
      id: "sundayAmount",
      header: "Sunday",
      accessor: (row) => <span className="font-mono text-purple-500">₹{row.sundayAmount}</span>,
    },
    {
      id: "bonusAmount",
      header: "Bonus",
      accessor: (row) => <span className="font-mono text-emerald-500">₹{row.bonusAmount}</span>,
    },
    {
      id: "deductions",
      header: "Ded.",
      accessor: (row) => <span className="font-mono text-destructive">₹{row.deductions}</span>,
    },
    {
      id: "finalSalary",
      header: "Final (₹)",
      accessor: (row) => <span className="font-bold text-emerald-600 font-mono">₹{row.finalSalary}</span>,
    },
    {
      id: "status",
      header: "Status",
      accessor: (row) => (
        <Badge 
          variant="outline" 
          className={`cursor-pointer transition-colors hover:opacity-80 ${row.status === "Paid" ? "border-success/30 text-success bg-success/10" : "border-yellow-500/30 text-yellow-600 bg-yellow-500/10"}`}
          onClick={() => setEditRecord(row)}
        >
          {row.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      accessor: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ChevronRight size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setTimeout(() => setSelectedEmp(row), 0)}>
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => generatePayslipPDF(row)}>
              <Download className="mr-2 h-4 w-4 text-muted-foreground" /> Download Payslip
            </DropdownMenuItem>
            
            {canEdit && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Enterprise Admin</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTimeout(() => setEditRecord(row), 0)}>
                  <Edit className="mr-2 h-4 w-4 text-primary" /> Edit Salary Components
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeout(() => setMarkPaidRecord(row), 0)}>
                  <CheckCircle className="mr-2 h-4 w-4 text-success" /> Mark as Paid
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTimeout(() => setHistoryRecord(row), 0)}>
                  <History className="mr-2 h-4 w-4 text-muted-foreground" /> Audit History
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-14 bg-card rounded-xl"></div>
      <div className="h-96 bg-card rounded-xl"></div>
    </div>;
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
      
      {/* TOOLBAR */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted/10 gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search employees..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-background rounded-xl border-input w-full"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none justify-center rounded-xl h-10 border-emerald-500/30 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
              onClick={() => {
                generatePayroll.mutate(undefined, {
                  onSuccess: () => toast.success("Payroll generation initiated")
                });
              }}
            >
              <Calculator size={16} className="mr-2"/> Generate Payroll
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl h-10 gap-2 border-border">
            <FileText size={16} /> Export CSV
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto">
        <DataTable 
          columns={columns} 
          data={filteredEmployees} 
          searchKey={(row) => row.employeeName} 
          rowId={(row) => row.id.toString()}
        />
      </div>

      {/* PAYROLL DETAILS DRAWER */}
      <Sheet open={!!selectedEmp} onOpenChange={(open) => !open && setSelectedEmp(null)}>
        <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto" side="right">
          {selectedEmp && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-bold flex items-center gap-3">
                  {selectedEmp.employeeName}
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">{selectedEmp.status}</Badge>
                </SheetTitle>
                <SheetDescription>
                  {selectedEmp.employeeId} • {selectedEmp.department} • {selectedEmp.role}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6">
                
                {/* Actions */}
                <div className="flex gap-3 pb-6 border-b border-border">
                  {canEdit && (
                    <Button className="flex-1 bg-primary text-primary-foreground" onClick={() => { setSelectedEmp(null); setEditRecord(selectedEmp); }}>Edit Payroll</Button>
                  )}
                  <Button variant="secondary" className="flex-1" onClick={() => generatePayslipPDF(selectedEmp)}><Download size={16} className="mr-2"/> Payslip</Button>
                </div>

                {/* Attendance Summary */}
                <div>
                  <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2"><CalendarDays size={16}/> Attendance Summary</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-success/10 border border-success/20 p-3 rounded-xl text-center">
                      <p className="text-2xl font-black text-success">{selectedEmp.presentDays}</p>
                      <p className="text-xs font-semibold text-success/80">Present</p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl text-center">
                      <p className="text-2xl font-black text-yellow-600">{selectedEmp.halfDays}</p>
                      <p className="text-xs font-semibold text-yellow-600/80">Half Days</p>
                    </div>
                    <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-xl text-center">
                      <p className="text-2xl font-black text-destructive">{selectedEmp.absentDays}</p>
                      <p className="text-xs font-semibold text-destructive/80">Absent</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl flex justify-between items-center">
                      <span className="text-xs font-semibold text-orange-600">OT Hours</span>
                      <span className="font-black text-orange-600">{selectedEmp.otHours}h</span>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl flex justify-between items-center">
                      <span className="text-xs font-semibold text-purple-600">Sunday Hrs</span>
                      <span className="font-black text-purple-600">{selectedEmp.sundayHours}h</span>
                    </div>
                  </div>
                </div>

                {/* Salary Breakdown */}
                <div>
                  <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4 mt-8">Salary Breakdown</h4>
                  <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-3 font-mono text-sm">
                    <div className="flex justify-between"><span>Base Salary</span><span>₹{selectedEmp.baseSalary}</span></div>
                    <div className="flex justify-between text-orange-500"><span>Overtime Pay</span><span>+ ₹{selectedEmp.otAmount}</span></div>
                    <div className="flex justify-between text-purple-500"><span>Sunday Pay</span><span>+ ₹{selectedEmp.sundayAmount}</span></div>
                    <div className="flex justify-between text-emerald-500"><span>Bonus</span><span>+ ₹{selectedEmp.bonusAmount}</span></div>
                    <div className="flex justify-between text-destructive"><span>Deductions</span><span>- ₹{selectedEmp.deductions}</span></div>
                    <div className="pt-3 mt-3 border-t border-border flex justify-between text-lg font-bold text-foreground">
                      <span>Final Salary</span><span>₹{selectedEmp.finalSalary}</span>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Enterprise Admin Dialogs */}
      <EditRecordDialog
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
        title={`Edit Payroll: ${editRecord?.employeeName}`}
        fields={editRecord ? [
          { name: "base_salary", label: "Base Salary", type: "number", defaultValue: editRecord.baseSalary },
          { name: "ot_amount", label: "OT Amount", type: "number", defaultValue: editRecord.otAmount },
          { name: "sunday_amount", label: "Sunday Amount", type: "number", defaultValue: editRecord.sundayAmount },
          { name: "bonus_amount", label: "Bonus", type: "number", defaultValue: editRecord.bonusAmount },
          { name: "deductions", label: "Deductions", type: "number", defaultValue: editRecord.deductions },
          { name: "status", label: "Status", type: "select", defaultValue: editRecord.status, options: ["Draft", "Approved", "Paid"] },
        ] : []}
        onSubmit={(data) => {
          if (!editRecord) return;
          updatePayroll.mutate({ id: editRecord.id, data: { ...data, month: editRecord.month || "2026-06" } }, {
            onSuccess: () => {
              toast.success("Payroll updated successfully");
              setEditRecord(null);
            }
          });
        }}
        isSubmitting={updatePayroll.isPending}
      />

      <ReasonPromptDialog
        open={!!markPaidRecord}
        onOpenChange={(open) => !open && setMarkPaidRecord(null)}
        title="Mark Payroll as Paid"
        description={`Confirm marking payroll for ${markPaidRecord?.employeeName} as PAID.`}
        onSubmit={(reason) => {
          if (!markPaidRecord) return;
          updatePayroll.mutate({ 
            id: markPaidRecord.id, 
            data: { month: markPaidRecord.month || "2026-06", status: "Paid", reason } 
          }, {
            onSuccess: () => {
              toast.success("Payroll marked as paid");
              setMarkPaidRecord(null);
            }
          });
        }}
      />

      <AuditHistoryDrawer
        open={!!historyRecord}
        onOpenChange={(open) => !open && setHistoryRecord(null)}
        recordId={historyRecord?.id?.toString() || ""}
        module="payroll"
        title={`Audit History: Payroll for ${historyRecord?.employeeName}`}
      />

    </div>
  );
}
