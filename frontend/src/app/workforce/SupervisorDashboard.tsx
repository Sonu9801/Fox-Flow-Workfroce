"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { 
  Menu, Bell, CheckCircle2, XCircle, AlertCircle, 
  Users, Activity, Clock, ShieldCheck, FileText, FileSignature, 
  CarFront, Zap, ChevronRight, BarChart3, Star, LogOut, Plus, Search, Calendar,
  Factory, Receipt, UserCircle, Grid, MessageSquare, Home, ClipboardList, ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi, vehiclesApi, notificationsApi, jobsApi, workersApi, authApi } from "@/lib/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApprovalsTab } from "./ApprovalsTab";
import { ReportsTab } from "./ReportsTab";
import { NotificationsTab } from "./NotificationsTab";
import { PerformanceTab } from "./PerformanceTab";
import { WorkerSettingsTab } from "./components/WorkerSettingsTab";
import { WorkerSupportTab } from "./components/WorkerSupportTab";
import { getTranslation } from "./i18n";
import { ProductionTab } from "./ProductionTab";
import { InvoiceTab } from "./InvoiceTab";
import { AttendanceTab } from "./AttendanceTab";
import { LeavesTab } from "./LeavesTab";

// MOCK DATA FALLBACKS (Used if API data is empty for design consistency while developing)
const fallbackPlatforms = [
  { id: "PF-401", vehicle: "Fox e-Rickshaw", oem: "Fox Motors", stage: "Chassis Assembly", assigned: 4, progress: 75, status: "in_progress" },
  { id: "PF-402", vehicle: "Fox e-Cart", oem: "Fox Motors", stage: "Battery Installation", assigned: 2, progress: 30, status: "delayed" }
];

const fallbackApprovals = [
  { id: 1, type: "Completion Photo", detail: "Job #1024 - Chassis welded", time: "10 mins ago" },
  { id: 2, type: "Attendance Correction", detail: "Ramesh K. - Missing Punch Out", time: "1 hour ago" },
];

const fallbackNotifications = [
  { id: 1, title: "Critical Delay", msg: "Platform PF-402 is falling behind schedule.", time: "15 mins ago", icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
  { id: 2, title: "Worker Online", msg: "Suresh P. just punched in.", time: "45 mins ago", icon: Users, color: "text-green-500", bg: "bg-green-50" },
];

export function SupervisorDashboard({ worker, onLogout }: { worker?: any; onLogout?: () => void }) {
  const [activeTab, setActiveTab] = useState<"home" | "platforms" | "approvals" | "reports" | "profile" | "notifications" | "performance" | "settings" | "support" | "attendance" | "leaves">("home");
  const [showSidebar, setShowSidebar] = useState(false);
  const [langIndex, setLangIndex] = useState(0);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | string | null>(null);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<number[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>("assembly");
  const queryClient = useQueryClient();
  const router = useRouter();

  // Initialize WebSocket for real-time updates across the dashboard
  useWebSocket();

  // Fetch full user profile
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => authApi.me(),
    staleTime: Infinity,
  });

  // Use fetched profile if available, otherwise fallback to worker prop or empty
  const activeUser = userProfile || worker || {};

  const isValidId = (id: any) => id && id !== "undefined" && id !== "null";
  const managerId = isValidId(activeUser.id) ? activeUser.id : (isValidId(activeUser.worker_id) ? activeUser.worker_id : 1);

  const { data: attendanceAnalytics } = useQuery({
    queryKey: ["attendanceAnalytics", managerId],
    queryFn: () => attendanceApi.getAnalytics(),
    refetchInterval: 30000,
    enabled: !!managerId,
  });

  const { data: pendingApprovals } = useQuery({
    queryKey: ["pendingRequests", managerId],
    queryFn: () => attendanceApi.getPendingRequests(managerId),
    refetchInterval: 30000,
    enabled: !!managerId,
  });

  const { data: platforms = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehiclesApi.getAll(),
    refetchInterval: 60000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getAll(false),
    refetchInterval: 60000,
  });

  const { data: allWorkers = [] } = useQuery({
    queryKey: ["workers"],
    queryFn: () => workersApi.getAll(),
    refetchInterval: 60000,
  });

  const assignMutation = useMutation({
    mutationFn: (data: any) => jobsApi.assign(data),
    onSuccess: () => {
      toast.success("Job assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setIsAssignDialogOpen(false);
      setSelectedWorkerIds([]);
      setSelectedVehicleId(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to assign job");
    }
  });

  const handleAssign = () => {
    if (!selectedVehicleId) return toast.error("Select a platform");
    if (selectedWorkerIds.length === 0) return toast.error("Select at least one worker");
    if (selectedWorkerIds.length > 2) return toast.error("Maximum two workers allowed.");
    
    assignMutation.mutate({
      vehicle_id: Number(selectedVehicleId),
      stage: selectedStage,
      worker_ids: selectedWorkerIds,
      supervisor_id: activeUser.id || activeUser.worker_id,
      expected_duration_minutes: 120
    });
  };

  const toggleWorker = (id: number) => {
    if (selectedWorkerIds.includes(id)) {
      setSelectedWorkerIds(prev => prev.filter(wId => wId !== id));
    } else {
      if (selectedWorkerIds.length >= 2) {
        toast.error("Maximum two workers allowed.");
        return;
      }
      setSelectedWorkerIds(prev => [...prev, id]);
    }
  };

  const totalApprovals = (pendingApprovals?.pending_leaves || 0) + (pendingApprovals?.pending_corrections || 0);

  // --- Production Summary Computed Metrics ---
  const completedVehicles = platforms.filter((v: any) => v.current_stage === "dispatch" || v.current_stage === "rtd").length;
  const delayedVehicles = platforms.filter((v: any) => new Date(v.estimated_delivery) < new Date() && v.current_stage !== "dispatch").length;
  const runningPlatforms = platforms.filter((v: any) => v.current_stage !== "oem" && v.current_stage !== "dispatch" && v.current_stage !== "rtd").length;
  
  // --- Assigned Platforms Calculation ---
  // In a real app with proper platform-to-supervisor mapping, we'd filter by supervisor_id.
  // For now, we display all active (non-completed) platforms as "assigned" platforms for the supervisor.
  const assignedPlatforms = platforms.filter((p: any) => p.current_stage !== "dispatch" && p.current_stage !== "rtd");

  const handleLogoutAction = () => {
    useAuthStore.getState().logout();
    router.push("/login");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 pb-24 font-sans text-gray-900 dark:text-gray-100 overflow-x-hidden">
      
      {/* Enterprise Mobile Header */}
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-zinc-950 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2.5 z-40 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between transition-colors">
        
        {/* LEFT SECTION: Hamburger Menu or Back Button */}
        <div className="flex-shrink-0">
          {activeTab === "home" ? (
            <button onClick={() => setShowSidebar(true)} className="p-1.5 -ml-1.5 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center">
               <Menu size={22} strokeWidth={2} />
            </button>
          ) : (
            <button onClick={() => setActiveTab("home")} className="p-1.5 -ml-1.5 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center">
               <ChevronLeft size={22} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* CENTER SECTION: Greeting */}
        <div className="flex-1 px-3 text-left overflow-hidden">
          <h1 className="text-[17px] font-[700] leading-tight text-[#111827] dark:text-white mb-1 truncate">
            {getTranslation(langIndex, getGreeting())}, {activeUser?.name?.split(' ')[0] || "Supervisor"} 👋
          </h1>
          <p className="text-[12px] font-[500] text-[#6B7280] dark:text-gray-400 leading-none truncate mt-0.5">
            ID: {activeUser?.employee_id || "SUP-001"} • {getTranslation(langIndex, activeUser?.department || "Production")}
          </p>
        </div>

        {/* RIGHT SECTION: Notifications & Profile */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => setActiveTab("notifications")} className="relative p-1.5 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center">
            <Bell size={22} strokeWidth={2} />
            {notifications?.filter((n: any) => !n.is_read).length > 0 && (
              <span className="absolute top-1 right-1.5 bg-red-600 text-white text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white dark:border-zinc-900 box-content">
                {notifications?.filter((n: any) => !n.is_read).length > 99 ? '99+' : notifications?.filter((n: any) => !n.is_read).length}
              </span>
            )}
          </button>
          
          <button className="relative ml-1 flex items-center justify-center" onClick={() => setActiveTab("profile")}>
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0 border border-gray-200 dark:border-zinc-700">
              {activeUser?.profile_photo_url ? <img src={activeUser.profile_photo_url} className="w-full h-full object-cover" /> : <span className="font-bold text-gray-500 dark:text-gray-400 text-sm">{activeUser?.name?.charAt(0) || "S"}</span>}
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-[1.5px] border-white dark:border-zinc-950 rounded-full bg-green-500"></div>
          </button>
        </div>
      </header>

      <div className="pt-[72px]">
      {activeTab === "home" && (
        <AnimatePresence mode="wait">
          <motion.div 
            key="home-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 space-y-6 max-w-xl mx-auto"
          >
            {/* 2. HERO CARD (Gradient Premium) - Team Attendance */}
            <motion.div 
              className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 rounded-[28px] p-5 shadow-xl shadow-indigo-600/20 text-white relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('reports')}
            >
              {/* Glass Decor */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-5 relative z-10">
                <div>
                  <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-1">Team Attendance</p>
                  <p className="text-xl font-bold">{activeUser?.department || "General"} Shift</p>
                </div>
                <div className="text-right">
                  <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-1">{format(new Date(), "MMM dd, yyyy")}</p>
                  <p className="text-xl font-bold flex items-center justify-end gap-1.5">
                    <Clock size={16} className="text-indigo-200" /> 
                    {attendanceAnalytics?.today_punch_count || 0} Punches
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 relative z-10">
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{attendanceAnalytics?.present || 0}</p>
                  <p className="text-[9px] text-indigo-100 uppercase font-bold mt-1">Present</p>
                </div>
                <div className="text-center border-l border-white/10">
                  <p className="text-2xl font-black text-red-200">{attendanceAnalytics?.absent || 0}</p>
                  <p className="text-[9px] text-indigo-100 uppercase font-bold mt-1">Absent</p>
                </div>
                <div className="text-center border-l border-white/10">
                  <p className="text-2xl font-black text-orange-200">{attendanceAnalytics?.late || 0}</p>
                  <p className="text-[9px] text-indigo-100 uppercase font-bold mt-1">Late</p>
                </div>
                <div className="text-center border-l border-white/10">
                  <p className="text-2xl font-black text-yellow-200">{attendanceAnalytics?.half_day || 0}</p>
                  <p className="text-[9px] text-indigo-100 uppercase font-bold mt-1">Half Day</p>
                </div>
              </div>
            </motion.div>

            {/* 3. QUICK ACTIONS (8-Grid) */}
            <div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 px-1">Quick Actions</h2>
              <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                {[
                  { icon: Factory, label: "Production", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", onClick: () => setActiveTab('production') },
                  { icon: Users, label: "Attendance", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", onClick: () => setActiveTab('attendance') },
                  { icon: Activity, label: "Performance", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400", onClick: () => setActiveTab('performance') },
                  { icon: ShieldCheck, label: "Approvals", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400", onClick: () => setActiveTab('approvals') },
                  { icon: FileSignature, label: "Leaves", color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400", onClick: () => setActiveTab('leaves') },
                  { icon: BarChart3, label: "Reports", color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400", onClick: () => setActiveTab('reports') },
                  { icon: Receipt, label: "Invoices", color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400", onClick: () => setActiveTab('invoice') },
                  { icon: Menu, label: "More", color: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400", onClick: () => setShowSidebar(true) }
                ].map((item, i) => (
                  <motion.button 
                    key={i} 
                    whileTap={{ scale: 0.9 }}
                    onClick={item.onClick}
                    className="flex flex-col items-center justify-center gap-2 group cursor-pointer"
                  >
                    <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm ${item.color}`}>
                      <item.icon size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 text-center leading-tight">
                      {item.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 4. PRODUCTION SUMMARY */}
            <div 
              className="bg-white dark:bg-zinc-900 rounded-[28px] p-5 shadow-sm border border-gray-100 dark:border-zinc-800 cursor-pointer hover:border-indigo-200 transition-colors"
              onClick={() => setActiveTab('production')}
            >
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center justify-between">
                Production Summary
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200">Live</Badge>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Activity size={16} /></div>
                    <span className="text-xs font-bold text-gray-600">Running</span>
                  </div>
                  <span className="text-lg font-black">{runningPlatforms}</span>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle2 size={16} /></div>
                    <span className="text-xs font-bold text-gray-600">Completed</span>
                  </div>
                  <span className="text-lg font-black text-green-600">{completedVehicles}</span>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><XCircle size={16} /></div>
                    <span className="text-xs font-bold text-gray-600">Delayed</span>
                  </div>
                  <span className="text-lg font-black text-red-600">{delayedVehicles}</span>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><CarFront size={16} /></div>
                    <span className="text-xs font-bold text-gray-600">Total</span>
                  </div>
                  <span className="text-lg font-black">{platforms.length}</span>
                </div>
              </div>
            </div>

            {/* 5. ASSIGNED PLATFORMS */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">Active Platforms</h2>
                <button 
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400"
                  onClick={() => setActiveTab('production')}
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {assignedPlatforms.length === 0 ? (
                  <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-8 text-center shadow-sm border border-gray-100 dark:border-zinc-800">
                    <CarFront className="mx-auto text-gray-300 mb-2" size={32} />
                    <p className="text-sm font-bold text-gray-500">No active platforms assigned</p>
                  </div>
                ) : (
                  assignedPlatforms.slice(0, 5).map((pf: any) => {
                    const workerCount = pf.assignedWorkerIds?.length || pf.workers?.length || 0;
                    const isFull = workerCount >= 2;
                    
                    return (
                      <div 
                        key={pf.id} 
                        className="bg-white dark:bg-zinc-900 rounded-[24px] p-5 shadow-sm border border-gray-100 dark:border-zinc-800 hover:border-indigo-100 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <Badge variant="outline" className="mb-2 bg-indigo-50 text-indigo-700 border-indigo-200 text-[9px] uppercase font-bold">
                              {pf.currentStage || "Pending"}
                            </Badge>
                            <h3 className="font-extrabold text-lg">{pf.platformNumber || pf.trackingId} • {pf.vehicleNumber || pf.vehicleModel}</h3>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">{pf.oemName}</p>
                          </div>
                          <Badge variant="secondary" className={`text-[10px] uppercase font-bold ${
                            pf.currentStage !== 'oem' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {(pf.currentStage !== 'oem' ? "In Progress" : "Pending")}
                          </Badge>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                          <div className="flex justify-between items-center text-xs font-bold mb-2">
                            <span className="text-gray-600 flex items-center gap-1">
                              <Users size={14} /> 
                              {workerCount}/2 Workers 
                              {isFull && <span className="text-[9px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md ml-1">FULL</span>}
                            </span>
                            <span className="text-indigo-600">{pf.progressPercent || 0}%</span>
                          </div>
                          {workerCount > 0 && (
                            <div className="flex gap-1 mb-3">
                              {pf.workers?.map((w: any) => (
                                <span key={w.id} className="text-[10px] bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-gray-600 font-medium">
                                  {w.name}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${pf.currentStage !== 'oem' ? 'bg-indigo-500' : 'bg-gray-400'}`} 
                              style={{ width: `${pf.progressPercent || 0}%` }}
                            />
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full mt-4 rounded-xl text-sm font-bold h-10 border-gray-200"
                          onClick={() => setActiveTab('production')}
                        >
                          View Details
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 6. PENDING APPROVALS */}
            <div className="bg-white dark:bg-zinc-900 rounded-[28px] p-5 shadow-sm border border-gray-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck size={18} className="text-orange-500" /> Pending Approvals
                </h2>
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">{totalApprovals} Pending</Badge>
              </div>
              <div className="space-y-3">
                {totalApprovals > 0 ? (
                  <>
                    {pendingApprovals?.pending_leaves > 0 && (
                      <button className="w-full text-left p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center">
                            <AlertCircle size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Leave Requests</p>
                            <p className="text-xs text-gray-500">{pendingApprovals.pending_leaves} pending approval</p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </button>
                    )}
                    {pendingApprovals?.pending_corrections > 0 && (
                      <button className="w-full text-left p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center">
                            <AlertCircle size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Attendance Corrections</p>
                            <p className="text-xs text-gray-500">{pendingApprovals.pending_corrections} pending approval</p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </button>
                    )}
                  </>
                ) : (
                  fallbackApprovals.map((app) => (
                    <button key={app.id} className="w-full text-left p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between group opacity-50 grayscale">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center">
                          <AlertCircle size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{app.type}</p>
                          <p className="text-xs text-gray-500">{app.detail}</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* 7. TEAM PERFORMANCE */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">Performance Analytics</h2>
                <button onClick={() => setActiveTab("performance")} className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Detailed View</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-[24px] shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col justify-center items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mb-2"><Star size={20} /></div>
                  <p className="text-xl font-black">94%</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Productivity</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-[24px] shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col justify-center items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2"><Zap size={20} /></div>
                  <p className="text-xl font-black">4h 20m</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Avg Completion</p>
                </div>
              </div>
            </div>


            
            <div className="h-10"></div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Approvals Tab */}
      {activeTab === "approvals" && (
        <ApprovalsTab activeUser={activeUser} />
      )}

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <ReportsTab activeUser={activeUser} />
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <NotificationsTab activeUser={activeUser} setActiveTab={setActiveTab} />
      )}

      {/* Performance Tab */}
      {activeTab === "performance" && (
        <PerformanceTab activeUser={activeUser} />
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <AttendanceTab activeUser={activeUser} />
      )}

      {/* Leaves Tab */}
      {activeTab === "leaves" && (
        <LeavesTab activeUser={activeUser} />
      )}

      {/* Production Dashboard Tab */}
      {activeTab === "production" && (
        <ProductionTab activeUser={activeUser} />
      )}

      {/* Invoice Tab */}
      {activeTab === "invoice" && (
        <InvoiceTab activeUser={activeUser} />
      )}

      {/* Profile Tab */}
      {activeTab === "profile" && (
          <div className="p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto">
            <h2 className="text-2xl font-extrabold mb-6">Profile Settings</h2>
            
            <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-zinc-800 text-center mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10"></div>
              
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-[28px] flex items-center justify-center mb-4 relative z-10 shadow-inner border-4 border-white dark:border-zinc-900 rotate-3">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 -rotate-3">{activeUser?.name?.charAt(0) || 'S'}</span>
              </div>
              
              <h3 className="text-xl font-extrabold">{activeUser?.name || 'Supervisor'}</h3>
              <p className="text-sm font-medium text-indigo-600 mt-1">{activeUser?.designation || 'Floor Manager'}</p>
              
              <div className="flex gap-2 justify-center mt-4">
                <Badge variant="outline" className="bg-gray-50 border-gray-200 text-xs py-1">ID: {activeUser?.employee_id || 'SUP-104'}</Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs py-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active Session
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full bg-white dark:bg-zinc-900 p-4 rounded-2xl flex items-center justify-between border border-gray-100 dark:border-zinc-800 hover:border-indigo-200 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-600 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">Account Security</p>
                    <p className="text-xs text-gray-500">Password, 2FA, Sessions</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
              
              <button className="w-full bg-white dark:bg-zinc-900 p-4 rounded-2xl flex items-center justify-between border border-gray-100 dark:border-zinc-800 hover:border-indigo-200 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-600 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <Bell size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">Notifications</p>
                    <p className="text-xs text-gray-500">Push, Email, SMS preferences</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </div>

            <Button 
              variant="destructive" 
              className="w-full mt-8 rounded-2xl py-6 font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-all"
              onClick={handleLogoutAction}
            >
              Secure Logout
            </Button>
          </div>
        )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
         <WorkerSettingsTab />
      )}

      {/* Support Tab */}
      {activeTab === "support" && (
         <WorkerSupportTab />
      )}

      </div>

      {/* BOTTOM NAVIGATION (Simplified to Home Button only) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none flex justify-center">
        <div className="bg-white dark:bg-zinc-900 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-zinc-800 p-2 flex items-center pointer-events-auto">
          <button 
            onClick={() => setActiveTab("home")} 
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-colors ${activeTab === 'home' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
          >
            <Home size={22} strokeWidth={2.5} />
            <span className="text-[13px] font-bold">Home</span>
          </button>
        </div>
      </div>

      {/* Sidebar Drawer */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowSidebar(false)}
            />
            <motion.div 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-[320px] bg-white dark:bg-zinc-950 z-50 flex flex-col shadow-2xl border-r border-transparent dark:border-zinc-800"
            >
              <div className="p-6 bg-indigo-600 text-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/50 overflow-hidden flex items-center justify-center shrink-0">
                    {activeUser?.profile_photo_url ? (
                      <img src={activeUser.profile_photo_url} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-white text-xl">{activeUser?.name?.charAt(0) || "S"}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-[18px] font-bold leading-tight">{activeUser?.name || "Supervisor"}</h2>
                    <p className="text-[12px] text-white/80 mt-1">{activeUser?.employee_id || "SUP-001"}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                <button onClick={() => { setShowSidebar(false); setActiveTab("profile"); }} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-gray-300 transition-colors w-full text-left">
                  <UserCircle size={22} className="text-blue-500" />
                  <span className="font-semibold">{getTranslation(langIndex, "My Profile")}</span>
                </button>
                <button onClick={() => { setShowSidebar(false); setActiveTab("production"); }} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-gray-300 transition-colors w-full text-left">
                  <Factory size={22} className="text-purple-500" />
                  <span className="font-semibold">{getTranslation(langIndex, "Production")}</span>
                </button>
                <button onClick={() => { setShowSidebar(false); setActiveTab("invoice"); }} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-gray-300 transition-colors w-full text-left">
                  <Receipt size={22} className="text-blue-500" />
                  <span className="font-semibold">{getTranslation(langIndex, "Invoices")}</span>
                </button>
                <button onClick={() => { setShowSidebar(false); setActiveTab("approvals"); }} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-gray-300 transition-colors w-full text-left">
                  <ShieldCheck size={22} className="text-green-500" />
                  <span className="font-semibold">{getTranslation(langIndex, "Approvals")}</span>
                </button>
                <button onClick={() => { setShowSidebar(false); setActiveTab("reports"); }} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-gray-300 transition-colors w-full text-left">
                  <BarChart3 size={22} className="text-orange-500" />
                  <span className="font-semibold">{getTranslation(langIndex, "Reports")}</span>
                </button>
                <button onClick={() => { setShowSidebar(false); setActiveTab("settings"); }} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-gray-300 transition-colors w-full text-left">
                  <Grid size={22} className="text-indigo-500" />
                  <span className="font-semibold">{getTranslation(langIndex, "App Settings")}</span>
                </button>
                <button onClick={() => { setShowSidebar(false); setActiveTab("support"); }} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-gray-300 transition-colors w-full text-left">
                  <MessageSquare size={22} className="text-teal-500" />
                  <span className="font-semibold">{getTranslation(langIndex, "Help & Support")}</span>
                </button>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
                <button onClick={() => { setShowSidebar(false); handleLogoutAction(); }} className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors w-full font-bold">
                  <LogOut size={20} />
                  <span>{getTranslation(langIndex, "Logout")}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
