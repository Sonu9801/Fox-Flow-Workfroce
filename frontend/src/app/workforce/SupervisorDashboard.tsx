"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Users, UserCheck, UserX, Clock, Calendar, ShieldCheck, 
  Car, Activity, AlertCircle, LogOut, CheckCircle2, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { attendanceApi } from "@/lib/api";
import { WorkerJobs } from "./WorkerJobs";

export function SupervisorDashboard({ worker, onLogout }: { worker: any, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"team" | "production" | "approvals">("team");
  const [summary, setSummary] = useState<any>(null);
  const [pending, setPending] = useState<any>(null);

  useEffect(() => {
    if (!worker) return;
    const loadData = async () => {
      try {
        const sum = await attendanceApi.getTeamSummary(worker.id || worker.worker_id);
        setSummary(sum);
        const pend = await attendanceApi.getPendingRequests(worker.id || worker.worker_id);
        setPending(pend);
      } catch (e) {
        console.error("Failed to load supervisor data", e);
      }
    };
    loadData();
    const interval = setInterval(loadData, 30000); // Polling as fallback
    return () => clearInterval(interval);
  }, [worker]);

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <div className="bg-card px-4 py-4 sticky top-0 z-10 border-b border-border shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{worker.name}</h1>
          <p className="text-xs text-primary font-bold tracking-wider uppercase">Supervisor Dashboard</p>
        </div>
        <button onClick={onLogout} className="p-2 bg-muted rounded-full text-muted-foreground">
          <LogOut size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === "team" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary text-primary-foreground rounded-3xl p-5 shadow-md">
                <div className="flex items-center gap-2 mb-2 opacity-80"><UserCheck size={18}/> <p className="text-sm font-semibold">Present</p></div>
                <p className="text-4xl font-black">{summary?.present || 0}</p>
              </div>
              <div className="bg-destructive text-destructive-foreground rounded-3xl p-5 shadow-md">
                <div className="flex items-center gap-2 mb-2 opacity-80"><UserX size={18}/> <p className="text-sm font-semibold">Absent</p></div>
                <p className="text-4xl font-black">{summary?.absent || 0}</p>
              </div>
            </div>

            <div className="bg-card rounded-3xl p-5 border border-border shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><Clock size={20}/> Live Status</h3>
                <Badge variant="outline">Today</Badge>
              </div>
              <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl mb-2">
                <div className="p-2 bg-orange-500/10 text-orange-600 rounded-lg"><AlertCircle size={20}/></div>
                <div>
                  <p className="font-bold text-sm">Late Employees</p>
                  <p className="text-xs text-muted-foreground">{summary?.late || 0} employees late today</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-muted-foreground mb-2 uppercase">Online Now</p>
                <div className="flex flex-wrap gap-2">
                  {summary?.online_workers?.length ? summary.online_workers.map((w: string, i: number) => (
                    <Badge key={i} variant="secondary" className="bg-green-500/10 text-green-700">{w}</Badge>
                  )) : <p className="text-xs text-muted-foreground">No workers online.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "approvals" && (
          <div className="space-y-4">
             <div className="bg-card rounded-3xl p-5 border border-border shadow-sm">
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ShieldCheck size={20}/> Action Required</h3>
               
               <div className="space-y-3">
                 <div className="p-4 border border-border rounded-2xl flex justify-between items-center">
                   <div>
                     <p className="font-bold">Leave Requests</p>
                     <p className="text-xs text-muted-foreground">{pending?.pending_leaves || 0} pending</p>
                   </div>
                   <Button size="sm" variant={pending?.pending_leaves > 0 ? "default" : "outline"}>Review</Button>
                 </div>
                 
                 <div className="p-4 border border-border rounded-2xl flex justify-between items-center">
                   <div>
                     <p className="font-bold">Missing Punches</p>
                     <p className="text-xs text-muted-foreground">{pending?.pending_corrections || 0} pending</p>
                   </div>
                   <Button size="sm" variant={pending?.pending_corrections > 0 ? "default" : "outline"}>Review</Button>
                 </div>
               </div>
             </div>
          </div>
        )}

        {activeTab === "production" && (
          <div className="space-y-4">
            <div className="bg-card rounded-3xl p-5 border border-border shadow-sm flex flex-col items-center justify-center min-h-[30vh]">
               <Activity size={48} className="text-muted-foreground mb-4 opacity-50" />
               <p className="font-bold text-lg">Production Overview</p>
               <p className="text-sm text-muted-foreground text-center mt-2">Integration with Production module pending for specific Supervisor views.</p>
            </div>
          </div>
        )}
      </div>

      <div className="h-24" />
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 pt-2 pb-safe flex justify-around items-center z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab("team")} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors w-1/3 ${activeTab === "team" ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}>
          <Users size={22} className="mb-1" />
          <span className="text-[10px] font-bold">My Team</span>
        </button>
        <button onClick={() => setActiveTab("approvals")} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors w-1/3 ${activeTab === "approvals" ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}>
          <ShieldCheck size={22} className="mb-1" />
          <span className="text-[10px] font-bold">Approvals</span>
        </button>
        <button onClick={() => setActiveTab("production")} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors w-1/3 ${activeTab === "production" ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}>
          <Activity size={22} className="mb-1" />
          <span className="text-[10px] font-bold">Production</span>
        </button>
      </div>
    </div>
  );
}
