"use client";

import React, { useEffect, useState } from "react";
import { 
  BarChart3, TrendingUp, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Download, Users, DollarSign, Activity, AlertCircle, Percent, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Area, ScatterChart, Scatter, ZAxis, AreaChart
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

// Colors for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function PayrollAnalyticsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/payroll/analytics/full")
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const exportCSV = () => {
    if (!data) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value\n"
      + `Total Payroll,${data.currentMonthTotal}\n`
      + `Forecasted Next Month,${data.forecast}\n`
      + `Growth MoM,${data.growth}%\n`
      + `Advances Pending,${data.advances.pending}\n`
      + "\nDepartment,Cost\n"
      + data.deptCost.map((d: any) => `${d.name},${d.value}`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Payroll_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Activity className="animate-spin text-primary" /></div>;
  }

  if (!data || data.error || data.detail || typeof data.growth === 'undefined') {
    return <div className="text-center text-destructive p-8">Failed to load analytics: {data?.error || data?.detail || "Server Error or Invalid Data"}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Engine</h2>
          <p className="text-muted-foreground">Comprehensive intelligence based on historical attendance and payroll data.</p>
        </div>
        <Button onClick={exportCSV} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Download className="mr-2 h-4 w-4" /> Export CSV Report
        </Button>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Labour Cost Growth (MoM)</h3>
            <Percent className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{data.growth.toFixed(1)}%</span>
            {data.growth > 0 ? <ArrowUpRight className="text-destructive h-4 w-4" /> : <ArrowDownRight className="text-success h-4 w-4" />}
          </div>
        </Card>
        
        <Card className="p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Payroll Forecast (Next Mo.)</h3>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold font-mono">₹{data.forecast.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Advance Recovery Rate</h3>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold">
              {data.advances.given > 0 ? ((data.advances.recovered / data.advances.given) * 100).toFixed(0) : 0}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">₹{data.advances.pending} pending</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Base vs Variable Pay</h3>
            <PieChartIcon className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold">
              {((data.distribution.find((d:any) => d.name === "Base Salary")?.value || 0) / data.currentMonthTotal * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Base Salary Ratio</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Monthly Payroll Trend */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <LineChartIcon className="text-primary" size={20} /> Monthly Payroll Trend
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyTrend}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" fontSize={12} tickMargin={10} />
                <YAxis fontSize={12} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" name="Total Cost" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Dept Wise Cost */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <PieChartIcon className="text-orange-500" size={20} /> Department Wise Labour Cost
          </h3>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.deptCost} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({name, percent}) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {data.deptCost.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3 & 4. Overtime & Sunday Analytics */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="text-emerald-500" size={20} /> Overtime & Sunday Analytics
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Legend />
                <Bar dataKey="ot" name="OT Cost" stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} />
                <Bar dataKey="sunday" name="Sunday Cost" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7. Attendance Correlation */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Users className="text-blue-500" size={20} /> Attendance vs Salary Correlation
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" dataKey="attendanceRate" name="Attendance" unit="%" domain={[0, 100]} />
                <YAxis type="number" dataKey="salary" name="Salary" unit="₹" tickFormatter={(val) => `${val/1000}k`} />
                <ZAxis dataKey="name" name="Employee" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Employees" data={data.correlation} fill="#3b82f6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Highest Paid Employees */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <DollarSign className="text-success" size={20} /> Highest Paid Employees (Current Month)
          </h3>
          <div className="overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 rounded-t-lg">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Base</th>
                  <th className="px-4 py-3">Variable (OT+Sun)</th>
                  <th className="px-4 py-3 rounded-tr-lg">Total Salary</th>
                </tr>
              </thead>
              <tbody>
                {data.highestPaid.map((emp: any, i: number) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3 font-semibold">{emp.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.dept}</td>
                    <td className="px-4 py-3">{emp.present}/{emp.total_days} Days</td>
                    <td className="px-4 py-3 font-mono">₹{emp.base.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-orange-500">₹{(emp.ot + emp.sun).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono font-bold text-success">₹{emp.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
