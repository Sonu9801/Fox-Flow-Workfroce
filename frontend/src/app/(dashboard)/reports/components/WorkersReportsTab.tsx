"use client";

import React, { useMemo } from "react";
import { Worker } from "@/types";
import { exportToCSV, exportToPDF, exportToExcel } from "./exportUtils";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export function WorkersReportsTab({ 
  workers,
  dateRange,
  filters
}: { 
  workers: Worker[];
  dateRange: string;
  filters: any;
}) {
  const totalWorkers = workers.length;
  const activeWorkers = workers.filter(w => w.status === "active").length;
  const inactiveWorkers = workers.filter(w => w.status !== "active").length;
  
  // Assuming joining date is tracked, mock here if not natively available
  const joinedThisMonth = workers.filter(w => {
    // If worker has createdAt, use it. For now, mock a logic or just show 0 if undefined
    return false;
  }).length;

  const statusData = [
    { name: "Active", value: activeWorkers },
    { name: "Inactive", value: inactiveWorkers }
  ];

  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    workers.forEach(w => counts[w.department || "Unassigned"] = (counts[w.department || "Unassigned"] || 0) + 1);
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [workers]);
  
  const supData = useMemo(() => {
    const counts: Record<string, number> = {};
    workers.forEach(w => {
      const sup = "None"; // Worker doesn't have supervisorId
      counts[sup] = (counts[sup] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [workers]);

  const tableData = useMemo(() => {
    return workers.map(w => ({
      ID: w.employeeId,
      Name: w.name,
      Department: w.department,
      Status: w.status,
      Phone: w.mobileNumber || "N/A",
      SupervisorID: "N/A", // Worker type doesn't have supervisorId
      Role: w.role
    }));
  }, [workers]);

  const headers = ["ID", "Name", "Department", "Role", "Status", "Phone", "SupervisorID"];
  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8884d8'];

  const handleExport = (type: "csv" | "excel" | "pdf") => {
    const filename = "Workers_Report";
    if (type === "csv") exportToCSV(filename, headers, tableData);
    else if (type === "excel") exportToExcel(filename, headers, tableData);
    else exportToPDF(filename, "Workers & HR Report", headers, tableData, { dateRange, summary: "Detailed workforce distribution and status reporting." });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Workers & HR Reports</h2>
          <p className="text-sm text-muted-foreground">Workforce distribution, status, and performance tracking.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>Export CSV</Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>Export Excel</Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Total Workers</span>
          <span className="text-2xl font-black">{totalWorkers}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Active Workers</span>
          <span className="text-2xl font-black text-green-500">{activeWorkers}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Inactive Workers</span>
          <span className="text-2xl font-black text-red-500">{inactiveWorkers}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Joined This Month</span>
          <span className="text-2xl font-black text-blue-500">{joinedThisMonth}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border rounded-xl p-5 shadow-sm col-span-1 lg:col-span-1">
          <h3 className="text-sm font-bold mb-4">Worker Status</h3>
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
        
        <div className="bg-card border rounded-xl p-5 shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-sm font-bold mb-4">Department Wise Workers</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
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
           Workforce Roster
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                {headers.map(h => <th key={h} className="px-4 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tableData.slice(0, 50).map((row, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-muted-foreground">{row.ID}</td>
                  <td className="px-4 py-3 font-semibold">{row.Name}</td>
                  <td className="px-4 py-3">{row.Department}</td>
                  <td className="px-4 py-3 capitalize">{row.Role}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.Status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {row.Status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.Phone}</td>
                  <td className="px-4 py-3">{row.SupervisorID}</td>
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
