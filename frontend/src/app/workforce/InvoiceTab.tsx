import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/api";
import { Receipt, IndianRupee, Clock, CheckCircle2, FileText, Download, Plus } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { AddInvoiceDialog } from "@/components/invoices/AddInvoiceDialog";

export function InvoiceTab({ activeUser }: { activeUser: any }) {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: invoicesApi.getAll,
    refetchInterval: 60000,
  });

  const { data: stats } = useQuery({
    queryKey: ["invoiceStats"],
    queryFn: invoicesApi.getDashboardStats,
  });

  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Paid</span>;
      case "Pending":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12}/> Pending</span>;
      case "Overdue":
        return <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12}/> Overdue</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Invoices</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage and track your billing.</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Receipt size={24} />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors"
          >
            <Plus size={16} />
            Add Invoice
          </button>
          <button 
            onClick={() => router.push("/invoices/upload?returnTo=/workforce/supervisor")}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors"
          >
            <Plus size={16} />
            Upload Invoice
          </button>
        </div>
      </div>

      <AddInvoiceDialog open={showAddModal} onOpenChange={setShowAddModal} />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
              <IndianRupee size={16} />
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Paid</p>
          </div>
          <p className="text-xl font-bold">₹{stats?.total_paid?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 rounded-xl">
              <Clock size={16} />
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Pending</p>
          </div>
          <p className="text-xl font-bold">₹{stats?.total_pending?.toLocaleString() || 0}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Recent Invoices</h3>
        
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <Receipt className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={32} />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No invoices found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.slice(0, 10).map((inv: any) => (
              <div key={inv.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-500 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{inv.invoice_number}</p>
                      <p className="text-xs text-gray-500">{inv.oem_name}</p>
                    </div>
                  </div>
                  {getStatusBadge(inv.status)}
                </div>
                
                <div className="flex justify-between items-end mt-2 pt-3 border-t border-gray-50 dark:border-zinc-800/50">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Due Date</p>
                    <p className="font-semibold text-sm">
                      {inv.due_date ? format(new Date(inv.due_date), "MMM dd, yyyy") : "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">Amount</p>
                    <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400">₹{(inv.amount || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
