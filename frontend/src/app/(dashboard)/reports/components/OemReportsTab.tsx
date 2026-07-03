"use client";

import React, { useMemo } from "react";
import { Vehicle, DispatchRecord } from "@/types";
import { exportToCSV, exportToPDF, exportToExcel } from "./exportUtils";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export function OemReportsTab({ 
  vehicles,
  dispatchRecords,
  dateRange,
  filters
}: { 
  vehicles: Vehicle[];
  dispatchRecords: DispatchRecord[];
  dateRange: string;
  filters: any;
}) {
  const tableData = useMemo(() => {
    return vehicles.map(v => {
      const dispatch = dispatchRecords.find(d => d.vehicleId.toString() === v.id);
      return {
        OEM: v.oemName,
        TrackingID: v.trackingId,
        VehicleNumber: v.vehicleNumber,
        ProductionStatus: v.currentStage,
        DispatchStatus: dispatch ? dispatch.status : "Pending",
        ExpectedDelivery: new Date(v.estimatedDelivery).toLocaleDateString(),
        IsDelayed: new Date(v.estimatedDelivery) < new Date() && v.currentStage !== "dispatch" ? "Yes" : "No"
      };
    });
  }, [vehicles, dispatchRecords]);

  const headers = ["OEM", "TrackingID", "VehicleNumber", "ProductionStatus", "DispatchStatus", "ExpectedDelivery", "IsDelayed"];

  const oemWiseOrders = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach(v => counts[v.oemName] = (counts[v.oemName] || 0) + 1);
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [vehicles]);

  const deliveredCount = dispatchRecords.filter(d => d.status.toLowerCase() === "delivered").length;
  const delayedCount = tableData.filter(d => d.IsDelayed === "Yes").length;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8884d8'];

  const handleExport = (type: "csv" | "excel" | "pdf") => {
    const filename = "OEM_Report";
    if (type === "csv") exportToCSV(filename, headers, tableData);
    else if (type === "excel") exportToExcel(filename, headers, tableData);
    else exportToPDF(filename, "OEM Operations Report", headers, tableData, { dateRange, summary: "OEM production and dispatch progress overview." });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">OEM Reports</h2>
          <p className="text-sm text-muted-foreground">OEM-wise order volume and production status.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>Export CSV</Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>Export Excel</Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Total Orders</span>
          <span className="text-2xl font-black">{vehicles.length}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Active OEMs</span>
          <span className="text-2xl font-black text-blue-500">{oemWiseOrders.length}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Delivered Orders</span>
          <span className="text-2xl font-black text-green-500">{deliveredCount}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Delayed Orders</span>
          <span className="text-2xl font-black text-red-500">{delayedCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4">OEM Wise Orders</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={oemWiseOrders}>
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
          <h3 className="text-sm font-bold mb-4">OEM Distribution (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={oemWiseOrders}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {oemWiseOrders.map((entry, index) => (
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
           OEM Orders Log
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
                  <td className="px-4 py-3 font-bold">{row.OEM}</td>
                  <td className="px-4 py-3 font-mono">{row.TrackingID}</td>
                  <td className="px-4 py-3">{row.VehicleNumber}</td>
                  <td className="px-4 py-3 capitalize text-blue-600">{row.ProductionStatus}</td>
                  <td className="px-4 py-3 capitalize text-green-600">{row.DispatchStatus}</td>
                  <td className="px-4 py-3">{row.ExpectedDelivery}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.IsDelayed === "Yes" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                      {row.IsDelayed}
                    </span>
                  </td>
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
