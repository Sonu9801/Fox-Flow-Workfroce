import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#a28cf5", "#f58ca4"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card text-foreground border border-border p-3 rounded-lg shadow-lg min-w-[120px]">
        {label && <p className="text-sm font-semibold mb-2">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill || "#3b82f6" }} />
            <span className="text-muted-foreground">{entry.name === "total" || entry.name === "value" ? "Amount" : entry.name}:</span>
            <span className="font-medium">₹{Number(entry.value).toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function InvoiceAnalyticsCharts({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Monthly Trend Area Chart */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-subtle flex flex-col h-80">
        <h3 className="text-sm font-semibold mb-4 text-foreground">Monthly Expense Trend</h3>
        <div className="flex-1 w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthlyTrend}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Vendors Bar Chart */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-subtle flex flex-col h-80">
        <h3 className="text-sm font-semibold mb-4 text-foreground">Top Vendors</h3>
        <div className="flex-1 w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topVendors} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis 
                type="number" 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} 
                width={100}
                tickLine={false}
                axisLine={false}
              />
              <RechartsTooltip 
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                content={<CustomTooltip />}
              />
              <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20}>
                {data.topVendors.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Distribution Pie Chart */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-subtle flex flex-col h-80">
        <h3 className="text-sm font-semibold mb-4 text-foreground">Department Expense</h3>
        <div className="flex-1 w-full h-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.departmentDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
              >
                {data.departmentDistribution.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Distribution Line Chart (used as alternative to pie for variety) */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-subtle flex flex-col h-80">
        <h3 className="text-sm font-semibold mb-4 text-foreground">Category Distribution</h3>
        <div className="flex-1 w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.categoryDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`}
              />
              <RechartsTooltip 
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                content={<CustomTooltip />}
              />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
