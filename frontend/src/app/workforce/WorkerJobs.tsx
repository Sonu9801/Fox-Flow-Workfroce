"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, Clock, PauseCircle, PlayCircle, Camera, 
  Briefcase, RefreshCw, AlertTriangle 
} from "lucide-react";
import Webcam from "react-webcam";
import { toast } from "sonner";
import { jobsApi, componentsApi } from "@/lib/api";
import type { ProductionJob } from "@/types";
import { SelfAssignModal } from "./components/SelfAssignModal";
import { SubmitComponentModal } from "./components/SubmitComponentModal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export function WorkerJobs({ workerId }: { workerId: string }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("All");
  
  const [showCamera, setShowCamera] = useState(false);
  const [completingJobId, setCompletingJobId] = useState<number | null>(null);
  const webcamRef = useRef<Webcam>(null);

  // New states for Component Tasks
  const [showSelfAssign, setShowSelfAssign] = useState(false);
  const [showComponentSubmit, setShowComponentSubmit] = useState(false);
  const [completingComponentId, setCompletingComponentId] = useState<number | null>(null);

  // 1. React Query for fetching jobs
  const { data: jobs, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["workerJobs", workerId],
    queryFn: async () => {
      const data = await jobsApi.getWorkerJobs(workerId);
      return data as ProductionJob[];
    },
    refetchInterval: 10000,
  });

  const { data: componentTasks } = useQuery({
    queryKey: ["workerComponents", workerId],
    queryFn: async () => {
      const data = await componentsApi.getWorkerTasks(parseInt(workerId));
      return data;
    },
    refetchInterval: 10000,
  });

  // 2. React Query for mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ jobId, status, photo_proof_url }: { jobId: number, status: string, photo_proof_url?: string }) => {
      await jobsApi.updateStatus(jobId, { status, photo_proof_url });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workerJobs", workerId] });
      toast.success(`Job marked as ${variables.status.replace('_', ' ')}`);
    },
    onError: () => {
      toast.error("Failed to update job status");
    }
  });

  const handleUpdateStatus = (jobId: number, status: string) => {
    updateStatusMutation.mutate({ jobId, status });
  };

  const handleCompleteWithPhoto = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      toast.error("Could not capture photo.");
      return;
    }
    if (!completingJobId) return;

    updateStatusMutation.mutate({ 
      jobId: completingJobId, 
      status: "completed", 
      photo_proof_url: imageSrc 
    }, {
      onSuccess: () => {
        setShowCamera(false);
        setCompletingJobId(null);
        queryClient.invalidateQueries({ queryKey: ["workerJobs", workerId] });
        toast.success("Job completed successfully!");
      }
    });
  };

  if (isError) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center mt-10">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs">Unable to load your jobs. Please check your network.</p>
        <Button onClick={() => refetch()} className="px-6 rounded-full" disabled={isRefetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} /> Retry
        </Button>
      </div>
    );
  }

  // Calculate stats
  const pendingCount = jobs?.filter(j => j.status === 'assigned' || j.status === 'not_started').length || 0;
  const runningCount = jobs?.filter(j => j.status === 'in_progress').length || 0;
  const completedCount = jobs?.filter(j => j.status === 'completed').length || 0;
  
  const highPriorityCount = jobs?.filter(j => (j as any).priority?.toLowerCase() === 'high' || (j as any).priority?.toLowerCase() === 'urgent').length || 0;

  // Filter jobs by tab
  const filteredJobs = jobs?.filter(job => {
    if (activeTab === "All") return true;
    if (activeTab === "Pending") return job.status === "assigned" || job.status === "not_started";
    if (activeTab === "In_Progress") return job.status === "in_progress" || job.status === "paused";
    if (activeTab === "Completed") return job.status === "completed";
    return true;
  });

  return (
    <div className="flex flex-col gap-5 px-1 py-4 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">My Work</h2>
        <div className="flex gap-2">
          <Button variant="default" size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700" onClick={() => setShowSelfAssign(true)}>
            + Start Work
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-white dark:bg-zinc-800 shadow-sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Hero Summary Card */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-600 to-blue-700 text-white overflow-hidden rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-blue-50">Today's Overview</h3>
            <Briefcase className="w-5 h-5 text-indigo-200 opacity-80" />
          </div>
          <div className="grid grid-cols-4 gap-2 divide-x divide-indigo-400/30">
            <div className="text-center">
              <p className="text-2xl font-bold">{isLoading ? '-' : pendingCount}</p>
              <p className="text-[10px] text-indigo-200 mt-1 uppercase tracking-wide">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-100">{isLoading ? '-' : runningCount}</p>
              <p className="text-[10px] text-indigo-200 mt-1 uppercase tracking-wide">Running</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-300">{isLoading ? '-' : completedCount}</p>
              <p className="text-[10px] text-indigo-200 mt-1 uppercase tracking-wide">Done</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-300">{isLoading ? '-' : highPriorityCount}</p>
              <p className="text-[10px] text-indigo-200 mt-1 uppercase tracking-wide">Priority</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="All" onValueChange={setActiveTab} className="w-full mt-2">
        <TabsList className="w-full grid grid-cols-4 bg-gray-200/50 dark:bg-zinc-800 p-1 rounded-xl">
          <TabsTrigger value="All" className="text-xs rounded-lg">All</TabsTrigger>
          <TabsTrigger value="Pending" className="text-xs rounded-lg">Pending</TabsTrigger>
          <TabsTrigger value="In_Progress" className="text-xs rounded-lg">Running</TabsTrigger>
          <TabsTrigger value="Completed" className="text-xs rounded-lg">Done</TabsTrigger>
        </TabsList>

        <div className="mt-5">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {filteredJobs && filteredJobs.length > 0 ? (
                <motion.div className="space-y-4" key="jobs-list">
                  {filteredJobs.map((job, idx) => {
                    const isRunning = job.status === "in_progress";
                    const isPaused = job.status === "paused";
                    
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        key={job.id} 
                        className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-gray-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge variant="outline" className="mb-2 bg-indigo-50/50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 shadow-sm text-[10px] uppercase font-bold tracking-wider">
                              {job.stage}
                            </Badge>
                            <div className="flex flex-col">
                              <h3 className="font-extrabold text-xl text-gray-900 dark:text-gray-100">
                                {job.platform_number ? `PF No.- ${job.platform_number}` : `Job #${job.id}`}
                              </h3>
                              {job.vehicle_number && (
                                <span className="text-xs text-gray-500 font-semibold">{job.vehicle_number}</span>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary" className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full shadow-sm ${
                            isRunning ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                            isPaused ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                            job.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                            'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300'
                          }`}>
                            {job.status.replace("_", " ")}
                          </Badge>
                        </div>

                        {isRunning && job.start_time && (
                          <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-900/20 p-2.5 rounded-xl border border-blue-100 dark:border-blue-800/30">
                            <Clock size={16} className="animate-pulse" />
                            <span>Started today at {new Date(job.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2.5 mt-2">
                          {job.status === "assigned" || job.status === "not_started" || isPaused ? (
                            <Button 
                              className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md h-12 transition-all active:scale-95"
                              onClick={() => handleUpdateStatus(job.id, "in_progress")}
                              disabled={updateStatusMutation.isPending}
                            >
                              <PlayCircle size={18} className="mr-2" /> {isPaused ? "Resume" : "Start Work"}
                            </Button>
                          ) : isRunning ? (
                            <Button 
                              variant="outline"
                              className="w-full rounded-2xl border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800/50 dark:text-orange-400 dark:hover:bg-orange-900/20 font-bold h-12 transition-all active:scale-95"
                              onClick={() => handleUpdateStatus(job.id, "paused")}
                              disabled={updateStatusMutation.isPending}
                            >
                              <PauseCircle size={18} className="mr-2" /> Pause
                            </Button>
                          ) : (
                            <Button variant="outline" className="w-full rounded-2xl h-12 font-bold opacity-50" disabled>
                              Completed
                            </Button>
                          )}
                          
                          <Button 
                            className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-md h-12 transition-all active:scale-95"
                            disabled={!isRunning || updateStatusMutation.isPending}
                            onClick={() => {
                              setCompletingJobId(job.id);
                              setShowCamera(true);
                            }}
                          >
                            <Camera size={18} className="mr-2" /> Complete
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div 
                  key="empty-state"
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 shadow-sm mt-4"
                >
                  <div className="w-24 h-24 mb-6 relative">
                    <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-900/30 rounded-full animate-ping opacity-40"></div>
                    <div className="relative bg-indigo-50 dark:bg-indigo-900/20 w-full h-full rounded-full flex items-center justify-center border border-indigo-100">
                      <Briefcase className="w-10 h-10 text-indigo-500" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Jobs Assigned</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-[250px] leading-relaxed">
                    Your supervisor hasn't assigned any work to you yet. Assigned jobs will automatically appear here.
                  </p>
                  <Button onClick={() => refetch()} className="px-8 h-12 rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-md font-semibold transition-transform active:scale-95">
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} /> Check for updates
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </Tabs>

      {/* Component Tasks Section */}
      {componentTasks && componentTasks.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4">Self-Assigned Tasks</h3>
          <div className="space-y-4">
            {componentTasks.map((task: any) => (
              <motion.div 
                key={`comp-${task.id}`}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {task.component_type}
                    </Badge>
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg mt-1">{task.component_number}</h4>
                  </div>
                  <Badge variant={task.status === "completed" ? "secondary" : "default"} className={task.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800"}>
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>
                
                {task.status === "in_progress" && (
                  <Button 
                    className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-12 mt-2"
                    onClick={() => {
                      setCompletingComponentId(task.id);
                      setShowComponentSubmit(true);
                    }}
                  >
                    <Camera size={18} className="mr-2" /> Submit Proof
                  </Button>
                )}
                {task.status === "completed" && (
                  <div className="flex gap-2 items-center text-emerald-600 text-sm font-bold mt-2 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <AlertCircle size={16} /> Completed on {new Date(task.end_time).toLocaleDateString()}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <SelfAssignModal 
        isOpen={showSelfAssign} 
        onClose={() => setShowSelfAssign(false)} 
        workerId={parseInt(workerId)} 
      />
      
      <SubmitComponentModal 
        isOpen={showComponentSubmit} 
        onClose={() => setShowComponentSubmit(false)} 
        taskId={completingComponentId} 
        workerId={parseInt(workerId)} 
      />

      {/* Camera Modal for Job Completion */}
      <AnimatePresence>
        {showCamera && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            <div className="px-4 py-4 border-b border-border flex items-center justify-between shadow-sm relative z-10 bg-card">
              <h2 className="font-bold text-lg">Capture Proof</h2>
              <button onClick={() => setShowCamera(false)} className="bg-muted hover:bg-muted/80 p-2 rounded-full transition-colors">
                <AlertCircle size={20} className="text-muted-foreground" />
              </button>
            </div>
            
            <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "environment" }}
                className="min-h-full min-w-full object-cover"
              />
            </div>

            <div className="p-6 bg-card border-t border-border space-y-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] relative z-10">
              <p className="text-xs text-center text-muted-foreground mb-2 font-medium">Take a clear photo of the completed work</p>
              <Button 
                onClick={handleCompleteWithPhoto}
                disabled={updateStatusMutation.isPending}
                className="w-full h-16 rounded-3xl text-xl font-bold shadow-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-transform active:scale-95"
                size="lg"
              >
                {updateStatusMutation.isPending ? "Submitting..." : "Submit Completion"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
