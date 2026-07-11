"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useInvoices, useUpdateInvoice } from "@/hooks/useQueries";
import { ChevronLeft, FileText, Download, CheckCircle, XCircle, Clock, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

export default function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { data: invoices = [], isLoading } = useInvoices();
  const updateMutation = useUpdateInvoice();
  
  const role = useAuthStore((state: any) => state.role);
  const canEdit = ["admin", "owner", "finance_manager"].includes(role);

  const [invoice, setInvoice] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  
  useEffect(() => {
    if (invoices.length > 0) {
      const found = invoices.find((inv: any) => String(inv.id) === id);
      if (found) {
        setInvoice(found);
        setEditData({
          expense_category: found.expense_category || "",
          department: found.department || "",
          payment_status: found.payment_status || "Unpaid",
          approval_status: found.approval_status || "Pending Review",
          finance_remarks: found.finance_remarks || "",
        });
      }
    }
  }, [invoices, id]);

  const handleSave = async () => {
    if (!invoice) return;
    try {
      await updateMutation.mutateAsync({ id: invoice.id, data: editData });
      toast.success("Invoice updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update invoice");
    }
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.6:8000";
  let BASE_URL = API_URL.replace(/\/api\/?$/, "");
  // Replace 0.0.0.0 with localhost for browser compatibility
  if (BASE_URL.includes("0.0.0.0")) {
    BASE_URL = BASE_URL.replace("0.0.0.0", "localhost");
  }

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center min-h-[50vh]"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  if (!invoice) {
    return <div className="p-6 text-center text-muted-foreground">Invoice not found</div>;
  }

  return (
    <div className="p-4 md:p-6 pb-24" data-ocid="invoices.details">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-display text-foreground">
            Invoice #{invoice.invoice_number || invoice.id}
          </h1>
          <p className="text-sm text-muted-foreground">
            {invoice.vendor_name} • {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'Unknown Date'}
          </p>
        </div>
        <Button variant="outline" onClick={() => window.open(`${BASE_URL}${invoice.file_path}`, '_blank')}>
          <Download size={16} className="mr-2" /> Download File
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side - Invoice Original File */}
        <div className="bg-card border border-border rounded-xl shadow-subtle overflow-hidden flex flex-col h-full min-h-[500px]">
          <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <h3 className="font-semibold">Original Document</h3>
          </div>
          <div className="flex-1 bg-muted/10 relative p-4 flex items-center justify-center">
             {invoice.file_path.toLowerCase().endsWith('.pdf') ? (
               <div className="text-center">
                 <FileText size={64} className="text-muted-foreground mx-auto mb-4" />
                 <p className="text-muted-foreground mb-4">PDF Preview not available inline.</p>
                 <Button onClick={() => window.open(`${BASE_URL}${invoice.file_path}`, '_blank')}>View PDF</Button>
               </div>
             ) : (
               <img src={`${BASE_URL}${invoice.file_path}`} alt="Invoice" className="max-w-full max-h-[70vh] object-contain rounded-lg border border-border/50 shadow-sm" />
             )}
          </div>
        </div>

        {/* Right Side - Details and Edit Form */}
        <div className="flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl shadow-subtle overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold">Extracted Information</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Vendor</p>
                  <p className="font-medium">{invoice.vendor_name}</p>
                  <p className="text-xs text-muted-foreground">{invoice.vendor_gstin}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Invoice Date</p>
                  <p className="font-medium">{invoice.invoice_date}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Tax / GST Amount</p>
                  <p className="font-medium">₹{invoice.gst_amount?.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Grand Total</p>
                  <p className="text-xl font-bold text-primary">₹{invoice.grand_total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-subtle overflow-hidden flex-1">
            <div className="p-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold">Management & Processing</h3>
            </div>
            <div className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Expense Category</label>
                  <input 
                    type="text" 
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                    value={editData.expense_category}
                    onChange={(e) => setEditData({...editData, expense_category: e.target.value})}
                    disabled={!canEdit}
                    placeholder="e.g. Raw Materials"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Department</label>
                  <input 
                    type="text" 
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                    value={editData.department}
                    onChange={(e) => setEditData({...editData, department: e.target.value})}
                    disabled={!canEdit}
                    placeholder="e.g. Production"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Approval Status</label>
                  <select 
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                    value={editData.approval_status}
                    onChange={(e) => setEditData({...editData, approval_status: e.target.value})}
                    disabled={!canEdit}
                  >
                    <option value="Pending Review">Pending Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Payment Status</label>
                  <select 
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                    value={editData.payment_status}
                    onChange={(e) => setEditData({...editData, payment_status: e.target.value})}
                    disabled={!canEdit}
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Finance Remarks</label>
                <textarea 
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                  value={editData.finance_remarks}
                  onChange={(e) => setEditData({...editData, finance_remarks: e.target.value})}
                  disabled={!canEdit}
                  placeholder="Add any internal notes..."
                />
              </div>
              
              {canEdit && (
                <div className="pt-4 flex justify-end">
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline and Audit History */}
      <div className="mt-8 bg-card border border-border rounded-xl shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            Invoice Timeline & Audit Logs
          </h3>
        </div>
        <div className="p-6">
          <div className="relative border-l-2 border-border/50 ml-4 pl-6 space-y-6">
            <div className="relative">
              <div className="absolute -left-[31px] bg-primary w-4 h-4 rounded-full border-4 border-card" />
              <p className="text-sm font-semibold">Uploaded & OCR Completed</p>
              <p className="text-xs text-muted-foreground">{new Date(invoice.created_at).toLocaleString()}</p>
            </div>
            {invoice.audit_logs?.map((log: any, idx: number) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[31px] bg-muted w-4 h-4 rounded-full border-4 border-card" />
                <p className="text-sm">
                  <span className="font-semibold">{log.edited_by}</span> updated 
                  <span className="font-medium text-primary ml-1">{log.field_name.replace("_", " ")}</span>
                </p>
                <div className="bg-muted/30 p-2 rounded mt-2 inline-block">
                  <p className="text-xs text-muted-foreground">
                    <span className="line-through mr-2">{log.old_value || "None"}</span>
                    <span className="text-foreground font-medium">→ {log.new_value || "None"}</span>
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(log.edited_date).toLocaleString()} • {log.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
