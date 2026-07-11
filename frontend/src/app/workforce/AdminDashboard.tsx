"use client";

import React, { useState } from "react";
import { 
  Building2, TrendingUp, Users, Wallet, Target, Link as LinkIcon, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function AdminDashboard({ worker, onLogout }: { worker: any, onLogout: () => void }) {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <div className="bg-card px-4 py-4 sticky top-0 z-10 border-b border-border shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{worker.name}</h1>
          <p className="text-xs text-primary font-bold tracking-wider uppercase">Enterprise Admin</p>
        </div>
        <button onClick={onLogout} className="p-2 bg-muted rounded-full text-muted-foreground">
          <LogOut size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
         <div className="bg-primary text-primary-foreground rounded-3xl p-6 shadow-md">
            <h2 className="text-2xl font-black mb-1">Company Overview</h2>
            <p className="text-sm font-medium opacity-80 mb-4">All systems operating normally.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold opacity-80 uppercase">Total Workforce</p>
                <p className="text-3xl font-black">248</p>
              </div>
              <div>
                <p className="text-xs font-semibold opacity-80 uppercase">Active Today</p>
                <p className="text-3xl font-black">210</p>
              </div>
            </div>
         </div>
         
         <div className="grid grid-cols-2 gap-4">
           <div className="bg-card rounded-3xl p-5 border border-border shadow-sm flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
               <Target size={24} />
             </div>
             <p className="font-bold">Production</p>
             <p className="text-xs text-muted-foreground">94% Efficiency</p>
           </div>
           
           <div className="bg-card rounded-3xl p-5 border border-border shadow-sm flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center mb-3">
               <Wallet size={24} />
             </div>
             <p className="font-bold">Payroll</p>
             <p className="text-xs text-muted-foreground">Synced Today</p>
           </div>
         </div>
         
         <div className="bg-card rounded-3xl p-5 border border-border shadow-sm">
           <h3 className="font-bold text-lg mb-4">Quick Links</h3>
           <div className="space-y-3">
             <Button variant="outline" className="w-full justify-start h-12 rounded-xl" onClick={() => router.push('/dashboard')}>
               <Building2 className="mr-3 h-5 w-5 text-muted-foreground" /> Full ERP Desktop Dashboard
             </Button>
             <Button variant="outline" className="w-full justify-start h-12 rounded-xl" onClick={() => router.push('/payroll')}>
               <Wallet className="mr-3 h-5 w-5 text-muted-foreground" /> Master Payroll Settings
             </Button>
             <Button variant="outline" className="w-full justify-start h-12 rounded-xl" onClick={() => router.push('/reports')}>
               <TrendingUp className="mr-3 h-5 w-5 text-muted-foreground" /> Analytics & Reports
             </Button>
           </div>
         </div>
      </div>
    </div>
  );
}
