"use client";

import React, { useMemo } from "react";
import { DispatchRecord } from "@/types";
import { exportToCSV, exportToPDF, exportToExcel } from "./exportUtils";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export function DispatchReportsTab({ 
  dispatchRecords,
  dateRange,
  filters
}: { 
  dispatchRecords: DispatchRecord[];
  dateRange: string;
  filters: any;
}) {
  const tableData = useMemo(() => {
    return dispatchRecords.map(d => ({
      Tracking: d.trackingNumber,
      Carrier: d.carrier,
      Destination: d.destination,
      Status: d.status,
      ScheduledDate: new Date(d.scheduledDate).toLocaleDateString(),
      DeliveredTime: d.deliveredTime ? new Date(d.deliveredTime).toLocaleDateString() : "Pending",
    }));
  }, [dispatchRecords]);

  const headers = ["Tracking", "Carrier", "Destination", "Status", "ScheduledDate", "DeliveredTime"];

  const todayStr = new Date().toISOString().split("T")[0];
  
  const dispatchedToday = dispatchRecords.filter(d => new Date(d.scheduledDate).toISOString().split("T")[0] === todayStr && d.status.toLowerCase() !== "pending").length;
  const deliveredCount = dispatchRecords.filter(d => d.status.toLowerCase() === "delivered").length;
  const pendingCount = dispatchRecords.filter(d => d.status.toLowerCase() !== "delivered" && d.status.toLowerCase() !== "cancelled").length;
  const delayedCount = dispatchRecords.filter(d => new Date(d.scheduledDate) < new Date() && d.status.toLowerCase() !== "delivered").length;

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    dispatchRecords.forEach(d => counts[d.status] = (counts[d.status] || 0) + 1);
    return Object.entries(counts).map(([name, count]) => ({ name, value: count }));
  }, [dispatchRecords]);

  const carrierData = useMemo(() => {
    const counts: Record<string, number> = {};
    dispatchRecords.forEach(d => counts[d.carrier] = (counts[d.carrier] || 0) + 1);
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [dispatchRecords]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8884d8'];

  const handleExport = (type: "csv" | "excel" | "pdf") => {
    const filename = "Dispatch_Report";
    if (type === "csv") exportToCSV(filename, headers, tableData);
    else if (type === "excel") exportToExcel(filename, headers, tableData);
    else exportToPDF(filename, "Dispatch & Logistics Report", headers, tableData, { dateRange, summary: "Delivery tracking and carrier performance analytics." });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Dispatch & Logistics Reports</h2>
          <p className="text-sm text-muted-foreground">Delivery tracking, carrier analytics, and dispatch success.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>Export CSV</Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>Export Excel</Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Dispatched Today</span>
          <span className="text-2xl font-black">{dispatchedToday}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Total Delivered</span>
          <span className="text-2xl font-black text-green-500">{deliveredCount}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Pending Dispatch</span>
          <span className="text-2xl font-black text-blue-500">{pendingCount}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Delayed Dispatch</span>
          <span className="text-2xl font-black text-red-500">{delayedCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4">Dispatch Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4">Carrier Usage</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carrierData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm mt-6">
        <div className="p-4 border-b border-border bg-muted/20 font-semibold text-sm">
           Dispatch Tracking Log
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                {headers.map(h => <th key={h} className="px-4 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tableData.map((row, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono font-semibold">{row.Tracking}</td>
                  <td className="px-4 py-3">{row.Carrier}</td>
                  <td className="px-4 py-3">{row.Destination}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.Status.toLowerCase() === "delivered" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>
                      {row.Status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.ScheduledDate}</td>
                  <td className="px-4 py-3">{row.DeliveredTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
