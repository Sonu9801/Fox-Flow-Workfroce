"use client";

import React, { useState, useEffect } from "react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle, XCircle, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function PayrollAdvancesTab() {
  const [advances, setAdvances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [workers, setWorkers] = useState<any[]>([]);
  const [newAdvance, setNewAdvance] = useState({ worker_id: "", amount: "", reason: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAdvances = () => {
    api.get("/payroll/advances")
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          setAdvances(data);
        } else {
          setAdvances([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setAdvances([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAdvances();
    api.get("/workers").then(res => {
      if (Array.isArray(res.data)) setWorkers(res.data.filter((w: any) => w.employmentStatus === "Active"));
    }).catch(console.error);
  }, []);

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await api.patch(`/payroll/advances/${id}/status?status=${status}`);
      fetchAdvances();
      toast.success(`Advance ${status}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handleAddAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdvance.worker_id || !newAdvance.amount) return;
    setIsSubmitting(true);
    try {
      await api.post("/payroll/advances", {
        worker_id: parseInt(newAdvance.worker_id),
        amount: parseFloat(newAdvance.amount),
        reason: newAdvance.reason || "Advance request"
      });
      toast.success("Advance recorded successfully!");
      setShowAddDialog(false);
      setNewAdvance({ worker_id: "", amount: "", reason: "" });
      fetchAdvances();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to record advance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      id: "employeeName",
      header: "Employee",
      accessor: (row) => <span className="font-semibold">{row.employeeName}</span>,
    },
    {
      id: "department",
      header: "Department",
      accessor: (row) => row.department,
    },
    {
      id: "amount",
      header: "Amount (₹)",
      accessor: (row) => <span className="font-mono text-destructive font-bold">₹{row.amount}</span>,
    },
    {
      id: "reason",
      header: "Reason",
      accessor: (row) => row.reason,
    },
    {
      id: "request_date",
      header: "Request Date",
      accessor: (row) => <span>{new Date(row.request_date).toLocaleDateString()}</span>,
    },
    {
      id: "status",
      header: "Status",
      accessor: (row) => {
        const s = row.status;
        if (s === "Approved") return <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10">{s}</Badge>;
        if (s === "Rejected") return <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/10">{s}</Badge>;
        return <Badge variant="outline" className="border-yellow-500/30 text-yellow-600 bg-yellow-500/10">{s}</Badge>;
      },
    },
    {
      id: "deducted",
      header: "Deducted?",
      accessor: (row) => (
        row.deducted ? 
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Yes</Badge> : 
          <Badge variant="secondary" className="bg-muted/50 text-muted-foreground">No</Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      accessor: (row) => (
        row.status === "Pending" ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-emerald-500 text-emerald-600 hover:bg-emerald-50" onClick={() => handleStatusUpdate(row.id, "Approved")}>
              <CheckCircle size={14} className="mr-1"/> Approve
            </Button>
            <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleStatusUpdate(row.id, "Rejected")}>
              <XCircle size={14} className="mr-1"/> Reject
            </Button>
          </div>
        ) : null
      ),
    },
  ];

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-14 bg-card rounded-xl"></div><div className="h-96 bg-card rounded-xl"></div></div>;
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted/10 gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search advances..." 
            className="pl-9 h-10 bg-background rounded-xl border-input w-full"
          />
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2 w-full sm:w-auto justify-center">
          <Plus size={16} /> Record Advance
        </Button>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record New Advance</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAdvance} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <select 
                required
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={newAdvance.worker_id}
                onChange={e => setNewAdvance({...newAdvance, worker_id: e.target.value})}
              >
                <option value="">Select an employee</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.employeeId})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹) *</Label>
              <Input 
                type="number" 
                required 
                min="1"
                placeholder="0.00"
                value={newAdvance.amount}
                onChange={e => setNewAdvance({...newAdvance, amount: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Input 
                placeholder="e.g. Medical emergency"
                value={newAdvance.reason}
                onChange={e => setNewAdvance({...newAdvance, reason: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Record Advance"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <div className="flex-1 overflow-auto">
        <DataTable 
          columns={columns} 
          data={advances} 
          searchKey={(row) => row.employeeName} 
          rowId={(row) => row.id.toString()}
        />
      </div>
    </div>
  );
}
