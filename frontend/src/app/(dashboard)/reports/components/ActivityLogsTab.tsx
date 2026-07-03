"use client";

import React, { useMemo } from "react";
import { ActivityEvent } from "@/types";
import { exportToCSV, exportToPDF, exportToExcel } from "./exportUtils";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export function ActivityLogsTab({ 
  activities,
  dateRange,
  filters
}: { 
  activities: ActivityEvent[];
  dateRange: string;
  filters: any;
}) {
  const tableData = useMemo(() => {
    return activities.map(a => ({
      Timestamp: new Date(a.timestamp).toLocaleString(),
      Category: a.eventType,
      Description: a.description,
      User: a.workerId || "System"
    }));
  }, [activities]);

  const headers = ["Timestamp", "Category", "Description", "User"];

  const activityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activities.forEach(a => counts[a.eventType] = (counts[a.eventType] || 0) + 1);
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [activities]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8884d8', '#ec4899', '#14b8a6'];

  const handleExport = (type: "csv" | "excel" | "pdf") => {
    const filename = "Activity_Logs";
    if (type === "csv") exportToCSV(filename, headers, tableData);
    else if (type === "excel") exportToExcel(filename, headers, tableData);
    else exportToPDF(filename, "System Activity Logs", headers, tableData, { dateRange, summary: "Comprehensive log of all system activities." });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Activity Logs</h2>
          <p className="text-sm text-muted-foreground">System-wide audit trail and activity tracking.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>Export CSV</Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>Export Excel</Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Total Activities</span>
          <span className="text-2xl font-black">{activities.length}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Top Activity Category</span>
          <span className="text-2xl font-black text-blue-500 truncate">{activityCounts[0]?.name || "None"}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Today's Activities</span>
          <span className="text-2xl font-black text-green-500">
             {activities.filter(a => new Date(a.timestamp).toISOString().split("T")[0] === new Date().toISOString().split("T")[0]).length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4">Activities By Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityCounts.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4">Category Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activityCounts.slice(0, 7)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {activityCounts.slice(0, 7).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm mt-6">
        <div className="p-4 border-b border-border bg-muted/20 font-semibold text-sm">
           System Audit Log
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
                  <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">{row.Timestamp}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase">
                      {row.Category}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.Description}</td>
                  <td className="px-4 py-3 font-mono">{row.User}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {tableData.length > 50 && (
            <div className="p-3 text-center text-xs text-muted-foreground border-t border-border">
               Showing 50 of {tableData.length} rows. Export for full data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
