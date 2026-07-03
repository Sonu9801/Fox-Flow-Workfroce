"use client";

import React, { useMemo } from "react";
import { Vehicle } from "@/types";
import { exportToCSV, exportToPDF, exportToExcel } from "./exportUtils";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export function ProductionReportsTab({ 
  vehicles,
  dateRange,
  filters
}: { 
  vehicles: Vehicle[];
  dateRange: string;
  filters: any;
}) {
  const tableData = useMemo(() => {
    return vehicles.map(v => ({
      TrackingID: v.trackingId,
      VehicleNumber: v.vehicleNumber,
      OEM: v.oemName,
      Stage: v.currentStage,
      Progress: `${v.progressPercent}%`,
      ExpectedDelivery: new Date(v.estimatedDelivery).toLocaleDateString(),
    }));
  }, [vehicles]);

  const headers = ["TrackingID", "VehicleNumber", "OEM", "Stage", "Progress", "ExpectedDelivery"];

  const delayedVehicles = vehicles.filter(v => new Date(v.estimatedDelivery) < new Date() && v.currentStage !== "dispatch").length;
  const completedVehicles = vehicles.filter(v => v.currentStage === "dispatch" || v.currentStage === "rtd").length;

  const stageData = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach(v => counts[v.currentStage] = (counts[v.currentStage] || 0) + 1);
    return Object.entries(counts).map(([name, count]) => ({ name: name.toUpperCase(), count }));
  }, [vehicles]);

  const handleExport = (type: "csv" | "excel" | "pdf") => {
    const filename = "Production_Report";
    if (type === "csv") exportToCSV(filename, headers, tableData);
    else if (type === "excel") exportToExcel(filename, headers, tableData);
    else exportToPDF(filename, "Production Report", headers, tableData, { dateRange, summary: "Detailed report of vehicle production status." });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Production Reports</h2>
          <p className="text-sm text-muted-foreground">Detailed vehicle tracking, delays, and stage distribution.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>Export CSV</Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>Export Excel</Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Total Vehicles</span>
          <span className="text-2xl font-black">{vehicles.length}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Completed Vehicles</span>
          <span className="text-2xl font-black text-green-500">{completedVehicles}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Delayed Vehicles</span>
          <span className="text-2xl font-black text-red-500">{delayedVehicles}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4">Vehicles by Stage</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4">Stage Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {stageData.map((entry, index) => (
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
           Production Timeline & Details
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
                  <td className="px-4 py-3 font-mono">{row.TrackingID}</td>
                  <td className="px-4 py-3 font-semibold">{row.VehicleNumber}</td>
                  <td className="px-4 py-3">{row.OEM}</td>
                  <td className="px-4 py-3">
                     <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold">
                        {row.Stage}
                     </span>
                  </td>
                  <td className="px-4 py-3">{row.Progress}</td>
                  <td className="px-4 py-3">{row.ExpectedDelivery}</td>
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
