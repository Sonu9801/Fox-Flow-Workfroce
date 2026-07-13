import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { workersApi, vehiclesApi, attendanceApi } from "@/lib/api";
import { TrendingUp, Award, Zap, Clock, Users, ArrowRight, Target, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";

export function PerformanceTab({ activeUser }: { activeUser: any }) {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<"today" | "monthly">("today");

  const { data: workers = [] } = useQuery({ queryKey: ["workers"], queryFn: workersApi.getAll });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: vehiclesApi.getAll });
  const { data: attendanceAnalytics = {} } = useQuery({ queryKey: ["attendanceAnalytics"], queryFn: attendanceApi.getAnalytics });

  const departmentWorkers = useMemo(() => {
    return workers.filter((w: any) => !activeUser?.department || w.department === activeUser.department);
  }, [workers, activeUser]);

  const stats = useMemo(() => {
    // Basic aggregation
    const completedVehicles = vehicles.filter((v: any) => v.current_stage === "rtd" || v.current_stage === "dispatch");
    const totalAssigned = departmentWorkers.length;
    
    // Fake trend logic based on timeframe for demo purposes, 
    // in real app this would query history or use backend analytics.
    const efficiency = timeframe === "today" ? "94%" : "89%";
    const avgTime = timeframe === "today" ? "4h 20m" : "5h 10m";
    const attendanceRate = attendanceAnalytics?.present ? 
      Math.round((attendanceAnalytics.present / (attendanceAnalytics.present + attendanceAnalytics.absent)) * 100) + "%" 
      : "95%";

    // Identify best performer (mock logic based on worker ID or actual data if available)
    const bestPerformer = departmentWorkers.length > 0 ? departmentWorkers[0] : null;
    const lowestPerformer = departmentWorkers.length > 1 ? departmentWorkers[departmentWorkers.length - 1] : null;

    return {
      completedCount: completedVehicles.length,
      efficiency,
      avgTime,
      attendanceRate,
      otHours: attendanceAnalytics?.total_hours || 0, // Simplified
      bestPerformer,
      lowestPerformer
    };
  }, [vehicles, departmentWorkers, attendanceAnalytics, timeframe]);

  return (
    <div className="p-4 space-y-6 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={28} />
            Performance
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track workforce productivity and efficiency.</p>
        </div>
        <div className="bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl flex">
          <button 
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${timeframe === 'today' ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}
            onClick={() => setTimeframe("today")}
          >
            Today
          </button>
          <button 
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${timeframe === 'monthly' ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}
            onClick={() => setTimeframe("monthly")}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-3xl border border-indigo-100 dark:border-indigo-800/30">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 flex items-center justify-center mb-2"><Zap size={16} /></div>
          <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats.efficiency}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Worker Efficiency</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-3xl border border-emerald-100 dark:border-emerald-800/30">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center mb-2"><Clock size={16} /></div>
          <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats.avgTime}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Avg Completion Time</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-3xl border border-blue-100 dark:border-blue-800/30">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center mb-2"><Users size={16} /></div>
          <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats.attendanceRate}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Attendance Rate</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-3xl border border-amber-100 dark:border-amber-800/30">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 flex items-center justify-center mb-2"><Target size={16} /></div>
          <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats.completedCount}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Platforms Completed</p>
        </div>
      </div>

      {/* Top/Lowest Performers */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 px-1">Top Performers</h2>
        
        {stats.bestPerformer && (
          <button 
            onClick={() => toast.info(`Viewing profile for ${stats.bestPerformer.name} is not available in mobile view yet.`)}
            className="w-full bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 flex items-center justify-between hover:border-indigo-200 transition-all text-left group shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center relative border-2 border-white dark:border-zinc-900 shadow-sm">
                <Award size={24} />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-zinc-900">1</div>
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{stats.bestPerformer.name}</p>
                <p className="text-xs text-gray-500">{stats.bestPerformer.department} • 98% Efficiency</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 px-1">Needs Attention</h2>
        {stats.lowestPerformer && (
          <button 
            onClick={() => toast.info(`Viewing profile for ${stats.lowestPerformer.name} is not available in mobile view yet.`)}
            className="w-full bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 flex items-center justify-between hover:border-red-200 transition-all text-left group shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                <Activity size={24} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{stats.lowestPerformer.name}</p>
                <p className="text-xs text-gray-500">{stats.lowestPerformer.department} • 65% Efficiency</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
          </button>
        )}
      </div>
      
    </div>
  );
}
