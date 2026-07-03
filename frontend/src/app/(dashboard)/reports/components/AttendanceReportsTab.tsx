"use client";

import React, { useMemo } from "react";
import { Worker } from "@/types";
import { exportToCSV, exportToPDF, exportToExcel } from "./exportUtils";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export function AttendanceReportsTab({ 
  workers,
  dateRange,
  filters
}: { 
  workers: Worker[];
  dateRange: string;
  filters: any;
}) {
  const todayStr = new Date().toISOString().split("T")[0];

  const presentCount = workers.filter(w => w.attendance && w.attendance.some((a: any) => a.date.startsWith(todayStr) && a.status === "Present")).length;
  const lateCount = workers.filter(w => w.attendance && w.attendance.some((a: any) => a.date.startsWith(todayStr) && (a.status === "Late" || (a.checkIn && new Date(a.checkIn).getHours() >= 9)))).length;
  const halfDayCount = workers.filter(w => w.attendance && w.attendance.some((a: any) => a.date.startsWith(todayStr) && a.status === "Half Day")).length;
  const absentCount = workers.length - presentCount - lateCount - halfDayCount;

  const otCount = workers.filter(w => w.attendance && w.attendance.some((a: any) => a.date.startsWith(todayStr) && a.overtimeHours && a.overtimeHours > 0)).length;

  const attendanceStatusData = [
    { name: "Present", value: presentCount },
    { name: "Late", value: lateCount },
    { name: "Half Day", value: halfDayCount },
    { name: "Absent", value: absentCount },
  ].filter(d => d.value > 0);

  const deptAttendanceData = useMemo(() => {
    const depts: Record<string, { total: number, present: number }> = {};
    workers.forEach(w => {
      const dept = w.department || "Unassigned";
      if (!depts[dept]) depts[dept] = { total: 0, present: 0 };
      depts[dept].total += 1;
      const isPresent = w.attendance && w.attendance.some((a: any) => a.date.startsWith(todayStr) && ["Present", "Late", "Half Day"].includes(a.status));
      if (isPresent) depts[dept].present += 1;
    });
    return Object.entries(depts).map(([name, data]) => ({
      name,
      AttendanceRate: Math.round((data.present / data.total) * 100) || 0
    }));
  }, [workers, todayStr]);

  const tableData = useMemo(() => {
    return workers.map(w => {
      const todaysRecord = w.attendance?.find((a: any) => a.date.startsWith(todayStr));
      return {
        ID: w.employeeId,
        Name: w.name,
        Department: w.department,
        Status: todaysRecord?.status || "Absent",
        CheckIn: todaysRecord?.checkIn ? new Date(todaysRecord.checkIn).toLocaleTimeString() : "-",
        CheckOut: todaysRecord?.checkOut ? new Date(todaysRecord.checkOut).toLocaleTimeString() : "-",
        OTHours: todaysRecord?.overtimeHours || 0
      };
    });
  }, [workers, todayStr]);

  const headers = ["ID", "Name", "Department", "Status", "CheckIn", "CheckOut", "OTHours"];
  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

  const handleExport = (type: "csv" | "excel" | "pdf") => {
    const filename = "Attendance_Report";
    if (type === "csv") exportToCSV(filename, headers, tableData);
    else if (type === "excel") exportToExcel(filename, headers, tableData);
    else exportToPDF(filename, "Daily Attendance Report", headers, tableData, { dateRange, summary: "Detailed daily attendance, absence, and late reporting." });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Attendance Reports</h2>
          <p className="text-sm text-muted-foreground">Daily/Monthly attendance, overtime, and department tracking.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>Export CSV</Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>Export Excel</Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Present</span>
          <span className="text-2xl font-black text-green-500">{presentCount}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Absent</span>
          <span className="text-2xl font-black text-red-500">{absentCount}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Late</span>
          <span className="text-2xl font-black text-orange-500">{lateCount}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Half Day</span>
          <span className="text-2xl font-black text-blue-500">{halfDayCount}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">OT Records</span>
          <span className="text-2xl font-black text-purple-500">{otCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4">Today's Attendance Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {attendanceStatusData.map((entry, index) => (
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
          <h3 className="text-sm font-bold mb-4">Department Attendance Rate (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="AttendanceRate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm mt-6">
        <div className="p-4 border-b border-border bg-muted/20 font-semibold text-sm">
           Employee Attendance History
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
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.Status === "Present" ? "bg-success/10 text-success" : row.Status === "Absent" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                      {row.Status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.CheckIn}</td>
                  <td className="px-4 py-3">{row.CheckOut}</td>
                  <td className="px-4 py-3 font-bold">{row.OTHours > 0 ? `${row.OTHours}h` : '-'}</td>
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
