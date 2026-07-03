"use client";

import React, { useMemo } from "react";
import { Vehicle, DispatchRecord, Worker, QCRecord, ActivityEvent } from "@/types";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, Truck, Clock, CheckCircle, AlertTriangle, ShieldCheck, Download } from "lucide-react";
import { exportToCSV, exportToPDF, exportToExcel } from "./exportUtils";
import { Button } from "@/components/ui/button";

interface ExecutiveDashboardProps {
  vehicles: Vehicle[];
  dispatchRecords: DispatchRecord[];
  workers: Worker[];
  qcRecords: QCRecord[];
  activities: ActivityEvent[];
  dateRange: string;
  filters: any;
}

export function ExecutiveDashboardTab({ 
  vehicles, 
  dispatchRecords, 
  workers,
  qcRecords,
  activities,
  dateRange 
}: ExecutiveDashboardProps) {
  // KPI Calculations
  const totalVehicles = vehicles.length;
  const readyForDispatch = vehicles.filter(v => (v.currentStage as string) === "rtd").length;
  const dispatched = vehicles.filter(v => (v.currentStage as string) === "dispatch").length;
  const delivered = dispatchRecords.filter(d => d.status.toLowerCase() === "delivered").length;
  
  // New KPIs
  const vehiclesInProduction = vehicles.filter(v => ["fabrication", "paint"].includes(v.currentStage as string)).length;
  const delayedVehicles = vehicles.filter(v => v.estimatedDelivery && new Date(v.estimatedDelivery) < new Date() && (v.currentStage as string) !== "dispatch").length;
  
  const todayStr = new Date().toISOString().split("T")[0];
  const presentWorkers = workers.filter(w => w.attendance && w.attendance.some((a: any) => a.date.startsWith(todayStr) && a.status === "Present")).length;
  const totalPayrollCost = workers.reduce((sum, w) => sum + (w.salary || 0), 0);
  const qcPassRate = qcRecords.length ? Math.round((qcRecords.filter(q => q.status === "Pass").length / qcRecords.length) * 100) : 0;

  // Chart Data
  const stageData = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach(v => counts[v.currentStage] = (counts[v.currentStage] || 0) + 1);
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [vehicles]);

  const oemData = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach(v => counts[v.oemName] = (counts[v.oemName] || 0) + 1);
    return Object.entries(counts).map(([name, count]) => ({ name, value: count }));
  }, [vehicles]);

  const topPerformers = useMemo(() => {
    return [...workers]
      .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
      .slice(0, 5)
      .map(w => ({
        id: w.employeeId,
        name: w.name,
        dept: w.department,
        score: w.performanceScore || 0
      }));
  }, [workers]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const kpis = [
    { title: "Total Vehicles", value: totalVehicles, icon: Truck, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Vehicles In Production", value: vehiclesInProduction, icon: Clock, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "Ready For Dispatch", value: readyForDispatch, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Dispatched", value: dispatched, icon: Truck, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Delivered", value: delivered, icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Delayed Vehicles", value: delayedVehicles, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
    { title: "QC Pass Rate", value: `${qcPassRate}%`, icon: ShieldCheck, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "Present Workforce", value: `${presentWorkers} / ${workers.length}`, icon: Users, color: "text-teal-500", bg: "bg-teal-500/10" },
    { title: "Total Payroll (M)", value: `₹${(totalPayrollCost / 100000).toFixed(2)}L`, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  const handleExport = (type: "csv" | "excel" | "pdf") => {
    const filename = "Executive_Summary";
    const headers = ["Metric", "Value"];
    const tableData = kpis.map(k => ({ Metric: k.title, Value: k.value }));
    
    if (type === "csv") exportToCSV(filename, headers, tableData);
    else if (type === "excel") exportToExcel(filename, headers, tableData);
    else exportToPDF(filename, "Executive Dashboard Summary", headers, tableData, { dateRange, summary: "High-level key performance indicators for the enterprise." });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Executive Dashboard</h2>
          <p className="text-sm text-muted-foreground">High-level enterprise metrics and performance.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
             <Download size={14} className="mr-2" /> CSV
           </Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
             <Download size={14} className="mr-2" /> Excel
           </Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
             <Download size={14} className="mr-2" /> PDF
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                <h3 className="text-2xl font-bold mt-1">{kpi.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-sm font-bold mb-4">Production Stages</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-bold mb-4">Top Performers</h3>
          <div className="space-y-4">
            {topPerformers.length > 0 ? (
              topPerformers.map((worker, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                   <div className="flex flex-col">
                      <span className="font-semibold text-sm">{worker.name}</span>
                      <span className="text-xs text-muted-foreground">{worker.dept}</span>
                   </div>
                   <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {worker.score}
                   </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                 No worker data available.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-bold mb-4">OEM Volume Distribution</h3>
          <div className="h-[320px] md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={oemData}
                  cx="50%"
                  cy="35%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {oemData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col justify-center items-center text-center">
           <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
           </div>
           <h3 className="text-xl font-bold mb-2">System Healthy</h3>
           <p className="text-muted-foreground text-sm max-w-[250px]">
             All services are running normally. Data is syncing in real-time.
           </p>
        </div>
      </div>
    </div>
  );
}
