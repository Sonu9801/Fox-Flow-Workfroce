"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, Banknote, Clock, CalendarDays, 
  IndianRupee, HandCoins, CheckCircle2, Factory, TrendingUp, AlertCircle
} from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";

import { api } from "@/lib/api";

export default function PayrollDashboardTab() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api.get("/payroll/summary")
      .then((res) => setSummary(res.data))
      .catch((err) => console.error(err));
  }, []);

  if (!summary || summary.detail) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-4 gap-4"><div className="h-32 bg-card rounded-2xl" /><div className="h-32 bg-card rounded-2xl" /><div className="h-32 bg-card rounded-2xl" /><div className="h-32 bg-card rounded-2xl" /></div>
        <div className="grid grid-cols-2 gap-4"><div className="h-64 bg-card rounded-2xl" /><div className="h-64 bg-card rounded-2xl" /></div>
      </div>
    );
  }

  const kpis = [
    { title: "Total Employees", value: summary.totalEmployees, icon: <Users className="text-blue-500" size={24} />, bg: "bg-blue-500/10" },
    { title: "Monthly Payroll Cost", value: `₹${(summary.monthlyPayrollCost || 0).toLocaleString()}`, icon: <IndianRupee className="text-emerald-500" size={24} />, bg: "bg-emerald-500/10" },
    { title: "OT Cost", value: `₹${(summary.otCost || 0).toLocaleString()}`, icon: <Clock className="text-orange-500" size={24} />, bg: "bg-orange-500/10" },
    { title: "Sunday Cost", value: `₹${(summary.sundayCost || 0).toLocaleString()}`, icon: <CalendarDays className="text-purple-500" size={24} />, bg: "bg-purple-500/10" },
    { title: "Pending Payroll", value: `₹${(summary.pendingPayroll || 0).toLocaleString()}`, icon: <AlertCircle className="text-yellow-500" size={24} />, bg: "bg-yellow-500/10" },
    { title: "Approved Payroll", value: `₹${(summary.approvedPayroll || 0).toLocaleString()}`, icon: <CheckCircle2 className="text-blue-500" size={24} />, bg: "bg-blue-500/10" },
    { title: "Paid Payroll", value: `₹${(summary.paidPayroll || 0).toLocaleString()}`, icon: <HandCoins className="text-green-500" size={24} />, bg: "bg-green-500/10" }
  ];

  const depts = Object.entries(summary.departmentCosts || {});

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. TOP KPI CARDS */}
      <h2 className="text-lg font-bold">Top KPIs</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4"
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${kpi.bg}`}>
              {kpi.icon}
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{kpi.title}</p>
              <h3 className="text-xl font-black font-display tracking-tight text-foreground mt-0.5">
                {kpi.value}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. PAYROLL SUMMARY & STATUS */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2"><Banknote size={18} className="text-primary"/> Payroll Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center"><span className="text-muted-foreground text-sm font-medium">Total Base Salary</span><span className="font-bold">₹{(summary.baseSalaryCost || 0).toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground text-sm font-medium">Total OT Pay</span><span className="font-bold">₹{(summary.otCost || 0).toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground text-sm font-medium">Total Sunday Pay</span><span className="font-bold">₹{(summary.sundayCost || 0).toLocaleString()}</span></div>
              <div className="pt-4 border-t border-border flex justify-between items-center"><span className="text-foreground font-bold">Total Labour Cost</span><span className="font-black text-xl text-primary">₹{(summary.monthlyPayrollCost || 0).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500"/> Payroll Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <span className="font-semibold text-yellow-600">Draft Status</span>
                <Badge variant="outline" className="bg-white border-yellow-200">100% (₹{(summary.monthlyPayrollCost || 0).toLocaleString()})</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 opacity-50">
                <span className="font-semibold text-blue-600">Approved</span>
                <Badge variant="outline" className="bg-white border-blue-200">0%</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 opacity-50">
                <span className="font-semibold text-emerald-600">Paid</span>
                <Badge variant="outline" className="bg-white border-emerald-200">0%</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* 3. DEPARTMENT COST & OWNER INSIGHTS */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Dept Cost Summary */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2"><Factory size={18} className="text-orange-500"/> Department Cost Summary</h3>
              <div className="space-y-4">
                {depts.length === 0 ? <p className="text-sm text-muted-foreground">No departmental data available.</p> : null}
                {depts.map(([dept, cost]: any, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1 font-medium">
                      <span>{dept}</span>
                      <span className="font-bold">₹{cost.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min((cost / summary.monthlyPayrollCost) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Owner Insights */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-purple-500"/> Owner Insights</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Highest Paid Employees</h4>
                  {summary.highestPaid?.slice(0, 2).map((emp: any) => (
                    <div key={`hp-${emp.id}`} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                      <span className="font-medium">{emp.name}</span>
                      <span className="font-bold text-emerald-600">₹{emp.total_salary.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Highest OT Workers</h4>
                  {summary.highestOT?.slice(0, 2).map((emp: any) => (
                    <div key={`hot-${emp.id}`} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                      <span className="font-medium">{emp.name}</span>
                      <span className="font-bold text-orange-500">{emp.ot_hours} hrs</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
          
          {/* 4. RECENT PAYROLL ACTIVITY */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2"><Clock size={18} className="text-blue-500"/> Recent Payroll Activity</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-2 rounded bg-primary"></div>
                <div>
                  <p className="font-bold text-sm">System auto-calculated draft payroll</p>
                  <p className="text-xs text-muted-foreground">Today at 08:00 AM</p>
                </div>
              </div>
              <div className="flex gap-4 opacity-50">
                <div className="w-2 rounded bg-muted"></div>
                <div>
                  <p className="font-bold text-sm">Waiting for Supervisor Approval</p>
                  <p className="text-xs text-muted-foreground">Pending Action</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
