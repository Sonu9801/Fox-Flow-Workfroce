import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { leaveApi, workersApi } from "@/lib/api";
import { format } from "date-fns";
import { Calendar, Clock, CheckCircle2, XCircle, Search, Filter, ShieldCheck, FileSignature } from "lucide-react";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function LeavesTab({ activeUser }: { activeUser: any }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ["leaves"],
    queryFn: () => leaveApi.getAll(),
    refetchInterval: 60000,
  });

  const { data: workers = [] } = useQuery({
    queryKey: ["workers"],
    queryFn: () => workersApi.getAll(),
    staleTime: Infinity,
  });

  // Map worker IDs to names
  const workerMap = workers.reduce((acc: any, w: any) => {
    acc[w.id || w.worker_id] = w.name;
    return acc;
  }, {});

  const getFilteredLeaves = () => {
    let filtered = leaves;
    
    // Filter out leaves not relevant to this supervisor (if department filtering is needed)
    // For now, show all since PWA is a demo/prototype
    
    // Search by worker name
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((l: any) => {
        const wName = (workerMap[l.worker_id] || "Unknown").toLowerCase();
        return wName.includes(q) || l.leave_type?.toLowerCase().includes(q);
      });
    }
    
    // Status Filter
    if (activeFilter !== "all") {
      filtered = filtered.filter((l: any) => (l.status || "Pending").toLowerCase() === activeFilter);
    }
    
    return filtered.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const filteredLeaves = getFilteredLeaves();

  return (
    <div className="p-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Team Leaves</h2>
        <p className="text-sm text-gray-500 font-medium">Manage time-off requests</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-2xl border border-orange-100 dark:border-orange-900/30 text-center shadow-sm">
          <p className="text-xl font-black text-orange-600">{leaves.filter((l:any) => l.status === "Pending").length}</p>
          <p className="text-[9px] font-bold text-orange-700 uppercase mt-1">Pending</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-2xl border border-green-100 dark:border-green-900/30 text-center shadow-sm">
          <p className="text-xl font-black text-green-600">{leaves.filter((l:any) => l.status === "Approved").length}</p>
          <p className="text-[9px] font-bold text-green-700 uppercase mt-1">Approved</p>
        </div>
        <div className="bg-gray-50 dark:bg-zinc-800 p-3 rounded-2xl border border-gray-100 dark:border-zinc-700 text-center shadow-sm">
          <p className="text-xl font-black text-gray-600">{leaves.length}</p>
          <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">Total</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input 
          placeholder="Search by worker or leave type..." 
          className="pl-10 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 rounded-xl h-12"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex overflow-x-auto pb-2 mb-4 gap-2 hide-scrollbar">
        {[
          { id: "all", label: "All Records" },
          { id: "pending", label: "Pending" },
          { id: "approved", label: "Approved" },
          { id: "rejected", label: "Rejected" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === tab.id 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/20" 
                : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
        ) : filteredLeaves.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100">
            <FileSignature className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-sm font-bold text-gray-500">No leave records found</p>
          </div>
        ) : (
          filteredLeaves.map((leave: any, idx: number) => {
            const isPending = leave.status === "Pending";
            const isApproved = leave.status === "Approved";
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={leave.id}
                className="bg-white dark:bg-zinc-900 p-4 rounded-[20px] shadow-sm border border-gray-100 dark:border-zinc-800"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      isPending ? 'bg-orange-100 text-orange-600' : 
                      isApproved ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {workerMap[leave.worker_id]?.charAt(0) || "W"}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{workerMap[leave.worker_id] || "Unknown Worker"}</h4>
                      <p className="text-[10px] text-gray-500 font-medium">{leave.leave_type || "Annual Leave"}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] uppercase font-bold px-2 py-0.5 ${
                    isPending ? 'bg-orange-50 border-orange-200 text-orange-700' : 
                    isApproved ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    {leave.status}
                  </Badge>
                </div>
                
                <div className="mt-3 bg-gray-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">From</p>
                    <p className="text-xs font-semibold flex items-center gap-1.5"><Calendar size={12} className="text-indigo-400"/> {format(new Date(leave.start_date), "MMM dd, yyyy")}</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200 dark:bg-zinc-700"></div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">To</p>
                    <p className="text-xs font-semibold flex items-center gap-1.5"><Calendar size={12} className="text-indigo-400"/> {format(new Date(leave.end_date), "MMM dd, yyyy")}</p>
                  </div>
                </div>
                
                {leave.reason && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-2 rounded-lg italic">
                    "{leave.reason}"
                  </p>
                )}
                
                {isPending && (
                  <div className="mt-3 flex gap-2">
                    <p className="text-xs text-orange-600 font-medium flex items-center gap-1">
                      <ShieldCheck size={14} /> Head to Approvals Tab to accept/reject
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
