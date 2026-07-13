"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { compressImage, dataURLtoBlob, getDistanceInMeters } from "./utils/attendanceUtils";
import { getTranslation } from "./i18n";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkerSummary, useWorkerHistory, useWorkerMonthlySummary, useWorkerJobs, useNotifications, useLeaveHistory, useAttendanceSettings } from "@/hooks/useQueries";
import { useWebSocket } from "@/hooks/useWebSocket";
import Webcam from "react-webcam";
import { 
  MapPin, Clock, Fingerprint, Calendar as CalendarIcon, 
  AlertCircle, CheckCircle2, LogOut, RotateCcw, CloudUpload, History, FileText,
  MessageSquareWarning, MessageSquare, X, Plus, UserCircle, Bell,
  File, Settings, Phone, Building, Briefcase, Download, QrCode,
  ChevronRight, ArrowRight, Activity, Loader2,
  Wifi, WifiOff, Camera, MapPinOff, UserCheck, ShieldCheck, Grid, CalendarCheck, HelpCircle, Menu,
  Sun, Clipboard, Megaphone, Coffee, Home, ClipboardList
} from "lucide-react";
import { motion, AnimatePresence, useAnimation } from "motion/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { WorkerJobs } from "./WorkerJobs";
import { WorkerAttendanceTab } from "./components/WorkerAttendanceTab";
import { WorkerLeaveTab } from "./components/WorkerLeaveTab";
import { WorkerNoticeTab } from "./components/WorkerNoticeTab";
import { WorkerOTTab } from "./components/WorkerOTTab";
import { WorkerSundayTab } from "./components/WorkerSundayTab";
import { ApplyLeaveModal } from "./components/ApplyLeaveModal";
import { WorkerSettingsTab } from "./components/WorkerSettingsTab";
import { WorkerSupportTab } from "./components/WorkerSupportTab";
import { WorkerProfileTab } from "./components/WorkerProfileTab";
import { attendanceApi, jobsApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductionJob } from "@/types";

// Geofence constants
const COMPANY_LAT = 28.4736262;
const COMPANY_LNG = 77.2918577;
const RADIUS_METERS = 50000000; // 50,000 km for testing
const COMPANY_ADDRESS = "57T, Gurukul Rd, Indraprastha Industrial Area, Sector 27A, Faridabad, Haryana 121003";

export function WorkerDashboard({ worker, onLogout, setWorker }: { worker: any, onLogout: () => void, setWorker: (w:any)=>void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Navigation
  const [activeTab, setActiveTab] = useState<"home" | "attendance" | "jobs" | "profile" | "ot" | "sunday" | "leave" | "notice" | "notifications" | "settings" | "support">("home");
  
  // Sync activeTab with browser history to intercept back button
  useEffect(() => {
    // Add initial state if not present
    if (typeof window !== 'undefined' && (!window.history.state || !window.history.state.tab)) {
      window.history.replaceState({ tab: activeTab }, "");
    }

    const onPopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
      } else {
        setActiveTab("home");
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleTabChange = (tab: any) => {
    if (tab === activeTab) return;
    window.history.pushState({ tab }, "");
    setActiveTab(tab);
  };

  const [isOnline, setIsOnline] = useState(true);
  
  // Data State - React Query
  const currentMonth = format(new Date(), "yyyy-MM");
  const { data: summary, refetch: refetchSummary } = useWorkerSummary(worker?.worker_id);
  const { data: history = [], refetch: refetchHistory } = useWorkerHistory(worker?.worker_id);
  const { data: monthlySummary, refetch: refetchMonthlySummary } = useWorkerMonthlySummary(worker?.worker_id, currentMonth);
  const { data: activeJobs = [], refetch: refetchJobs } = useWorkerJobs(worker?.worker_id);
  const { data: notificationsData, refetch: refetchNotifications } = useNotifications();
  const { data: leaveHistory = [], isLoading: isLeavesLoading, refetch: refetchLeaves } = useLeaveHistory(worker?.worker_id);
  const notifications = notificationsData || [];
  const { data: attendanceSettings } = useAttendanceSettings();

  // Initialize WebSocket for real-time updates
  useWebSocket();

  const [location, setLocation] = useState<{lat: number, lng: number, accuracy: number} | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [currentAddress, setCurrentAddress] = useState<string>("Locating address...");
  
  const [showSidebar, setShowSidebar] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [langIndex, setLangIndex] = useState(0);
  const [punchAction, setPunchAction] = useState<"Punch In" | "Punch Out">("Punch In");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const savedLang = localStorage.getItem("setting_lang");
    if (savedLang !== null) setLangIndex(Number(savedLang));
    
    // Initialize dark mode from settings on app load
    const savedDark = localStorage.getItem("setting_dark") === "true";
    if (savedDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for custom language change event
    const handleLangChange = () => {
      const updatedLang = localStorage.getItem("setting_lang");
      if (updatedLang !== null) setLangIndex(Number(updatedLang));
    };
    window.addEventListener("languageChanged", handleLangChange);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener("languageChanged", handleLangChange);
    };
  }, []);

  const requestLocationAsync = (): Promise<{lat: number, lng: number, accuracy: number, distance: number}> => {
    return new Promise((resolve, reject) => {
      setLocating(true);
      setLocationError("");
      if (!navigator.geolocation) {
        const msg = "Geolocation not supported";
        setLocationError(msg);
        setLocating(false);
        reject(new Error(msg));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setLocation({ lat: latitude, lng: longitude, accuracy });
          const dist = getDistanceInMeters(latitude, longitude, COMPANY_LAT, COMPANY_LNG);
          setDistance(dist);
          setLocating(false);
          if (dist <= RADIUS_METERS) {
             setCurrentAddress(COMPANY_ADDRESS);
          } else {
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              if (res.ok) {
                const data = await res.json();
                setCurrentAddress(data.display_name || "Location resolved");
              } else {
                setCurrentAddress("Lat: " + latitude.toFixed(4) + ", Lng: " + longitude.toFixed(4));
              }
            } catch (e) {
              setCurrentAddress("Lat: " + latitude.toFixed(4) + ", Lng: " + longitude.toFixed(4));
            }
          }
          resolve({ lat: latitude, lng: longitude, accuracy, distance: dist });
        },
        (error) => {
          let msg = error.message;
          if (error.code === error.PERMISSION_DENIED) {
             msg = "Location blocked by browser. Please allow location in site settings.";
          }
          setLocationError(msg || "GPS Denied");
          setLocating(false);
          setCurrentAddress(msg || "Location disabled. Tap to retry.");
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const requestLocation = useCallback(() => {
    requestLocationAsync().catch(e => console.error(e));
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchSummary(),
      refetchHistory(),
      refetchMonthlySummary(),
      refetchJobs(),
      refetchNotifications()
    ]);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handlePunchClick = async (action: "Punch In" | "Punch Out") => {
    let currentDist = distance;
    let currentAcc = location?.accuracy;
    
    // Always request location to ensure freshness or if we don't have it
    try {
      const pos = await requestLocationAsync();
      currentDist = pos.distance;
      currentAcc = pos.accuracy;
    } catch (err: any) {
      toast.error(err.message || "Could not retrieve GPS location.");
      return;
    }

    if (currentAcc && currentAcc > 50) {
      toast.error(`GPS accuracy too low (${Math.round(currentAcc)}m). Please step outside or try again.`);
      return;
    }

    if (currentDist === null || currentDist > RADIUS_METERS) {
      toast.error("You are outside the permitted attendance area.");
      return; // DO NOT ALLOW BYPASS
    }

    setPunchAction(action);
    setPreviewImage(null);
    setShowCameraModal(true);
  };

  const handleCapture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return toast.error("Failed to capture photo");
    setPreviewImage(await compressImage(imageSrc));
  };

  const submitPunch = async () => {
    if (!previewImage) return;
    setUploading(true);
    const token = localStorage.getItem("worker_token");
    const payload = {
      worker_id: worker.worker_id, action: punchAction, latitude: location?.lat || 0,
      longitude: location?.lng || 0, accuracy: location?.accuracy || 0,
      photo_base64: previewImage, timestamp: new Date().toISOString()
    };

    if (!navigator.onLine) {
       const queue = JSON.parse(localStorage.getItem("attendance_queue") || "[]");
       queue.push(payload);
       localStorage.setItem("attendance_queue", JSON.stringify(queue));
       toast.success(`Offline: ${punchAction} queued for sync.`);
       setShowCameraModal(false);
       setUploading(false);
       return;
    }

    try {
      const formData = new FormData();
      formData.append("worker_id", String(worker.worker_id));
      formData.append("action", punchAction);
      formData.append("latitude", String(location?.lat || 0));
      formData.append("longitude", String(location?.lng || 0));
      formData.append("accuracy", String(location?.accuracy || 0));
      formData.append("photo", dataURLtoBlob(previewImage), `punch_${Date.now()}.jpg`);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/attendance/punch`, { method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData });
      if (!res.ok) throw new Error("Failed to record attendance");
      toast.success(`${punchAction} successful!`);
      setShowCameraModal(false);
      queryClient.invalidateQueries({ queryKey: ["workerSummary"] });
      queryClient.invalidateQueries({ queryKey: ["workerHistory"] });
      queryClient.invalidateQueries({ queryKey: ["workerMonthlySummary"] });
    } catch (err: any) {
      toast.error(err.message || "Error submitting punch.");
    } finally { setUploading(false); }
  };

  const processQueue = useCallback(async () => {
    if (!navigator.onLine) return;
    const queue = JSON.parse(localStorage.getItem("attendance_queue") || "[]");
    if (queue.length === 0) return;
    setSyncing(true);
    const token = localStorage.getItem("worker_token");
    const newQueue = [];
    let synced = 0;
    for (const item of queue) {
      try {
        const formData = new FormData();
        formData.append("worker_id", String(item.worker_id)); formData.append("action", item.action);
        formData.append("latitude", String(item.latitude || 0)); formData.append("longitude", String(item.longitude || 0));
        formData.append("accuracy", String(item.accuracy || 0));
        if (item.photo_base64) formData.append("photo", dataURLtoBlob(item.photo_base64), `offline_${Date.now()}.jpg`);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        const res = await fetch(`${apiUrl}/attendance/punch`, { method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData });
        if (!res.ok) throw new Error("Failed to sync");
        synced++;
      } catch (err) { newQueue.push(item); }
    }
    localStorage.setItem("attendance_queue", JSON.stringify(newQueue));
    if (synced > 0) {
      toast.success(`Synced ${synced} offline records.`);
      queryClient.invalidateQueries({ queryKey: ["workerSummary"] });
      queryClient.invalidateQueries({ queryKey: ["workerHistory"] });
      queryClient.invalidateQueries({ queryKey: ["workerMonthlySummary"] });
    }
    setSyncing(false);
  }, [queryClient]);

  useEffect(() => {
    window.addEventListener("online", processQueue);
    return () => window.removeEventListener("online", processQueue);
  }, [processQueue]);

  if (!worker) return null;
  const pendingQueueCount = (typeof window !== "undefined") ? JSON.parse(localStorage.getItem("attendance_queue") || "[]").length : 0;
  const isPunchedIn = summary?.punch_in && !summary?.punch_out;
  const isDataLoading = !summary || !monthlySummary;

  const currentJob = activeJobs?.find((j: any) => j.status === 'in_progress' || j.status === 'assigned');

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-zinc-950 pb-24 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-blue-200">
      
      {/* Enterprise Mobile Header */}
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-zinc-950 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2.5 z-40 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between transition-colors">
        
        {/* LEFT SECTION: Hamburger Menu */}
        <div className="flex-shrink-0">
          <button onClick={() => setShowSidebar(true)} className="p-1.5 -ml-1.5 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center">
             <Menu size={22} strokeWidth={2} />
          </button>
        </div>

        {/* CENTER SECTION: Greeting */}
        <div className="flex-1 px-3 text-left overflow-hidden">
          <h1 className="text-[17px] font-[700] leading-tight text-[#111827] dark:text-white mb-1 truncate">
            {getTranslation(langIndex, getGreeting())}, {(worker?.name || "Worker").split(' ')[0]} 👋
          </h1>
          <p className="text-[12px] font-[500] text-[#6B7280] dark:text-gray-400 leading-none truncate mt-0.5">
            ID: {worker.employee_id || worker.worker_id} • {getTranslation(langIndex, worker.shift_name || "General Shift")}
          </p>
        </div>

        {/* RIGHT SECTION: Notifications & Profile */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button 
            onClick={() => handleTabChange("notifications")}
            className="relative p-1.5 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
          >
            <Bell size={22} strokeWidth={2} />
            {notifications.filter((n: any) => n.unread).length > 0 && (
              <span className="absolute top-1 right-1.5 bg-red-600 text-white text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white dark:border-zinc-900 box-content">
                {notifications.filter((n: any) => n.unread).length > 99 ? '99+' : notifications.filter((n: any) => n.unread).length}
              </span>
            )}
          </button>
          
          <button className="relative ml-1 flex items-center justify-center" onClick={() => handleTabChange("profile")}>
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center border border-gray-200 dark:border-zinc-700">
              {worker?.profile_photo_url ? <img src={worker.profile_photo_url} alt="Profile" className="w-full h-full rounded-full object-cover" /> : <span className="font-bold text-gray-500 dark:text-gray-400 text-sm">{(worker?.name || "W").charAt(0)}</span>}
            </div>
            {/* Online Indicator */}
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-[1.5px] border-white dark:border-zinc-950 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          </button>
        </div>
      </header>

      {/* Main Content Wrapper */}
      <motion.main 
        className="pt-[72px] px-4 pb-20 space-y-5 max-w-md mx-auto overflow-y-auto min-h-screen"
      >
        <AnimatePresence>
          {isRefreshing && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 40, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-center -mt-2 mb-4"
            >
              <div className="bg-white px-4 py-2 rounded-full shadow-sm flex items-center gap-2 border border-zinc-100 text-xs font-semibold text-zinc-600">
                <Loader2 size={14} className="animate-spin text-blue-600" /> Updating dashboard...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {pendingQueueCount > 0 && (
          <div className="bg-orange-50 text-orange-800 p-3.5 rounded-2xl flex items-center justify-between border border-orange-100 shadow-sm">
            <div className="flex items-center gap-2.5">
              <CloudUpload size={18} className="animate-pulse"/>
              <span className="text-[13px] font-semibold">{pendingQueueCount} Offline Punch(es) pending</span>
            </div>
            <Button size="sm" variant="secondary" className="bg-white text-orange-700 hover:bg-orange-100 h-8 text-xs font-bold shadow-sm" onClick={processQueue} disabled={syncing}>Sync</Button>
          </div>
        )}

        {activeTab === "home" && (
          <motion.div initial={{opacity:0, y:12}} animate={{opacity:1,y:0}} transition={{ duration: 0.3 }} className="space-y-6">
            
            {/* 1. HERO ATTENDANCE CARD */}
            <div className="bg-gradient-to-br from-[#4F6BFF] to-[#5A43F2] rounded-[28px] p-5 shadow-xl shadow-blue-600/20 text-white w-full min-h-[180px] flex flex-col justify-between border border-white/10 relative overflow-hidden">
              {/* Decoration Clock */}
              <Clock size={140} strokeWidth={0.5} className="absolute -right-8 top-1/2 -translate-y-1/2 text-white opacity-[0.12] pointer-events-none" />
              
              {/* Soft Highlight */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-[24px]"></div>

              {isDataLoading ? (
                  <div className="space-y-4 relative z-10 w-full h-full flex flex-col justify-center">
                    <Skeleton className="h-6 w-32 bg-white/20 rounded-full" />
                    <Skeleton className="h-10 w-40 bg-white/20 rounded-lg mt-2" />
                    <Skeleton className="h-[48px] w-full rounded-2xl bg-white/20 mt-auto" />
                  </div>
              ) : (
                <div className="relative z-10 flex flex-col h-full justify-between">
                  
                  <div className="flex w-full mb-3 mt-0.5">
                    {/* Left Column */}
                    <div className="flex-1 flex flex-col items-start pr-4 border-r border-white/10">
                      
                      {/* Attendance Badge */}
                      <div className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-3 ${isPunchedIn ? 'bg-[#4ADE80]/20 text-white' : 'bg-white/20 text-white'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isPunchedIn ? 'bg-[#86efac]' : 'bg-white/50'}`}></div>
                        {isPunchedIn ? "Present" : "Off Duty"}
                      </div>
                      
                      {/* Live Time & Date */}
                      <h2 className="text-[32px] sm:text-[36px] font-black tracking-tight leading-none drop-shadow-sm mb-1">
                        {format(currentTime, "hh:mm")} <span className="text-[16px] sm:text-[18px] font-bold text-white/90">{format(currentTime, "a")}</span>
                      </h2>
                      <p className="text-white/80 text-[12px] font-medium tracking-wide mb-3">
                        {format(currentTime, "EEEE, d MMMM yyyy")}
                      </p>

                      {/* VERIFICATION SECTION */}
                      <div className="flex items-center gap-4 mt-2">
                         <div className={`flex items-center gap-1.5 ${isPunchedIn ? 'opacity-100' : 'opacity-60'}`}>
                           <MapPin size={12} className="text-white/80" />
                           <span className="text-[10px] font-medium text-white/90">Location {isPunchedIn ? 'Verified' : 'Pending'}</span>
                           {isPunchedIn ? <CheckCircle2 size={14} className="fill-[#4ADE80] text-[#4F6BFF]" /> : <div className="w-3.5 h-3.5 rounded-full border border-white/50" />}
                         </div>
                         <div className={`flex items-center gap-1.5 ${isPunchedIn ? 'opacity-100' : 'opacity-60'}`}>
                           <Camera size={12} className="text-white/80" />
                           <span className="text-[10px] font-medium text-white/90">Selfie {isPunchedIn ? 'Verified' : 'Pending'}</span>
                           {isPunchedIn ? <CheckCircle2 size={14} className="fill-[#4ADE80] text-[#4F6BFF]" /> : <div className="w-3.5 h-3.5 rounded-full border border-white/50" />}
                         </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="pl-4 flex flex-col justify-start">
                      {/* Shift Time */}
                      <div className="mb-4 mt-2">
                        <p className="text-[10px] text-white/70 font-medium mb-1.5 tracking-wide">Shift Time</p>
                        <p className="text-[11px] font-bold text-white tracking-wide leading-tight">
                          {attendanceSettings?.defaultShiftStart ? (() => {
                            try { const [h,m] = attendanceSettings.defaultShiftStart.split(':'); const d=new Date(); d.setHours(parseInt(h)); d.setMinutes(parseInt(m)); return format(d, 'hh:mm a'); } catch { return "09:00 AM"; }
                          })() : "09:00 AM"} - {attendanceSettings?.defaultShiftEnd ? (() => {
                            try { const [h,m] = attendanceSettings.defaultShiftEnd.split(':'); const d=new Date(); d.setHours(parseInt(h)); d.setMinutes(parseInt(m)); return format(d, 'hh:mm a'); } catch { return "06:00 PM"; }
                          })() : "06:00 PM"}
                        </p>
                      </div>

                      <div className="h-[1px] w-3/4 bg-white/10 mb-4"></div>

                      {/* Working Time */}
                      <div>
                        <p className="text-[10px] text-white/70 font-medium mb-1.5 tracking-wide">Working Time</p>
                        <p className="text-[16px] font-bold text-white leading-none tracking-wide">
                          {summary?.net_working_hours ? `${summary.net_working_hours.toString().split('.')[0].padStart(2, '0')}h ${summary.net_working_hours.toString().split('.')[1] ? Math.round(Number('0.'+summary.net_working_hours.toString().split('.')[1])*60) : '00'}m` : "00h 00m"}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* PUNCH BUTTON */}
                  <div>
                    <motion.button 
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handlePunchClick(isPunchedIn ? "Punch Out" : "Punch In")} 
                      disabled={uploading || locating}
                      className={`w-full bg-white rounded-[16px] h-[56px] font-black text-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex justify-center items-center gap-2 overflow-hidden transition-colors disabled:opacity-80 disabled:cursor-not-allowed ${isPunchedIn ? 'text-red-500' : 'text-[#4F6BFF]'}`}
                    >
                      {uploading || locating ? (
                         <Loader2 size={24} className="animate-spin text-current" />
                      ) : isPunchedIn ? (
                        <>
                          <LogOut size={22} strokeWidth={2.5} /> 
                          <span className="tracking-wide uppercase mt-0.5">Punch Out</span>
                        </>
                      ) : (
                        <>
                          <Fingerprint size={22} strokeWidth={2.5} /> 
                          <span className="tracking-wide uppercase mt-0.5">Punch In</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. QUICK ACTIONS */}
            <div className="mt-6 mb-4">
              <h3 className="text-[18px] font-[700] text-[#111827] dark:text-white mb-4 text-left tracking-tight">Quick Actions</h3>
              
              <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                {[
                  { id: 'attendance', icon: CalendarCheck, label: "Attendance", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", action: () => handleTabChange("attendance") },
                  { id: 'ot', icon: Clock, label: "Overtime", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400", action: () => handleTabChange("ot") },
                  { id: 'sunday', icon: Sun, label: "Sunday Work", color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400", action: () => handleTabChange("sunday") },
                  { id: 'jobs', icon: Clipboard, label: "My Jobs", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", action: () => handleTabChange("jobs") },
                  { id: 'leave', icon: Briefcase, label: "Leave", color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400", action: () => handleTabChange("leave") },
                  { id: 'notice', icon: Megaphone, label: "Notices", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400", action: () => handleTabChange("notice") },
                  { id: 'requests', icon: FileText, label: "Requests", color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400", action: () => setShowCorrectionModal(true) },
                  { id: 'more', icon: Grid, label: "More", color: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400", action: () => toast("More options coming soon") }
                ].map((item) => (
                  <motion.button 
                    key={item.id} 
                    whileTap={{ scale: 0.9 }} 
                    onClick={item.action} 
                    className="flex flex-col items-center justify-center gap-2 group cursor-pointer outline-none"
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

            {/* 3. TODAY'S SUMMARY */}
            <div className="mt-4 mb-4">
              <h3 className="text-[16px] sm:text-[18px] font-[700] text-[#111827] dark:text-white mb-3 text-left tracking-tight">Today's Summary</h3>
              
              <div className="w-full bg-white dark:bg-zinc-900 rounded-[22px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-zinc-800 p-4 sm:p-5 relative overflow-hidden flex items-center transition-colors">
                 {isDataLoading ? (
                   <div className="flex justify-between items-center w-full h-full">
                     <Skeleton className="w-16 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800" />
                     <Skeleton className="w-16 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800" />
                     <Skeleton className="w-16 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800" />
                     <Skeleton className="w-16 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800" />
                   </div>
                 ) : (
                   <div className="flex justify-between items-center w-full h-full">
                     
                     {/* Column 1: Punch In */}
                     <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-2 w-1/4">
                       <div className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                         <Fingerprint size={16} strokeWidth={2} className="text-[#00A843] dark:text-[#4ADE80]" />
                       </div>
                       <div className="flex flex-col overflow-hidden">
                         <span className="text-[9px] sm:text-[10px] font-[500] text-[#6B7280] dark:text-gray-400 leading-tight truncate">Punch In</span>
                         <span className="text-[10px] sm:text-[12px] font-[700] text-[#111827] dark:text-white whitespace-nowrap mt-0.5">
                           {summary?.punch_in ? format(parseISO(summary.punch_in), "hh:mm a") : "--:--"}
                         </span>
                       </div>
                     </div>
                     
                     <div className="w-px h-8 bg-gray-100 dark:bg-zinc-800 shrink-0"></div>
                     
                     {/* Column 2: Working Time */}
                     <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-2 w-1/4">
                       <div className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                         <Clock size={16} strokeWidth={2} className="text-[#4F6BFF] dark:text-[#60A5FA]" />
                       </div>
                       <div className="flex flex-col overflow-hidden">
                         <span className="text-[9px] sm:text-[10px] font-[500] text-[#6B7280] dark:text-gray-400 leading-tight truncate">Working Time</span>
                         <span className="text-[10px] sm:text-[12px] font-[700] text-[#111827] dark:text-white whitespace-nowrap mt-0.5">
                           {summary?.net_working_hours ? `${Math.floor(summary.net_working_hours).toString().padStart(2, '0')}h ${Math.round((summary.net_working_hours % 1) * 60).toString().padStart(2, '0')}m` : "00h 00m"}
                         </span>
                       </div>
                     </div>
                     
                     <div className="w-px h-8 bg-gray-100 dark:bg-zinc-800 shrink-0"></div>

                     {/* Column 3: OT (Today) */}
                     <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-2 w-1/4">
                       <div className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                         <Clock size={16} strokeWidth={2} className="text-[#FF9500] dark:text-[#FBBF24]" />
                       </div>
                       <div className="flex flex-col overflow-hidden">
                         <span className="text-[9px] sm:text-[10px] font-[500] text-[#6B7280] dark:text-gray-400 leading-tight truncate">OT (Today)</span>
                         <span className="text-[10px] sm:text-[12px] font-[700] text-[#111827] dark:text-white whitespace-nowrap mt-0.5">
                           {summary?.ot_hours ? `${Math.floor(summary.ot_hours).toString().padStart(2, '0')}h ${Math.round((summary.ot_hours % 1) * 60).toString().padStart(2, '0')}m` : "00h 00m"}
                         </span>
                       </div>
                     </div>
                     
                     <div className="w-px h-8 bg-gray-100 dark:bg-zinc-800 shrink-0"></div>

                     {/* Column 4: Break Time */}
                     <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-2 w-1/4">
                       <div className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                         <Coffee size={16} strokeWidth={2} className="text-[#AF52DE] dark:text-[#C084FC]" />
                       </div>
                       <div className="flex flex-col overflow-hidden">
                         <span className="text-[9px] sm:text-[10px] font-[500] text-[#6B7280] dark:text-gray-400 leading-tight truncate">Break Time</span>
                         <span className="text-[10px] sm:text-[12px] font-[700] text-[#111827] dark:text-white whitespace-nowrap mt-0.5">
                           {summary?.break_time ? `${Math.floor(summary.break_time).toString().padStart(2, '0')}h ${Math.round((summary.break_time % 1) * 60).toString().padStart(2, '0')}m` : "00h 00m"}
                         </span>
                       </div>
                     </div>
                     
                   </div>
                 )}
              </div>
            </div>

            {/* 4 & 5. ASSIGNED WORK & MONTH OVERVIEW GRID */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 mb-4">
              
              {/* ASSIGNED WORK */}
              <div className="bg-white dark:bg-zinc-900 rounded-[22px] border border-gray-100 dark:border-zinc-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5 flex flex-col transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[14px] sm:text-[16px] font-[700] text-[#111827] dark:text-white tracking-tight truncate pr-1">Assigned Work</h3>
                  <button className="text-[12px] font-[600] text-[#4F6BFF] shrink-0" onClick={() => handleTabChange("jobs")}>View All</button>
                </div>
                
                <div className="w-full h-[1px] bg-gray-50 dark:bg-zinc-800 mb-4"></div>
                 
                 {isDataLoading ? (
                    <Skeleton className="w-full h-[130px] rounded-[16px] bg-gray-50 dark:bg-zinc-800" />
                 ) : activeJobs.length === 0 ? (
                    <div className="w-full rounded-[16px] p-4 flex flex-col items-center justify-center min-h-[130px]">
                      <Clipboard size={28} className="text-gray-300 dark:text-gray-600 mb-2" strokeWidth={1.5} />
                      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 text-center">No work assigned</p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       {activeJobs?.slice(0,1).map((job: any) => (
                          <motion.div 
                            key={job.id} 
                            whileTap={{ scale: 0.98 }}
                            className="w-full min-h-[130px] flex flex-col justify-between cursor-pointer outline-none group"
                            onClick={() => handleTabChange("jobs")}
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2 bg-gray-50/50 dark:bg-zinc-800/50 p-2.5 rounded-[14px]">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-[10px] bg-[#E5EDFF] flex items-center justify-center shrink-0 shadow-sm">
                                  <Clipboard className="text-[#4F6BFF]" size={20} strokeWidth={2} />
                                </div>
                                <div>
                                  <p className="text-[14px] font-bold text-[#111827] dark:text-white">JOB-{job.id}</p>
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate max-w-[100px] sm:max-w-[120px]">Task: {job.vehicle_number || "Production"}</p>
                                </div>
                              </div>
                              <div className={`self-start px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider ${
                                job.status === 'completed' ? 'bg-green-100 text-green-700' :
                                job.status === 'in_progress' ? 'bg-[#E5F7ED] text-[#00A843]' :
                                job.status === 'pending' || job.status === 'assigned' ? 'bg-orange-100 text-orange-600' :
                                job.status === 'on_hold' ? 'bg-gray-100 text-gray-600' :
                                'bg-red-100 text-red-600'
                              }`}>
                                {job.status === 'in_progress' ? 'In Progress' : job.status.replace('_', ' ')}
                              </div>
                            </div>

                            <div className="flex justify-between items-end mb-2.5 px-1">
                              <div>
                                <p className="text-[11px] text-[#111827] dark:text-gray-300 font-medium mb-1">Target</p>
                                <p className="text-[15px] font-bold text-[#111827] dark:text-white leading-none">{job.target_quantity || 1}</p>
                              </div>
                              <div>
                                <p className="text-[11px] text-[#111827] dark:text-gray-300 font-medium mb-1">Completed</p>
                                <p className="text-[15px] font-bold text-[#111827] dark:text-white leading-none">{job.completed_quantity || 0}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 px-1">
                              <div className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-full h-[6px] overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(((job.completed_quantity || 0) / (job.target_quantity || 1)) * 100, 100)}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className="bg-[#4F6BFF] h-full rounded-full" 
                                />
                              </div>
                              <span className="text-[11px] font-bold text-[#111827] dark:text-white w-8 text-right tabular-nums">
                                {Math.round(Math.min(((job.completed_quantity || 0) / (job.target_quantity || 1)) * 100, 100))}%
                              </span>
                            </div>
                          </motion.div>
                       ))}
                    </div>
                 )}
              </div>

              {/* THIS MONTH OVERVIEW */}
              <div className="bg-white dark:bg-zinc-900 rounded-[22px] border border-gray-100 dark:border-zinc-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5 flex flex-col transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[14px] sm:text-[16px] font-[700] text-[#111827] dark:text-white tracking-tight truncate pr-1">This Month Overview</h3>
                  <button className="text-[12px] font-[600] text-[#4F6BFF] shrink-0">View All</button>
                </div>
                
                <div className="w-full h-[1px] bg-gray-50 dark:bg-zinc-800 mb-4"></div>
                
                {isDataLoading ? (
                  <Skeleton className="w-full h-[130px] rounded-[16px] bg-gray-50 dark:bg-zinc-800" />
                ) : (
                  <div className="w-full flex flex-col">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-zinc-800">
                      <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-[#00C853]"></div><span className="text-[12px] font-[500] text-[#4B5563] dark:text-gray-400">Present Days</span></div>
                      <span className="text-[13px] font-[700] text-[#111827] dark:text-white tabular-nums">{monthlySummary?.present_days || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-zinc-800">
                      <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-[#FF3B30]"></div><span className="text-[12px] font-[500] text-[#4B5563] dark:text-gray-400">Absent Days</span></div>
                      <span className="text-[13px] font-[700] text-[#111827] dark:text-white tabular-nums">{monthlySummary?.absent_days || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-zinc-800">
                      <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-[#FFCC00]"></div><span className="text-[12px] font-[500] text-[#4B5563] dark:text-gray-400">Leave Days</span></div>
                      <span className="text-[13px] font-[700] text-[#111827] dark:text-white tabular-nums">{monthlySummary?.leave_days || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-zinc-800">
                      <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-[#4F6BFF]"></div><span className="text-[12px] font-[500] text-[#4B5563] dark:text-gray-400">OT Hours</span></div>
                      <span className="text-[13px] font-[700] text-[#111827] dark:text-white tabular-nums">{monthlySummary?.total_ot_hours || 0}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-[#9C27B0]"></div><span className="text-[11px] font-[500] text-[#4B5563] dark:text-gray-400">Sundays</span></div>
                      <span className="text-[12px] font-[700] text-[#111827] dark:text-white tabular-nums">{monthlySummary?.sunday_worked || 0}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Spacer for floating button */}
            <div className="h-6"></div>

          </motion.div>
        )}

        {/* Attendance Tab (Detailed) */}
        {activeTab === "attendance" && (
           <WorkerAttendanceTab history={history} />
        )}
        
        {/* OT Tab */}
        {activeTab === "ot" && (
           <WorkerOTTab history={history} />
        )}

        {/* Sunday Work Tab */}
        {activeTab === "sunday" && (
           <WorkerSundayTab history={history} />
        )}

        {/* Leave Tab */}
        {activeTab === "leave" && (
           <WorkerLeaveTab leaveHistory={leaveHistory} isLoading={isLeavesLoading} onApplyLeave={() => setShowLeaveModal(true)} />
        )}

        {/* Notice Tab (Company-wide Announcements) */}
        {activeTab === "notice" && (
           <WorkerNoticeTab notifications={notifications.filter((n: any) => n.type === 'general' || n.module === 'notice')} title="Notice Board" emptyText="No new notices" icon="megaphone" />
        )}

        {/* Notifications Tab (Personal Alerts) */}
        {activeTab === "notifications" && (
           <WorkerNoticeTab notifications={notifications.filter((n: any) => n.type !== 'general' && n.module !== 'notice')} title="Your Notifications" emptyText="No recent notifications" icon="bell" />
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
           <motion.div initial={{opacity:0, y:10}} animate={{opacity:1,y:0}}>
             <WorkerJobs workerId={worker.worker_id} />
           </motion.div>
        )}
        
        {/* Profile Tab */}
        {activeTab === "profile" && (
           <WorkerProfileTab 
             worker={worker} 
             onLogout={onLogout} 
             getTranslation={getTranslation}
             langIndex={langIndex}
           />
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
           <WorkerSettingsTab />
        )}

        {/* Support Tab */}
        {activeTab === "support" && (
           <WorkerSupportTab />
        )}

      </motion.main>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800 pb-[env(safe-area-inset-bottom)] z-40 px-2 sm:px-4 h-[72px] transition-colors rounded-t-[24px]">
        <div className="flex justify-between items-center h-full max-w-md mx-auto relative px-1">
          
          <div className="flex justify-around flex-1 mr-8">
            {[
              { id: "home", icon: Home, label: getTranslation(langIndex, "Home") },
              { id: "jobs", icon: ClipboardList, label: getTranslation(langIndex, "My Jobs") }
            ].map((tab) => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id as any)} className="flex flex-col items-center justify-center w-14 outline-none relative">
                <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={`transition-colors ${activeTab === tab.id ? "text-[#4F6BFF]" : "text-gray-400 dark:text-gray-500"}`} />
                <span className={`text-[10px] mt-1 font-[600] transition-colors ${activeTab === tab.id ? "text-[#4F6BFF] font-[700]" : "text-gray-400 dark:text-gray-500"}`}>{tab.label}</span>
                {/* Selected Indicator */}
                {activeTab === tab.id && (
                  <motion.div layoutId="nav-indicator-left" className="absolute -bottom-3 w-1 h-1 rounded-full bg-[#4F6BFF]" />
                )}
              </button>
            ))}
          </div>

          {/* CENTER ACTION BUTTON */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 flex flex-col items-center justify-center pointer-events-none">
            <button 
              onClick={() => handlePunchClick(isPunchedIn ? "Punch Out" : "Punch In")}
              className={`w-[70px] h-[70px] rounded-full flex items-center justify-center text-white transition-transform active:scale-95 border-[4px] border-white dark:border-zinc-950 pointer-events-auto bg-gradient-to-r from-[#4F6BFF] to-[#5A43F2] shadow-[0_8px_24px_rgba(79,107,255,0.4)]`}
            >
              {isPunchedIn ? <LogOut size={34} strokeWidth={2} /> : <Fingerprint size={34} strokeWidth={2} />}
            </button>
            <span className="text-[11px] font-[700] text-[#111827] dark:text-gray-300 mt-1.5 pointer-events-auto">
              {getTranslation(langIndex, isPunchedIn ? "Punch Out" : "Punch In")}
            </span>
          </div>

          <div className="flex justify-around flex-1 ml-8">
            {[
              { id: "attendance", icon: CalendarIcon, label: getTranslation(langIndex, "Attendance") },
              { id: "profile", icon: UserCircle, label: getTranslation(langIndex, "Profile") }
            ].map((tab) => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id as any)} className="flex flex-col items-center justify-center w-14 outline-none relative">
                <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={`transition-colors ${activeTab === tab.id ? "text-[#4F6BFF]" : "text-gray-400 dark:text-gray-500"}`} />
                <span className={`text-[10px] mt-1 font-[600] transition-colors ${activeTab === tab.id ? "text-[#4F6BFF] font-[700]" : "text-gray-400 dark:text-gray-500"}`}>{tab.label}</span>
                {/* Selected Indicator */}
                {activeTab === tab.id && (
                  <motion.div layoutId="nav-indicator-right" className="absolute -bottom-3 w-1 h-1 rounded-full bg-[#4F6BFF]" />
                )}
              </button>
            ))}
          </div>

        </div>
      </nav>

      {/* Camera Modal (Polished) */}
      <AnimatePresence>
        {showCameraModal && (
          <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="px-5 py-5 flex items-center justify-between text-white bg-gradient-to-b from-black/60 to-transparent absolute top-0 left-0 right-0 z-30">
              <button onClick={() => setShowCameraModal(false)} className="p-2.5 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors ml-auto"><X size={20} /></button>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-black z-10">
              {!previewImage ? (
                <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1920 } }} className="absolute inset-0 w-full h-full object-cover" />
              ) : <img src={previewImage} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] p-6 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] pb-[calc(env(safe-area-inset-bottom)+24px)] flex flex-col animate-in slide-in-from-bottom-10">
              <div className="mb-5">
                 <p className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wider">Mark {punchAction}</p>
                 <p className="text-black text-sm font-bold flex items-center gap-2"><CalendarIcon size={14} className="text-blue-600"/> {format(currentTime, "d MMM, EEE | hh:mm a")}</p>
                 <div className="flex items-start gap-2 mt-2">
                   <MapPin size={14} className="text-red-500 mt-0.5 shrink-0" />
                   <p 
                     className="text-gray-600 text-[11px] leading-relaxed line-clamp-2 underline decoration-gray-300 underline-offset-2 cursor-pointer"
                     onClick={() => { if (!location || locationError) requestLocation(); }}
                   >
                     {locating ? "Fetching GPS..." : currentAddress}
                   </p>
                 </div>
              </div>
              {!previewImage ? (
                <Button onClick={handleCapture} className="w-full h-14 rounded-[14px] text-[16px] font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30">Take Photo & Continue</Button>
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setPreviewImage(null)} className="w-[30%] h-14 rounded-[14px] font-bold border-gray-300 text-gray-700 hover:bg-gray-50">Retake</Button>
                  <Button onClick={submitPunch} disabled={uploading} className="flex-1 h-14 rounded-[14px] text-[16px] font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30">{uploading ? <Loader2 className="animate-spin mx-auto" /> : 'Submit'}</Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ApplyLeaveModal 
        isOpen={showLeaveModal} 
        onClose={() => setShowLeaveModal(false)} 
        workerId={worker.worker_id || worker.id} 
      />

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
              <div className="p-6 bg-[#4F6BFF] text-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/50 overflow-hidden flex items-center justify-center shrink-0">
                    {worker.profile_photo_url ? (
                      <img src={worker.profile_photo_url} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-white text-xl">{worker.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-[18px] font-bold leading-tight">{worker.name}</h2>
                    <p className="text-[12px] text-white/80 mt-1">{worker.employee_id || worker.worker_id}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                <button onClick={() => { setShowSidebar(false); handleTabChange("profile"); }} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-gray-300 transition-colors w-full text-left">
                  <UserCircle size={22} className="text-blue-500" />
                  <span className="font-semibold">{getTranslation(langIndex, "My Profile")}</span>
                </button>
                <button onClick={() => { setShowSidebar(false); handleTabChange("attendance"); }} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-gray-300 transition-colors w-full text-left">
                  <CalendarCheck size={22} className="text-purple-500" />
                  <span className="font-semibold">{getTranslation(langIndex, "Attendance History")}</span>
                </button>
                <button onClick={() => { setShowSidebar(false); handleTabChange("settings"); }} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-gray-300 transition-colors w-full text-left">
                  <Grid size={22} className="text-orange-500" />
                  <span className="font-semibold">{getTranslation(langIndex, "App Settings")}</span>
                </button>
                <button onClick={() => { setShowSidebar(false); handleTabChange("support"); }} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-gray-300 transition-colors w-full text-left">
                  <MessageSquare size={22} className="text-teal-500" />
                  <span className="font-semibold">{getTranslation(langIndex, "Help & Support")}</span>
                </button>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
                <button onClick={() => { setShowSidebar(false); onLogout(); }} className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors w-full font-bold">
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
