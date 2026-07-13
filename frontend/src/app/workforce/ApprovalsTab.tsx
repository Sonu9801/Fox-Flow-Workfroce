import React, { useState } from "react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi, vehiclesApi, qualityApi, leaveApi } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, Clock, ShieldCheck, FileSignature, AlertCircle, Camera, Check, X, Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function ApprovalsTab({ activeUser }: { activeUser: any }) {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<"completion" | "progress" | "leaves" | "corrections">("completion");

  // Fetch pending leaves
  const { data: leaves = [] } = useQuery({
    queryKey: ["leaves"],
    queryFn: () => leaveApi.getAll(),
  });

  // Fetch pending attendance corrections
  const { data: exceptions = [] } = useQuery({
    queryKey: ["attendanceExceptions"],
    queryFn: () => attendanceApi.getExceptions(),
  });

  // Fetch vehicles (for completion photos)
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehiclesApi.getAll(),
  });

  // Fetch quality (for progress photos)
  const { data: qualityRecords = [] } = useQuery({
    queryKey: ["qualityRecords"],
    queryFn: () => qualityApi.getAll(),
  });

  // Derived pending lists (filtered by supervisor department if applicable)
  const pendingLeaves = leaves.filter((l: any) => l.status === "Pending");
  const pendingCorrections = exceptions.filter((e: any) => e.status === "pending" || e.status === "Pending");
  const pendingCompletion = vehicles.filter((v: any) => v.verification_status === "pending" && v.current_stage !== "oem");
  const pendingProgress = qualityRecords.filter((q: any) => q.status === "pending" || q.status === "Pending");

  const totalPending = pendingLeaves.length + pendingCorrections.length + pendingCompletion.length + pendingProgress.length;

  // Mutations
  const approveLeave = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => leaveApi.updateStatus(id, { status }),
    onSuccess: () => {
      toast.success("Leave request processed");
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceAnalytics"] });
    },
    onError: () => toast.error("Failed to process leave")
  });

  const approveCorrection = useMutation({
    mutationFn: ({ id, reason }: { id: number, reason: string }) => attendanceApi.approveException(id, reason),
    onSuccess: () => {
      toast.success("Correction approved");
      queryClient.invalidateQueries({ queryKey: ["attendanceExceptions"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceAnalytics"] });
    },
    onError: () => toast.error("Failed to approve correction")
  });

  const verifyVehicle = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => vehiclesApi.verify(id, data),
    onSuccess: () => {
      toast.success("Vehicle verification processed");
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: () => toast.error("Failed to process verification")
  });

  const updateQuality = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => qualityApi.updateDefectStatus(id, status),
    onSuccess: () => {
      toast.success("Quality record updated");
      queryClient.invalidateQueries({ queryKey: ["qualityRecords"] });
    },
    onError: () => toast.error("Failed to process quality record")
  });

  return (
    <div className="p-4 space-y-6 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ShieldCheck className="text-indigo-600" size={28} />
          Approval Center
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage all pending reviews in one place.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-800/30">
          <p className="text-orange-600 dark:text-orange-400 text-2xl font-black">{totalPending}</p>
          <p className="text-[10px] font-bold text-orange-700 uppercase mt-1">Pending Review</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800/30">
          <p className="text-green-600 dark:text-green-400 text-2xl font-black">0</p>
          <p className="text-[10px] font-bold text-green-700 uppercase mt-1">Approved Today</p>
        </div>
      </div>

      {/* Horizontal Scroll Sub-Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x">
        {[
          { id: "completion", label: "Completion", icon: Camera, count: pendingCompletion.length },
          { id: "progress", label: "Progress", icon: AlertCircle, count: pendingProgress.length },
          { id: "leaves", label: "Leaves", icon: FileSignature, count: pendingLeaves.length },
          { id: "corrections", label: "Corrections", icon: Clock, count: pendingCorrections.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`snap-center shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all border ${
              activeSubTab === tab.id 
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20" 
                : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-800"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeSubTab === tab.id ? "bg-white/20 text-white" : "bg-orange-100 text-orange-600"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* COMPLETION PHOTOS */}
          {activeSubTab === "completion" && (
            pendingCompletion.length === 0 ? (
              <EmptyState title="No pending completion photos" />
            ) : (
              pendingCompletion.map((v: any) => (
                <div key={v.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{v.platform_number || v.tracking_id}</h3>
                      <p className="text-xs text-gray-500">{v.vehicle_number} • {v.oem_name}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">{v.current_stage}</Badge>
                  </div>
                  {v.arrival_photos && (
                    <div className="w-full h-32 bg-gray-100 dark:bg-zinc-800 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                      {/* Usually this would map through a JSON array of image URLs */}
                      <img src="/placeholder-photo.jpg" alt="Proof" className="w-full h-full object-cover opacity-50" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                      <div className="hidden text-gray-400 text-xs flex flex-col items-center gap-1"><Camera size={20} /> Photo attached</div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700" 
                      onClick={() => verifyVehicle.mutate({ id: v.id, data: { action: "approve", remarks: "Approved by supervisor" } })}
                    >
                      <Check size={16} className="mr-1" /> Approve
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => verifyVehicle.mutate({ id: v.id, data: { action: "reject", remarks: "Rejected by supervisor" } })}
                    >
                      <X size={16} className="mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))
            )
          )}

          {/* PROGRESS PHOTOS */}
          {activeSubTab === "progress" && (
            pendingProgress.length === 0 ? (
              <EmptyState title="No pending progress reviews" />
            ) : (
              pendingProgress.map((q: any) => (
                <div key={q.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                  <h3 className="font-bold text-md">{q.title || `Quality Check #${q.id}`}</h3>
                  <p className="text-xs text-gray-500 mb-4">{q.description || "Progress check requires review."}</p>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700" 
                      onClick={() => updateQuality.mutate({ id: q.id, status: "Resolved" })}
                    >
                      <Check size={16} className="mr-1" /> Approve
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => updateQuality.mutate({ id: q.id, status: "Rejected" })}
                    >
                      <X size={16} className="mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))
            )
          )}

          {/* LEAVE REQUESTS */}
          {activeSubTab === "leaves" && (
            pendingLeaves.length === 0 ? (
              <EmptyState title="No pending leave requests" />
            ) : (
              pendingLeaves.map((l: any) => (
                <div key={l.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-md">Worker #{l.worker_id}</h3>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">{l.leave_type}</Badge>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {format(new Date(l.start_date), "MMM dd")} - {format(new Date(l.end_date), "MMM dd")}
                  </p>
                  <p className="text-xs text-gray-500 mb-4 italic">"{l.reason || "No reason provided"}"</p>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700" 
                      onClick={() => approveLeave.mutate({ id: l.id, status: "Approved" })}
                    >
                      <Check size={16} className="mr-1" /> Approve
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => approveLeave.mutate({ id: l.id, status: "Rejected" })}
                    >
                      <X size={16} className="mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))
            )
          )}

          {/* ATTENDANCE CORRECTIONS */}
          {activeSubTab === "corrections" && (
            pendingCorrections.length === 0 ? (
              <EmptyState title="No pending attendance corrections" />
            ) : (
              pendingCorrections.map((c: any) => (
                <div key={c.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-md">Worker #{c.worker_id}</h3>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">{c.type}</Badge>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Date: {format(new Date(c.date || new Date()), "MMM dd, yyyy")}
                  </p>
                  <p className="text-xs text-gray-500 mb-4 italic">"{c.notes || c.reason || "Missing punch correction"}"</p>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700" 
                      onClick={() => approveCorrection.mutate({ id: c.id, reason: "Approved via App" })}
                    >
                      <Check size={16} className="mr-1" /> Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                    >
                      <Search size={16} className="mr-1" /> View Logs
                    </Button>
                  </div>
                </div>
              ))
            )
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl">
      <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
        <CheckCircle2 size={32} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">You're all caught up here!</p>
    </div>
  );
}
