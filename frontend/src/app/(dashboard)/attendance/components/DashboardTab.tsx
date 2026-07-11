import React, { useState } from "react";
import { useAttendanceAnalytics, useAttendanceLogs } from "@/hooks/useQueries";
import AttendanceDetailsDrawer from "./AttendanceDetailsDrawer";
import { Worker } from "@/types";
import { 
  Users, UserCheck, UserX, Clock, Calendar, Briefcase, 
  IndianRupee, TrendingUp, TrendingDown, MapPin, Camera, AlertCircle, Filter, Download, List
} from "lucide-react";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

// Mock Data for Analytics
const MOCK_DAILY_TREND = [
  { day: "Mon", present: 45, absent: 5, late: 2 },
  { day: "Tue", present: 48, absent: 2, late: 4 },
  { day: "Wed", present: 47, absent: 3, late: 1 },
  { day: "Thu", present: 46, absent: 4, late: 3 },
  { day: "Fri", present: 49, absent: 1, late: 2 },
  { day: "Sat", present: 42, absent: 8, late: 5 },
  { day: "Sun", present: 15, absent: 35, late: 1 },
];

const MOCK_DEPT_STATS = [
  { name: "Fabrication", present: 18, absent: 2, ot: 4 },
  { name: "Paint", present: 12, absent: 1, ot: 2 },
  { name: "Assembly", present: 22, absent: 3, ot: 5 },
  { name: "Quality", present: 8, absent: 0, ot: 1 },
  { name: "Dispatch", present: 6, absent: 1, ot: 2 },
];

const PIE_COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6"];

const MOCK_LIVE_FEED = [
  { time: "09:12 AM", text: "Rakesh Punched In", type: "present" },
  { time: "09:35 AM", text: "Amit Marked Present", type: "present" },
  { time: "10:12 AM", text: "Rahul Late Arrival", type: "late" },
  { time: "11:00 AM", text: "Worker Punch Out", type: "out" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card text-foreground border border-border p-3 rounded-lg shadow-lg min-w-[120px]">
        {label && <p className="text-sm font-semibold mb-2">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill || "#3b82f6" }} />
            <span className="text-muted-foreground capitalize">{entry.name}:</span>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardTab({ workers, isLoading }: { workers: Worker[], isLoading: boolean }) {
  const [dateRange, setDateRange] = useState("Today");
  const [showFilters, setShowFilters] = useState(false);
  const [filterDept, setFilterDept] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Summary logic (using mock metrics for demo completeness as per user request)
  const { data: analytics } = useAttendanceAnalytics();
  const { data: logs } = useAttendanceLogs();

  const totalEmployees = analytics?.total || 0;
  const presentToday = analytics?.present || 0;
  const absentToday = analytics?.absent || 0;
  const lateEmployees = analytics?.late || 0;
  const halfDayEmployees = analytics?.half_day || 0;
  
  // Calculate OT based on workers or default to 0
  const otRunning = logs?.filter((l: any) => l.ot_hours > 0).length || 0;
  const sundayWorkers = 0;

  const presentPercent = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;
  const absentPercent = totalEmployees > 0 ? Math.round((absentToday / totalEmployees) * 100) : 0;
  const latePercent = presentToday > 0 ? Math.round((lateEmployees / presentToday) * 100) : 0;
  const monthlyAvg = 92;

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysLogs = (logs || []).filter((l: any) => l.date === todayStr);
  
  // Build a basic live feed from today's logs
  const liveFeed = (logs || []).slice(0, 5).map((log: any) => {
     let text = `${log.employee_name} Punched In`;
     let type = 'present';
     let time = log.punch_in ? new Date(log.punch_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--';
     
     if (log.punch_out) {
       text = `${log.employee_name} Punched Out`;
       type = 'out';
       time = new Date(log.punch_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
     } else if (log.status === "Late") {
       type = 'late';
       text = `${log.employee_name} Late Arrival`;
     }
     
     return { text, type, time, department: log.department || "Unknown" };
  });

  let displayFeed = liveFeed.length > 0 ? liveFeed : MOCK_LIVE_FEED;
  
  if (filterDept !== "All" || filterType !== "All") {
    displayFeed = displayFeed.filter((item: any) => {
      const matchDept = filterDept === "All" || (item.department === filterDept || (item.department === "Unknown" && filterDept === "Fabrication")); // Mock logic for demo
      const matchType = filterType === "All" || item.type === filterType.toLowerCase();
      return matchDept && matchType;
    });
  }

  const KPICard = ({ title, value, icon: Icon, colorClass, subtext }: any) => (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-3xl font-bold text-foreground mt-2">{value}</h3>
        {subtext && <p className="text-xs text-muted-foreground mt-2">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon size={20} />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header Actions */}
      <div className="relative z-30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Briefcase className="text-primary" size={20} />
          Attendance Command Center
        </h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="flex-1 sm:flex-none bg-muted/50 border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option>Today</option>
            <option>Yesterday</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 sm:flex-none justify-center flex items-center gap-2 border border-input px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-primary/20 text-primary border-primary/30' : 'bg-muted/50 hover:bg-muted text-foreground'}`}
          >
            <Filter size={16} /> Filters
          </button>
          <button className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Department</label>
            <select 
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="h-9 bg-background border border-input rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[160px]"
            >
              <option value="All">All Departments</option>
              <option value="Fabrication">Fabrication</option>
              <option value="Paint">Paint</option>
              <option value="Assembly">Assembly</option>
              <option value="Quality">Quality</option>
              <option value="Dispatch">Dispatch</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Status Type</label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-9 bg-background border border-input rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[140px]"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Out">Punched Out</option>
            </select>
          </div>
          <div className="ml-auto">
            <button 
              onClick={() => { setFilterDept("All"); setFilterType("All"); }}
              className="h-9 px-4 bg-muted/50 text-muted-foreground hover:text-foreground text-sm font-medium rounded-md transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Present Today" value={presentToday} icon={UserCheck} colorClass="bg-emerald-500/10 text-emerald-500" subtext="76% of workforce" />
        <KPICard title="Absent Today" value={absentToday} icon={UserX} colorClass="bg-red-500/10 text-red-500" subtext="12% of workforce" />
        <KPICard title="Late Employees" value={lateEmployees} icon={Clock} colorClass="bg-orange-500/10 text-orange-500" subtext="After 10:00 AM" />
        <KPICard title="Half Day" value={halfDayEmployees} icon={Calendar} colorClass="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" subtext="Left early" />
        <KPICard title="OT Running" value={otRunning} icon={TrendingUp} colorClass="bg-purple-500/10 text-purple-500" subtext="Currently working OT" />
        <KPICard title="Sunday Workers" value={sundayWorkers} icon={Users} colorClass="bg-blue-500/10 text-blue-500" subtext="Extra shift" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ATTENDANCE STATUS OVERVIEW */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm lg:col-span-2">
          <h3 className="text-base font-semibold mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-muted-foreground" />
            Attendance Status Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl">
              <div className="text-3xl font-bold text-emerald-500">{presentPercent}%</div>
              <div className="text-sm font-medium text-muted-foreground mt-1">Present</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl">
              <div className="text-3xl font-bold text-red-500">{absentPercent}%</div>
              <div className="text-sm font-medium text-muted-foreground mt-1">Absent</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl">
              <div className="text-3xl font-bold text-orange-500">{latePercent}%</div>
              <div className="text-sm font-medium text-muted-foreground mt-1">Late</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl">
              <div className="text-3xl font-bold text-primary">{monthlyAvg}%</div>
              <div className="text-sm font-medium text-muted-foreground mt-1">Monthly Avg</div>
            </div>
          </div>
          
          <div className="h-64 mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_DAILY_TREND}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="present" stroke="#10b981" fillOpacity={1} fill="url(#colorPresent)" strokeWidth={3} />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LIVE ATTENDANCE FEED */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Feed
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {displayFeed.map((feed: any, i: number) => (
              <div key={i} className="flex gap-3 items-start relative">
                {i !== displayFeed.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-border" />
                )}
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center z-10 
                  ${feed.type === 'present' ? 'bg-emerald-500/20 text-emerald-500' : 
                    feed.type === 'late' ? 'bg-orange-500/20 text-orange-500' : 'bg-muted text-muted-foreground'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${feed.type === 'present' ? 'bg-emerald-500' : feed.type === 'late' ? 'bg-orange-500' : 'bg-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{feed.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{feed.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <button className="w-full text-sm text-primary hover:underline font-medium">View Full Log</button>
          </div>
        </div>
      </div>

      {/* DEPARTMENT ANALYTICS & OWNER COMMAND CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold mb-6 flex items-center gap-2">
            <Users size={18} className="text-muted-foreground" />
            Department Analytics
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_DEPT_STATS} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border)" />
                <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
                <Legend />
                <Bar dataKey="present" name="Present" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="ot" name="OT Running" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OWNER COMMAND CENTER */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <IndianRupee size={120} />
          </div>
          <h3 className="text-base font-semibold mb-6 flex items-center gap-2">
            <IndianRupee size={18} className="text-muted-foreground" />
            Owner Command Center
          </h3>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-muted/40 rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground">Today's Est. Labour Cost</p>
              <p className="text-2xl font-bold mt-1 text-foreground">₹24,500</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground">Monthly Labour Cost</p>
              <p className="text-2xl font-bold mt-1 text-foreground">₹4.2L</p>
            </div>
            <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
              <p className="text-xs text-purple-600 dark:text-purple-400">OT Cost (Today)</p>
              <p className="text-2xl font-bold mt-1 text-purple-700 dark:text-purple-300">₹3,200</p>
            </div>
            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
              <p className="text-xs text-blue-600 dark:text-blue-400">Sunday Cost (Est)</p>
              <p className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-300">₹0</p>
            </div>
            <div className="col-span-2 bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Workforce Utilization</p>
                <p className="text-xl font-bold mt-1 text-emerald-700 dark:text-emerald-300">92.4%</p>
              </div>
              <TrendingUp className="text-emerald-500 opacity-50" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S ATTENDANCE TABLE */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-muted/10">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <List size={18} className="text-muted-foreground" />
            Today's Attendance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Punch In</th>
                <th className="px-5 py-3 font-medium">Punch Out</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Hours</th>
                <th className="px-5 py-3 font-medium">Verified</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {todaysLogs.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">No attendance records for today.</td></tr>
              ) : todaysLogs.map((row: any) => (
                <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{row.employee_name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.department}</td>
                  <td className="px-5 py-3">{row.punch_in ? new Date(row.punch_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</td>
                  <td className="px-5 py-3">{row.punch_out ? new Date(row.punch_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</td>
                  <td className="px-5 py-3">
                     <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium 
                        ${row.status === 'Present' ? 'bg-emerald-500/10 text-emerald-500' : 
                          row.status === 'Half Day' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                          row.status === 'Late' ? 'bg-orange-500/10 text-orange-500' :
                          'bg-red-500/10 text-red-500'}`}>
                       {row.status}
                     </span>
                  </td>
                  <td className="px-5 py-3 font-medium">{row.net_working_hours > 0 ? `${row.net_working_hours}h` : '0h'}</td>
                  <td className="px-5 py-3 flex gap-2">
                    <MapPin size={16} className={row.location_status === 'Verified' ? "text-emerald-500" : "text-muted-foreground"} />
                    <Camera size={16} className={row.photo_status === 'Verified' ? "text-emerald-500" : "text-muted-foreground"} />
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => setSelectedRecord(row)} className="text-primary hover:underline text-xs font-medium">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <AttendanceDetailsDrawer 
        open={!!selectedRecord} 
        onOpenChange={(open: boolean) => !open && setSelectedRecord(null)} 
        record={selectedRecord} 
      />
    </div>
  );
}
