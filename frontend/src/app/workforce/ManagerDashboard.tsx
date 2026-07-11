"use client";

import React, { useState } from "react";
import { 
  Building2, TrendingUp, Users, AlertCircle, FileText, CheckCircle2,
  PieChart, Activity, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function ManagerDashboard({ worker, onLogout }: { worker: any, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"department" | "analytics" | "approvals">("department");

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <div className="bg-card px-4 py-4 sticky top-0 z-10 border-b border-border shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{worker.name}</h1>
          <p className="text-xs text-primary font-bold tracking-wider uppercase">Manager • {worker.department || "Production"}</p>
        </div>
        <button onClick={onLogout} className="p-2 bg-muted rounded-full text-muted-foreground">
          <LogOut size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === "department" && (
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="bg-card rounded-3xl p-5 border border-border shadow-sm">
                 <p className="text-xs font-semibold text-muted-foreground uppercase">Attendance</p>
                 <p className="text-3xl font-black text-primary mt-1">92%</p>
               </div>
               <div className="bg-card rounded-3xl p-5 border border-border shadow-sm">
                 <p className="text-xs font-semibold text-muted-foreground uppercase">Efficiency</p>
                 <p className="text-3xl font-black text-green-600 mt-1">88%</p>
               </div>
             </div>

             <div className="bg-card rounded-3xl p-5 border border-border shadow-sm">
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Activity size={20}/> Active Supervisors</h3>
               <div className="space-y-3">
                 <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                   <div>
                     <p className="font-bold">Shift A Team</p>
                     <p className="text-xs text-muted-foreground">42 Present • 3 Absent</p>
                   </div>
                   <div className="text-right">
                     <p className="font-bold text-green-600">On Track</p>
                   </div>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                   <div>
                     <p className="font-bold">Shift B Team</p>
                     <p className="text-xs text-muted-foreground">38 Present • 5 Absent</p>
                   </div>
                   <div className="text-right">
                     <p className="font-bold text-orange-600">Delayed</p>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-4">
            <div className="bg-card rounded-3xl p-5 border border-border shadow-sm flex flex-col items-center justify-center min-h-[40vh]">
               <PieChart size={48} className="text-muted-foreground mb-4 opacity-50" />
               <p className="font-bold text-lg">Department Analytics</p>
               <p className="text-sm text-muted-foreground text-center mt-2">Comprehensive reports and trends will be populated here.</p>
            </div>
          </div>
        )}

        {activeTab === "approvals" && (
          <div className="space-y-4">
             <div className="bg-card rounded-3xl p-5 border border-border shadow-sm flex flex-col items-center justify-center min-h-[40vh]">
               <CheckCircle2 size={48} className="text-green-500 mb-4 opacity-50" />
               <p className="font-bold text-lg">All Caught Up</p>
               <p className="text-sm text-muted-foreground text-center mt-2">No escalated approvals pending for {worker.department || "your department"}.</p>
            </div>
          </div>
        )}
      </div>

      <div className="h-24" />
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 pt-2 pb-safe flex justify-around items-center z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab("department")} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors w-1/3 ${activeTab === "department" ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}>
          <Building2 size={22} className="mb-1" />
          <span className="text-[10px] font-bold">Department</span>
        </button>
        <button onClick={() => setActiveTab("approvals")} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors w-1/3 ${activeTab === "approvals" ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}>
          <AlertCircle size={22} className="mb-1" />
          <span className="text-[10px] font-bold">Escalations</span>
        </button>
        <button onClick={() => setActiveTab("analytics")} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors w-1/3 ${activeTab === "analytics" ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}>
          <TrendingUp size={22} className="mb-1" />
          <span className="text-[10px] font-bold">Analytics</span>
        </button>
      </div>
    </div>
  );
}
