import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi, workersApi } from "@/lib/api";
import { format } from "date-fns";
import { Users, Clock, AlertCircle, CheckCircle2, Search, Filter } from "lucide-react";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function AttendanceTab({ activeUser }: { activeUser: any }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "present" | "absent" | "late">("all");

  const { data: analytics = {} } = useQuery({
    queryKey: ["attendanceAnalytics", activeUser.id],
    queryFn: () => attendanceApi.getAnalytics(),
    refetchInterval: 60000,
  });

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ["workers"],
    queryFn: () => workersApi.getAll(),
    refetchInterval: 60000,
  });

  const getFilteredWorkers = () => {
    let filtered = workers;
    
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((w: any) => 
        w.name.toLowerCase().includes(q) || w.employee_id.toLowerCase().includes(q)
      );
    }
    
    // Status Filter (Mocked status logic for UI since full live status might require specific endpoint)
    if (activeFilter !== "all") {
      filtered = filtered.filter((w: any) => {
        const s = (w.status || "offline").toLowerCase();
        if (activeFilter === "present") return s === "online" || s === "working";
        if (activeFilter === "absent") return s === "offline" || s === "on_leave";
        return true;
      });
    }
    
    return filtered;
  };

  const filteredWorkers = getFilteredWorkers();

  return (
    <div className="p-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Team Attendance</h2>
        <p className="text-sm text-gray-500 font-medium">{format(new Date(), "EEEE, MMMM do, yyyy")}</p>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
          <p className="text-xl font-black text-indigo-600">{analytics.today_punch_count || 0}</p>
          <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">Total</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-2xl border border-green-100 dark:border-green-900/30 text-center shadow-sm">
          <p className="text-xl font-black text-green-600">{analytics.present || 0}</p>
          <p className="text-[9px] font-bold text-green-700 uppercase mt-1">Present</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl border border-red-100 dark:border-red-900/30 text-center shadow-sm">
          <p className="text-xl font-black text-red-600">{analytics.absent || 0}</p>
          <p className="text-[9px] font-bold text-red-700 uppercase mt-1">Absent</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-2xl border border-orange-100 dark:border-orange-900/30 text-center shadow-sm">
          <p className="text-xl font-black text-orange-600">{analytics.late || 0}</p>
          <p className="text-[9px] font-bold text-orange-700 uppercase mt-1">Late</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input 
          placeholder="Search by name or ID..." 
          className="pl-10 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 rounded-xl h-12"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex overflow-x-auto pb-2 mb-4 gap-2 hide-scrollbar">
        {[
          { id: "all", label: "All Team" },
          { id: "present", label: "Present Today" },
          { id: "absent", label: "Absent" },
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
          [1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
        ) : filteredWorkers.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100">
            <Users className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-sm font-bold text-gray-500">No workers found</p>
          </div>
        ) : (
          filteredWorkers.map((worker: any, idx: number) => {
            const isOnline = worker.status?.toLowerCase() === "online" || worker.status?.toLowerCase() === "working";
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={worker.id}
                className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 flex items-center gap-4"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-gray-600 border border-gray-200">
                    {worker.name.charAt(0)}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{worker.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{worker.employee_id} • {worker.department}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={isOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600'}>
                    {isOnline ? 'Present' : 'Offline'}
                  </Badge>
                  {isOnline && <p className="text-[10px] text-gray-400 mt-1 flex items-center justify-end gap-1"><Clock size={10} /> Punched In</p>}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
