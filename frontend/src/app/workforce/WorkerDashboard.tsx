"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { format, parseISO } from "date-fns";
import Webcam from "react-webcam";
import { 
  MapPin, Clock, Fingerprint, Calendar as CalendarIcon, 
  AlertCircle, CheckCircle2, LogOut, RotateCcw, CloudUpload, History, FileText,
  MessageSquareWarning, X, Plus, UserCircle, Bell,
  File, Settings, Phone, Building, Briefcase, Download, QrCode,
  ChevronRight, ArrowRight, Activity, Loader2,
  Wifi, WifiOff, Camera, MapPinOff, UserCheck, ShieldCheck, Grid, CalendarCheck, HelpCircle, Menu,
  Sun, Clipboard, Megaphone, Coffee, Home
} from "lucide-react";
import { motion, AnimatePresence, useAnimation } from "motion/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { WorkerJobs } from "./WorkerJobs";
import { attendanceApi, jobsApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductionJob } from "@/types";

// Geofence constants
const COMPANY_LAT = 28.4736262;
const COMPANY_LNG = 77.2918577;
const RADIUS_METERS = 200;

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
  return Math.floor(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

const compressImage = (base64: string, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxWidth = 1080;
      const scale = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
  });
};

const dataURLtoBlob = (dataurl: string) => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--){ u8arr[n] = bstr.charCodeAt(n); }
  return new Blob([u8arr], {type:mime});
};

export function WorkerDashboard({ worker, onLogout, setWorker }: { worker: any, onLogout: () => void, setWorker: (w:any)=>void }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Navigation
  const [activeTab, setActiveTab] = useState<"home" | "attendance" | "jobs" | "profile">("home");
  const [isOnline, setIsOnline] = useState(true);
  
  // Data State
  const [location, setLocation] = useState<{lat: number, lng: number, accuracy: number} | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeJobs, setActiveJobs] = useState<ProductionJob[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [punchAction, setPunchAction] = useState<"Punch In" | "Punch Out">("Punch In");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);

  const fetchData = useCallback(async () => {
    if (!worker) return;
    try {
      const [summ, hist, monthSumm, jobs] = await Promise.all([
        attendanceApi.getWorkerSummary(worker.worker_id),
        attendanceApi.getWorkerHistory(worker.worker_id),
        attendanceApi.getWorkerMonthlySummary(worker.worker_id, format(new Date(), "yyyy-MM")),
        jobsApi.getWorkerJobs(worker.worker_id)
      ]);
      setSummary(summ);
      setHistory(hist);
      setMonthlySummary(monthSumm);
      setActiveJobs(jobs || []);
      
      // Simulate notifications for UX polish
      setNotifications([
        { id: 1, title: "Payslip Generated", body: "Your payslip for last month is ready.", time: "2h ago", unread: true, type: 'payroll' },
        { id: 2, title: "Leave Approved", body: "Your leave request has been approved.", time: "1d ago", unread: false, type: 'leave' },
        { id: 3, title: "System Maintenance", body: "App will be down for 15 mins tonight.", time: "2d ago", unread: false, type: 'general' }
      ]);
    } catch (e) {
      console.error(e);
    }
  }, [worker]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchData]);

  const requestLocation = useCallback(() => {
    setLocating(true);
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({ lat: latitude, lng: longitude, accuracy });
        setDistance(getDistanceInMeters(latitude, longitude, COMPANY_LAT, COMPANY_LNG));
        setLocating(false);
      },
      (error) => {
        setLocationError("GPS Denied");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => { if (worker) requestLocation(); }, [worker, requestLocation]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handlePunchClick = (action: "Punch In" | "Punch Out") => {
    if (distance === null || distance > RADIUS_METERS) {
      toast.warning("You appear to be outside the geofence.");
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
      fetchData();
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
      fetchData();
    }
    setSyncing(false);
  }, [fetchData]);

  useEffect(() => {
    window.addEventListener("online", processQueue);
    return () => window.removeEventListener("online", processQueue);
  }, [processQueue]);

  if (!worker) return null;
  const pendingQueueCount = (typeof window !== "undefined") ? JSON.parse(localStorage.getItem("attendance_queue") || "[]").length : 0;
  const isPunchedIn = summary?.punch_in && !summary?.punch_out;
  const isDataLoading = !summary || !monthlySummary;

  const currentJob = activeJobs.find(j => j.status === 'in_progress' || j.status === 'assigned');

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-24 text-zinc-900 font-sans selection:bg-blue-200">
      
      {/* Enterprise Mobile Header */}
      <header className="fixed top-0 left-0 right-0 bg-white px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2.5 z-40 border-b border-gray-100 flex items-center justify-between">
        
        {/* LEFT SECTION: Hamburger Menu */}
        <div className="flex-shrink-0">
          <button className="p-1.5 -ml-1.5 rounded-full text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center">
             <Menu size={22} strokeWidth={2} />
          </button>
        </div>

        {/* CENTER SECTION: Greeting & Info */}
        <div className="flex-1 px-3 text-left overflow-hidden">
          <h1 className="text-[17px] font-[700] leading-tight text-[#111827] mb-1 truncate">
            {getGreeting()}, {worker.name.split(' ')[0]} 👋
          </h1>
          <p className="text-[12px] font-[500] text-[#6B7280] leading-none truncate mt-0.5">
            ID: {worker.employee_id || worker.worker_id} • {worker.shift_name || "General Shift"}
          </p>
        </div>

        {/* RIGHT SECTION: Notifications & Profile */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button className="relative p-1.5 rounded-full text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center">
            <Bell size={22} strokeWidth={2} />
            {notifications.filter(n => n.unread).length > 0 && (
              <span className="absolute top-1 right-1.5 bg-red-600 text-white text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white box-content">
                {notifications.filter(n => n.unread).length > 99 ? '99+' : notifications.filter(n => n.unread).length}
              </span>
            )}
          </button>
          
          <button className="relative ml-1 flex items-center justify-center" onClick={() => setActiveTab("profile")}>
            <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0 border border-gray-200">
              {worker.profile_photo_url ? <img src={worker.profile_photo_url} className="w-full h-full object-cover" /> : <span className="font-bold text-gray-500 text-sm">{worker.name.charAt(0)}</span>}
            </div>
            {/* Online Indicator */}
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-[1.5px] border-white rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
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
            <div className="rounded-[24px] p-4 sm:p-5 shadow-[0_8px_30px_rgba(79,107,255,0.15)] relative overflow-hidden bg-gradient-to-br from-[#4F6BFF] to-[#5A43F2] text-white w-full min-h-[180px] flex flex-col justify-between border border-white/10">
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
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-1.5">
                           <MapPin size={12} className="text-white/80" />
                           <span className="text-[10px] font-medium text-white/90">Location Verified</span>
                           <CheckCircle2 size={14} className={locationError ? "text-white/30" : "fill-[#4ADE80] text-[#4F6BFF]"} />
                         </div>
                         <div className="flex items-center gap-1.5">
                           <Camera size={12} className="text-white/80" />
                           <span className="text-[10px] font-medium text-white/90">Selfie Verified</span>
                           <CheckCircle2 size={14} className="fill-[#4ADE80] text-[#4F6BFF]" />
                         </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="pl-4 flex flex-col justify-start">
                      
                      {/* Shift Time */}
                      <div className="mb-4 mt-2">
                        <p className="text-[10px] text-white/70 font-medium mb-1.5 tracking-wide">Shift Time</p>
                        <p className="text-[11px] font-bold text-white tracking-wide leading-tight">
                          09:00 AM - 06:00 PM
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
              <h3 className="text-[18px] font-[700] text-[#111827] mb-4 text-left tracking-tight">Quick Actions</h3>
              
              <div className="grid grid-cols-4 gap-x-4 gap-y-[18px]">
                {[
                  { id: 'attendance', icon: CalendarCheck, label: "Attendance", color: "text-blue-500", action: () => setActiveTab("attendance") },
                  { id: 'ot', icon: Clock, label: "Overtime (OT)", color: "text-orange-500", action: () => toast("OT Feature coming soon") },
                  { id: 'sunday', icon: Sun, label: "Sunday Work", color: "text-yellow-500", action: () => toast("Sunday Work Feature coming soon") },
                  { id: 'jobs', icon: Clipboard, label: "My Jobs", color: "text-blue-500", action: () => setActiveTab("jobs") },
                  { id: 'leave', icon: Briefcase, label: "Leave", color: "text-green-500", action: () => setShowLeaveModal(true) },
                  { id: 'notice', icon: Megaphone, label: "Notice Board", color: "text-purple-500", action: () => toast("Checking notices..."), hasBadge: true },
                  { id: 'requests', icon: FileText, label: "My Requests", color: "text-teal-500", action: () => setShowCorrectionModal(true) },
                  { id: 'more', icon: Grid, label: "More", color: "text-gray-500", action: () => toast("More options coming soon") }
                ].map((item) => (
                  <motion.button 
                    key={item.id} 
                    whileTap={{ scale: 0.95 }} 
                    onClick={item.action} 
                    className="w-full py-4 px-1 bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center active:bg-gray-50 transition-colors relative outline-none"
                  >
                    <div className="relative flex items-center justify-center">
                      <item.icon size={26} strokeWidth={2} className={item.color} />
                      {item.hasBadge && notifications.filter(n => n.unread).length > 0 && (
                        <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white box-content">
                          {notifications.filter(n => n.unread).length > 99 ? '99+' : notifications.filter(n => n.unread).length}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-[600] text-[#374151] mt-2.5 text-center leading-tight tracking-tight w-full break-words px-1">{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 3. TODAY'S SUMMARY */}
            <div className="mt-4 mb-4">
              <h3 className="text-[16px] sm:text-[18px] font-[700] text-[#111827] mb-3 text-left tracking-tight">Today's Summary</h3>
              
              <div className="w-full bg-white rounded-[22px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 p-4 sm:p-5 relative overflow-hidden flex items-center">
                 {isDataLoading ? (
                   <div className="flex justify-between items-center w-full h-full">
                     <Skeleton className="w-16 h-12 rounded-xl bg-gray-100" />
                     <Skeleton className="w-16 h-12 rounded-xl bg-gray-100" />
                     <Skeleton className="w-16 h-12 rounded-xl bg-gray-100" />
                     <Skeleton className="w-16 h-12 rounded-xl bg-gray-100" />
                   </div>
                 ) : (
                   <div className="flex justify-between items-center w-full h-full">
                     
                     {/* Column 1: Punch In */}
                     <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-2 w-1/4">
                       <div className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-full bg-green-50 flex items-center justify-center shrink-0">
                         <Fingerprint size={16} strokeWidth={2} className="text-[#00A843]" />
                       </div>
                       <div className="flex flex-col overflow-hidden">
                         <span className="text-[9px] sm:text-[10px] font-[500] text-[#6B7280] leading-tight truncate">Punch In</span>
                         <span className="text-[11px] sm:text-[14px] font-[700] text-[#111827] whitespace-nowrap mt-0.5">
                           {summary?.punch_in ? format(parseISO(summary.punch_in), "hh:mm a") : "--:--"}
                         </span>
                       </div>
                     </div>
                     
                     <div className="w-px h-8 bg-gray-100 shrink-0"></div>
                     
                     {/* Column 2: Working Time */}
                     <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-2 w-1/4">
                       <div className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                         <Clock size={16} strokeWidth={2} className="text-[#4F6BFF]" />
                       </div>
                       <div className="flex flex-col overflow-hidden">
                         <span className="text-[9px] sm:text-[10px] font-[500] text-[#6B7280] leading-tight truncate">Working Time</span>
                         <span className="text-[11px] sm:text-[14px] font-[700] text-[#111827] whitespace-nowrap mt-0.5">
                           {summary?.net_working_hours ? `${Math.floor(summary.net_working_hours).toString().padStart(2, '0')}h ${Math.round((summary.net_working_hours % 1) * 60).toString().padStart(2, '0')}m` : "00h 00m"}
                         </span>
                       </div>
                     </div>
                     
                     <div className="w-px h-8 bg-gray-100 shrink-0"></div>

                     {/* Column 3: OT (Today) */}
                     <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-2 w-1/4">
                       <div className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                         <Clock size={16} strokeWidth={2} className="text-[#FF9500]" />
                       </div>
                       <div className="flex flex-col overflow-hidden">
                         <span className="text-[9px] sm:text-[10px] font-[500] text-[#6B7280] leading-tight truncate">OT (Today)</span>
                         <span className="text-[11px] sm:text-[14px] font-[700] text-[#111827] whitespace-nowrap mt-0.5">
                           {summary?.ot_hours ? `${Math.floor(summary.ot_hours).toString().padStart(2, '0')}h ${Math.round((summary.ot_hours % 1) * 60).toString().padStart(2, '0')}m` : "00h 00m"}
                         </span>
                       </div>
                     </div>
                     
                     <div className="w-px h-8 bg-gray-100 shrink-0"></div>

                     {/* Column 4: Break Time */}
                     <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-2 w-1/4">
                       <div className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                         <Coffee size={16} strokeWidth={2} className="text-[#AF52DE]" />
                       </div>
                       <div className="flex flex-col overflow-hidden">
                         <span className="text-[9px] sm:text-[10px] font-[500] text-[#6B7280] leading-tight truncate">Break Time</span>
                         <span className="text-[11px] sm:text-[14px] font-[700] text-[#111827] whitespace-nowrap mt-0.5">
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
              <div className="bg-white rounded-[22px] border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[14px] sm:text-[16px] font-[700] text-[#111827] tracking-tight truncate pr-1">Assigned Work</h3>
                  <button className="text-[12px] font-[600] text-[#4F6BFF] shrink-0" onClick={() => setActiveTab("jobs")}>View All</button>
                </div>
                
                <div className="w-full h-[1px] bg-gray-50 mb-4"></div>
                 
                 {isDataLoading ? (
                    <Skeleton className="w-full h-[130px] rounded-[16px] bg-gray-50" />
                 ) : activeJobs.length === 0 ? (
                    <div className="w-full rounded-[16px] p-4 flex flex-col items-center justify-center min-h-[130px]">
                      <Clipboard size={28} className="text-gray-300 mb-2" strokeWidth={1.5} />
                      <p className="text-[11px] font-medium text-gray-500 text-center">No work assigned</p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       {activeJobs.slice(0,1).map(job => (
                          <motion.div 
                            key={job.id} 
                            whileTap={{ scale: 0.98 }}
                            className="w-full min-h-[130px] flex flex-col justify-between cursor-pointer outline-none group"
                            onClick={() => setActiveTab("jobs")}
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2 bg-gray-50/50 p-2.5 rounded-[14px]">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-[10px] bg-[#E5EDFF] flex items-center justify-center shrink-0 shadow-sm">
                                  <Clipboard className="text-[#4F6BFF]" size={20} strokeWidth={2} />
                                </div>
                                <div>
                                  <p className="text-[14px] font-bold text-[#111827]">JOB-{job.id}</p>
                                  <p className="text-[11px] text-gray-500 font-medium truncate max-w-[100px] sm:max-w-[120px]">Task: {job.vehicle_number || "Production"}</p>
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
                                <p className="text-[11px] text-[#111827] font-medium mb-1">Target</p>
                                <p className="text-[15px] font-bold text-[#111827] leading-none">{job.target_quantity || 1}</p>
                              </div>
                              <div>
                                <p className="text-[11px] text-[#111827] font-medium mb-1">Completed</p>
                                <p className="text-[15px] font-bold text-[#111827] leading-none">{job.completed_quantity || 0}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 px-1">
                              <div className="flex-1 bg-gray-100 rounded-full h-[6px] overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(((job.completed_quantity || 0) / (job.target_quantity || 1)) * 100, 100)}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className="bg-[#4F6BFF] h-full rounded-full" 
                                />
                              </div>
                              <span className="text-[11px] font-bold text-[#111827] w-8 text-right tabular-nums">
                                {Math.round(Math.min(((job.completed_quantity || 0) / (job.target_quantity || 1)) * 100, 100))}%
                              </span>
                            </div>
                          </motion.div>
                       ))}
                    </div>
                 )}
              </div>

              {/* THIS MONTH OVERVIEW */}
              <div className="bg-white rounded-[22px] border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[14px] sm:text-[16px] font-[700] text-[#111827] tracking-tight truncate pr-1">This Month Overview</h3>
                  <button className="text-[12px] font-[600] text-[#4F6BFF] shrink-0">View All</button>
                </div>
                
                <div className="w-full h-[1px] bg-gray-50 mb-4"></div>
                
                {isDataLoading ? (
                  <Skeleton className="w-full h-[130px] rounded-[16px] bg-gray-50" />
                ) : (
                  <div className="w-full flex flex-col">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-[#00C853]"></div><span className="text-[12px] font-[500] text-[#4B5563]">Present Days</span></div>
                      <span className="text-[13px] font-[700] text-[#111827] tabular-nums">{monthlySummary?.present_days || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-[#FF3B30]"></div><span className="text-[12px] font-[500] text-[#4B5563]">Absent Days</span></div>
                      <span className="text-[13px] font-[700] text-[#111827] tabular-nums">{monthlySummary?.absent_days || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-[#FFCC00]"></div><span className="text-[12px] font-[500] text-[#4B5563]">Leave Days</span></div>
                      <span className="text-[13px] font-[700] text-[#111827] tabular-nums">{monthlySummary?.leave_days || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-[#4F6BFF]"></div><span className="text-[12px] font-[500] text-[#4B5563]">OT Hours</span></div>
                      <span className="text-[13px] font-[700] text-[#111827] tabular-nums">{monthlySummary?.ot_hours ? `${Math.floor(monthlySummary.ot_hours)}h ${Math.round((monthlySummary.ot_hours%1)*60)}m` : '0h 0m'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-[#9C27B0]"></div><span className="text-[12px] font-[500] text-[#4B5563]">Sunday Worked</span></div>
                      <span className="text-[13px] font-[700] text-[#111827] tabular-nums">{monthlySummary?.sunday_worked || 0} Days</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 6. RECENT NOTIFICATIONS */}
            <div className="mb-6 mt-6">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-[18px] sm:text-[22px] font-[700] text-[#111827] tracking-tight">Recent Notifications</h3>
                 <button className="text-[14px] font-[600] text-[#4F6BFF]" onClick={() => toast("Opening full notifications...")}>View All</button>
               </div>
               
               <div className="space-y-[12px]">
                  {notifications.length === 0 ? (
                     <div className="w-full bg-white rounded-[18px] border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 flex flex-col items-center justify-center min-h-[72px]">
                       <Bell className="text-gray-300 mb-3" size={32} />
                       <p className="text-[14px] font-medium text-gray-500">No recent notifications</p>
                     </div>
                  ) : (
                     notifications.slice(0, 5).map((notif, idx) => {
                        let iconColor = "text-gray-500";
                        let bgColor = "bg-gray-100";
                        let Icon = Bell;
                        const type = notif.type || 'general';

                        if (type === 'attendance') { iconColor = "text-[#4F6BFF]"; bgColor = "bg-[#E5EDFF]"; Icon = CalendarCheck; }
                        else if (type === 'payroll') { iconColor = "text-[#00C853]"; bgColor = "bg-[#E5F7ED]"; Icon = FileText; }
                        else if (type === 'leave') { iconColor = "text-[#FF9500]"; bgColor = "bg-orange-50"; Icon = Briefcase; }
                        else if (type === 'production') { iconColor = "text-[#9C27B0]"; bgColor = "bg-purple-50"; Icon = Clipboard; }

                        return (
                           <motion.div 
                             key={notif.id}
                             initial={{ opacity: 0, x: 20 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: idx * 0.1 }}
                             whileTap={{ scale: 0.98 }}
                             onClick={() => {
                                if (type === 'attendance') setActiveTab('attendance');
                                else if (type === 'leave') setShowLeaveModal(true);
                                else if (type === 'production') setActiveTab('jobs');
                             }}
                             className="w-full bg-white rounded-[18px] border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 flex gap-4 items-center cursor-pointer min-h-[72px] relative overflow-hidden active:bg-gray-50"
                           >
                              <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 ${bgColor}`}>
                                 <Icon size={20} className={iconColor} strokeWidth={2} />
                              </div>
                              <div className="flex-1 flex flex-col justify-center min-w-0">
                                 <h4 className="text-[16px] font-[700] text-[#111827] truncate leading-tight mb-1">{notif.title}</h4>
                                 <p className="text-[13px] text-[#6B7280] line-clamp-2 leading-tight">{notif.body}</p>
                              </div>
                              <div className="flex flex-col items-end justify-start h-full shrink-0">
                                 <span className="text-[12px] text-[#9CA3AF] mb-1.5">{notif.time}</span>
                                 {notif.unread && (
                                    <motion.div 
                                      animate={{ scale: [1, 1.2, 1] }} 
                                      transition={{ repeat: Infinity, duration: 2 }} 
                                      className="w-2.5 h-2.5 rounded-full bg-[#4F6BFF]" 
                                    />
                                 )}
                              </div>
                           </motion.div>
                        )
                     })
                  )}
               </div>
            </div>
            
            {/* Spacer for floating button */}
            <div className="h-6"></div>

          </motion.div>
        )}

        {/* Attendance Tab (Detailed) */}
        {activeTab === "attendance" && (
           <motion.div initial={{opacity:0, y:10}} animate={{opacity:1,y:0}} className="space-y-4">
              <h2 className="text-xl font-black px-1">Attendance Details</h2>
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-zinc-200">
                <p className="text-sm font-semibold text-zinc-500 mb-4">Past 30 Days</p>
                <div className="space-y-3">
                  {history.map((record: any) => (
                    <div key={record.id} className="flex justify-between items-center p-3 border border-zinc-100 rounded-xl bg-zinc-50/50">
                      <div>
                        <p className="font-bold text-sm text-zinc-900">{format(parseISO(record.date), "MMM dd, yyyy")}</p>
                        <p className="text-xs text-zinc-500 font-medium mt-0.5">In: {record.punch_in ? format(parseISO(record.punch_in), "HH:mm") : "--"} • Out: {record.punch_out ? format(parseISO(record.punch_out), "HH:mm") : "--"}</p>
                      </div>
                      <div className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                        record.status === 'Present' ? 'bg-green-100 text-green-700' : 
                        record.status === 'Absent' ? 'bg-red-100 text-red-700' : 
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {record.status}
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && <p className="text-center text-zinc-500 text-xs py-4">No records found.</p>}
                </div>
              </div>
           </motion.div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
           <motion.div initial={{opacity:0, y:10}} animate={{opacity:1,y:0}}>
             <WorkerJobs workerId={worker.worker_id} />
           </motion.div>
        )}
        
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1,y:0}} className="space-y-4">
             <div className="bg-white rounded-[24px] p-6 shadow-sm border border-zinc-200 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-zinc-800 to-zinc-900"></div>
                
                <div className="w-24 h-24 rounded-[32px] bg-white overflow-hidden mb-4 border-4 border-white shadow-md relative z-10 mt-6">
                   {worker.profile_photo_url ? <img src={worker.profile_photo_url} className="w-full h-full object-cover" /> : <UserCircle size={88} className="text-zinc-300 mx-auto mt-1" />}
                </div>
                <h2 className="text-[20px] font-black text-zinc-900 tracking-tight">{worker.name}</h2>
                <p className="text-[12px] font-bold text-blue-600 mb-6 bg-blue-50 px-3 py-1 rounded-lg mt-2">{worker.designation || "Operator"} • {worker.department || "Production"}</p>
                
                <div className="w-full space-y-2 mb-8 text-left">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
                    <Phone size={16} className="text-zinc-400" /> <span className="text-[13px] font-bold text-zinc-700">{worker.mobile_number}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
                    <FileText size={16} className="text-zinc-400" /> <span className="text-[13px] font-bold text-zinc-700">Aadhar: {worker.aadhar_number || "Not Provided"}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full rounded-xl font-bold h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onLogout}>
                  <LogOut size={16} className="mr-2" /> Sign Out
                </Button>
             </div>
          </motion.div>
        )}

      </motion.main>

      {/* 7. BOTTOM NAVIGATION (Premium Floating Style) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] px-6 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] h-[78px] safe-area-bottom">
        <div className="flex justify-between items-center h-full relative">
          
          {/* LEFT MENU */}
          <div className="flex justify-between w-[35%]">
            {[
              { id: "home", icon: Home, label: "Home" },
              { id: "jobs", icon: Clipboard, label: "My Jobs" }
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className="flex flex-col items-center justify-center w-14 outline-none relative">
                <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={`transition-colors ${activeTab === tab.id ? "text-[#4F6BFF]" : "text-gray-400"}`} />
                <span className={`text-[10px] mt-1 font-[600] transition-colors ${activeTab === tab.id ? "text-[#4F6BFF] font-[700]" : "text-gray-400"}`}>{tab.label}</span>
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
              className={`w-[70px] h-[70px] rounded-full flex items-center justify-center text-white transition-transform active:scale-95 border-[4px] border-white pointer-events-auto bg-gradient-to-r from-[#4F6BFF] to-[#5A43F2] shadow-[0_8px_24px_rgba(79,107,255,0.4)]`}
            >
              {isPunchedIn ? <LogOut size={34} strokeWidth={2} /> : <Fingerprint size={34} strokeWidth={2} />}
            </button>
            <span className="text-[11px] font-[700] text-[#111827] mt-1.5 pointer-events-auto">
              {isPunchedIn ? "Punch Out" : "Punch In"}
            </span>
          </div>

          {/* RIGHT MENU */}
          <div className="flex justify-between w-[35%]">
            {[
              { id: "attendance", icon: CalendarIcon, label: "Attendance" },
              { id: "profile", icon: UserCircle, label: "Profile" }
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className="flex flex-col items-center justify-center w-14 outline-none relative">
                <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={`transition-colors ${activeTab === tab.id ? "text-[#4F6BFF]" : "text-gray-400"}`} />
                <span className={`text-[10px] mt-1 font-[600] transition-colors ${activeTab === tab.id ? "text-[#4F6BFF] font-[700]" : "text-gray-400"}`}>{tab.label}</span>
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
          <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed inset-0 z-50 bg-[#09090B] flex flex-col">
            <div className="px-5 py-5 flex items-center justify-between text-white bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-20">
              <h2 className="font-bold text-lg drop-shadow-md">{punchAction}</h2>
              <button onClick={() => setShowCameraModal(false)} className="p-2.5 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden bg-black">
              {!previewImage ? (
                <>
                  <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "user", width: 720, height: 1280 }} className="min-h-full min-w-full object-cover" />
                  {/* Face Guide Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[280px] h-[380px] border-2 border-white/40 rounded-[140px] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] flex items-center justify-center relative">
                      <div className="absolute -top-10 text-white/80 text-sm font-semibold tracking-wide bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">Position face in oval</div>
                    </div>
                  </div>
                </>
              ) : <img src={previewImage} className="h-full w-full object-cover" alt="Preview" />}
            </div>
            <div className="p-6 bg-[#09090B] flex gap-4 z-20 pb-10 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] relative">
              {!previewImage ? (
                <Button onClick={handleCapture} className="w-full h-16 rounded-[2rem] text-lg font-black bg-white text-black hover:bg-zinc-200 shadow-xl" size="lg">Take Photo</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setPreviewImage(null)} className="flex-1 h-16 rounded-[2rem] text-lg font-bold border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800"><RotateCcw size={20} className="mr-2"/> Retake</Button>
                  <Button onClick={submitPunch} disabled={uploading} className="flex-1 h-16 rounded-[2rem] text-lg font-black bg-blue-600 text-white hover:bg-blue-700 border-0 shadow-lg shadow-blue-900/50">{uploading ? <Loader2 className="animate-spin" /> : `Submit`}</Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
