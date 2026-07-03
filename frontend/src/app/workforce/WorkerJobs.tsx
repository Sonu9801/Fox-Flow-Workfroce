"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, CheckCircle2, PauseCircle, PlayCircle, Camera } from "lucide-react";
import Webcam from "react-webcam";
import { toast } from "sonner";
import { jobsApi } from "@/lib/api";
import type { ProductionJob } from "@/types";
import { Badge } from "@/components/ui/badge";

export function WorkerJobs({ workerId }: { workerId: string }) {
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCamera, setShowCamera] = useState(false);
  const [completingJobId, setCompletingJobId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const fetchJobs = async () => {
    try {
      const data = await jobsApi.getWorkerJobs(workerId);
      setJobs(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, [workerId]);

  const handleUpdateStatus = async (jobId: number, status: string) => {
    try {
      await jobsApi.updateStatus(jobId, { status });
      toast.success(`Job marked as ${status.replace('_', ' ')}`);
      fetchJobs();
    } catch (error) {
      toast.error("Failed to update job status");
    }
  };

  const handleCompleteWithPhoto = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      toast.error("Could not capture photo.");
      return;
    }
    
    if (!completingJobId) return;

    setUploading(true);
    try {
      await jobsApi.updateStatus(completingJobId, { 
        status: "completed",
        photo_proof_url: imageSrc // in a real app, upload this to cloud storage first
      });
      toast.success("Job completed successfully!");
      setShowCamera(false);
      setCompletingJobId(null);
      fetchJobs();
    } catch (error) {
      toast.error("Failed to complete job");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground animate-pulse">Loading assigned jobs...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold px-1">My Production Jobs</h2>
      
      {jobs.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success/50 mb-3" />
          <p className="text-muted-foreground font-medium">You have no active assignments.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={job.id} 
              className="bg-card rounded-3xl p-5 border border-border shadow-sm flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20">
                    {job.stage.toUpperCase()}
                  </Badge>
                  <p className="font-bold text-lg">Job #{job.id}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    job.status === 'in_progress' ? 'bg-success/10 text-success' :
                    job.status === 'paused' ? 'bg-warning/10 text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {job.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>

              {job.status === "in_progress" && job.start_time && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg">
                  <Clock size={14} className="text-primary animate-pulse" />
                  <span>Started at {new Date(job.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-2">
                {job.status === "assigned" || job.status === "paused" ? (
                  <Button 
                    className="w-full rounded-xl bg-primary text-primary-foreground font-bold shadow-md h-12"
                    onClick={() => handleUpdateStatus(job.id, "in_progress")}
                  >
                    <PlayCircle size={18} className="mr-2" /> Start Work
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    className="w-full rounded-xl border-warning/50 text-warning hover:bg-warning/10 font-bold h-12"
                    onClick={() => handleUpdateStatus(job.id, "paused")}
                  >
                    <PauseCircle size={18} className="mr-2" /> Pause
                  </Button>
                )}
                
                <Button 
                  className="w-full rounded-xl bg-success text-success-foreground font-bold shadow-md h-12"
                  disabled={job.status !== "in_progress"}
                  onClick={() => {
                    setCompletingJobId(job.id);
                    setShowCamera(true);
                  }}
                >
                  <Camera size={18} className="mr-2" /> Complete
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Camera Modal for Job Completion */}
      <AnimatePresence>
        {showCamera && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            <div className="px-4 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-lg">Capture Proof</h2>
              <button onClick={() => setShowCamera(false)} className="bg-muted p-2 rounded-full">
                <AlertCircle size={20} className="text-muted-foreground" />
              </button>
            </div>
            
            <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "environment" }} // use rear camera for jobs if possible
                className="min-h-full min-w-full object-cover"
              />
            </div>

            <div className="p-6 bg-card border-t border-border space-y-3">
              <p className="text-xs text-center text-muted-foreground mb-2">Take a photo of the completed work</p>
              <Button 
                onClick={handleCompleteWithPhoto}
                disabled={uploading}
                className="w-full h-16 rounded-3xl text-xl font-bold shadow-xl bg-success hover:bg-success/90 text-success-foreground"
                size="lg"
              >
                {uploading ? "Submitting..." : "Submit Completion"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
