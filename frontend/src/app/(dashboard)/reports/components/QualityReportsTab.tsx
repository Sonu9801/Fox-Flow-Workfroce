"use client";

import React, { useMemo } from "react";
import { QCRecord } from "@/types";
import { exportToCSV, exportToPDF, exportToExcel } from "./exportUtils";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export function QualityReportsTab({ 
  qcRecords,
  dateRange,
  filters
}: { 
  qcRecords: QCRecord[];
  dateRange: string;
  filters: any;
}) {
  const tableData = useMemo(() => {
    return qcRecords.map(qc => ({
      ID: qc.id,
      VehicleID: qc.vehicleId,
      Stage: qc.stage,
      Status: qc.status,
      Inspector: qc.inspectorId,
      Defects: qc.defects?.length || 0,
    }));
  }, [qcRecords]);

  const headers = ["ID", "VehicleID", "Stage", "Status", "Inspector", "Defects"];

  const passCount = qcRecords.filter(q => q.status === "Pass").length;
  const failCount = qcRecords.filter(q => q.status === "Fail").length;
  const pendingCount = qcRecords.filter(q => q.status === "Pending").length;
  const reworkCount = qcRecords.filter(q => q.status === "Rework").length;
  const totalDefects = qcRecords.reduce((acc, q) => acc + (q.defects?.length || 0), 0);

  const statusData = [
    { name: "Pass", value: passCount },
    { name: "Fail", value: failCount },
    { name: "Rework", value: reworkCount },
    { name: "Pending", value: pendingCount },
  ].filter(d => d.value > 0);

  const stageData = useMemo(() => {
    const counts: Record<string, number> = {};
    qcRecords.forEach(q => counts[q.stage] = (counts[q.stage] || 0) + 1);
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [qcRecords]);

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

  const handleExport = (type: "csv" | "excel" | "pdf") => {
    const filename = "Quality_Report";
    if (type === "csv") exportToCSV(filename, headers, tableData);
    else if (type === "excel") exportToExcel(filename, headers, tableData);
    else exportToPDF(filename, "Quality Control Report", headers, tableData, { dateRange, summary: "Detailed analysis of quality control pass/fail rates and defects." });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Quality Control Reports</h2>
          <p className="text-sm text-muted-foreground">Pass/Fail rates, defect analysis, and inspector performance.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>Export CSV</Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>Export Excel</Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">QC Pass</span>
          <span className="text-2xl font-black text-green-500">{passCount}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">QC Fail</span>
          <span className="text-2xl font-black text-red-500">{failCount}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Rework</span>
          <span className="text-2xl font-black text-orange-500">{reworkCount}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Total Defects Found</span>
          <span className="text-2xl font-black">{totalDefects}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4">Quality Status Distribution</h3>
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
          <h3 className="text-sm font-bold mb-4">QC Checks by Stage</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm mt-6">
        <div className="p-4 border-b border-border bg-muted/20 font-semibold text-sm">
           QC Inspection Log
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
                  <td className="px-4 py-3 font-mono text-muted-foreground">QC-{row.ID}</td>
                  <td className="px-4 py-3 font-semibold">{row.VehicleID}</td>
                  <td className="px-4 py-3">{row.Stage}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.Status === "Pass" ? "bg-success/10 text-success" : row.Status === "Fail" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                      {row.Status || "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.Inspector || "N/A"}</td>
                  <td className="px-4 py-3 font-bold text-destructive">{row.Defects}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
