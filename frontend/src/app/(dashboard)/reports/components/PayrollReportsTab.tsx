"use client";

import React, { useMemo } from "react";
import { Worker } from "@/types";
import { exportToCSV, exportToPDF, exportToExcel } from "./exportUtils";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export function PayrollReportsTab({ 
  workers,
  dateRange,
  filters
}: { 
  workers: Worker[];
  dateRange: string;
  filters: any;
}) {
  const totalPayroll = workers.reduce((sum, w) => sum + (w.salary || 0), 0);
  const otPayments = workers.reduce((sum, w) => sum + ((w.salary ? w.salary / 30 / 8 : 0) * (w.attendance?.reduce((acc: number, a: any) => acc + (a.overtimeHours || 0), 0) || 0)), 0);
  
  const pendingSalary = totalPayroll * 0.2; // Mock calculation since we don't track paid status in Worker type
  const paidSalary = totalPayroll - pendingSalary;

  const deptPayrollData = useMemo(() => {
    const depts: Record<string, number> = {};
    workers.forEach(w => {
      const dept = w.department || "Unassigned";
      depts[dept] = (depts[dept] || 0) + (w.salary || 0);
    });
    return Object.entries(depts).map(([name, cost]) => ({ name, cost }));
  }, [workers]);

  const payrollStatusData = [
    { name: "Paid", value: paidSalary },
    { name: "Pending", value: pendingSalary },
  ];

  const tableData = useMemo(() => {
    return workers.map(w => {
      const otHrs = w.attendance?.reduce((acc: number, a: any) => acc + (a.overtimeHours || 0), 0) || 0;
      const hourlyRate = w.salary ? (w.salary / 30 / 8) : 0;
      const otPay = otHrs * hourlyRate;
      const advances = 0; // Mock
      const deductions = 0; // Mock

      return {
        ID: w.employeeId,
        Name: w.name,
        Department: w.department,
        BaseSalary: `₹${(w.salary || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}`,
        OTPay: `₹${otPay.toLocaleString(undefined, {maximumFractionDigits: 0})}`,
        Advances: `₹${advances}`,
        Deductions: `₹${deductions}`,
        NetPay: `₹${((w.salary || 0) + otPay - advances - deductions).toLocaleString(undefined, {maximumFractionDigits: 0})}`
      };
    });
  }, [workers]);

  const headers = ["ID", "Name", "Department", "BaseSalary", "OTPay", "Advances", "Deductions", "NetPay"];
  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8884d8'];

  const handleExport = (type: "csv" | "excel" | "pdf") => {
    const filename = "Payroll_Report";
    if (type === "csv") exportToCSV(filename, headers, tableData);
    else if (type === "excel") exportToExcel(filename, headers, tableData);
    else exportToPDF(filename, "Payroll & Finance Report", headers, tableData, { dateRange, summary: "Detailed payroll distribution, OT costs, and salary reporting." });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Payroll Reports</h2>
          <p className="text-sm text-muted-foreground">Monthly salary, OT payments, and department costs.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>Export CSV</Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>Export Excel</Button>
           <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Total Payroll Cost</span>
          <span className="text-2xl font-black">₹{totalPayroll.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">OT Payments</span>
          <span className="text-2xl font-black text-blue-500">₹{otPayments.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Paid Salary</span>
          <span className="text-2xl font-black text-green-500">₹{paidSalary.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Pending Salary</span>
          <span className="text-2xl font-black text-orange-500">₹{pendingSalary.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4">Department Payroll Cost</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptPayrollData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} formatter={(val: any) => `₹${Number(val).toLocaleString()}`} />
                <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4">Payroll Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={payrollStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {payrollStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => `₹${Number(val).toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm mt-6">
        <div className="p-4 border-b border-border bg-muted/20 font-semibold text-sm">
           Employee Salary Log
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
                  <td className="px-4 py-3 font-bold">{row.BaseSalary}</td>
                  <td className="px-4 py-3 text-blue-600">{row.OTPay}</td>
                  <td className="px-4 py-3 text-orange-500">{row.Advances}</td>
                  <td className="px-4 py-3 text-red-500">{row.Deductions}</td>
                  <td className="px-4 py-3 font-black text-green-600">{row.NetPay}</td>
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
