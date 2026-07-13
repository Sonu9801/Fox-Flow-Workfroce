"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { jobsApi } from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import type { Vehicle, Worker, Stage } from "@/types";

interface AssignJobDialogProps {
  vehicle?: Vehicle;
  stage: Stage | "";
  workers: Worker[];
  open: boolean;
  onClose: () => void;
  onAssignComplete: () => void;
}

export function AssignJobDialog({ vehicle, stage, workers, open, onClose, onAssignComplete }: AssignJobDialogProps) {
  const { user } = useAuthStore() as any;
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  
  // Only show active workforce
  const availableWorkers = workers.filter(w => w.employmentStatus === "Active");

  const toggleWorker = (id: number) => {
    const next = new Set(selectedWorkerIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= 2) {
        toast.error("Maximum 2 workers can be assigned per platform (Company Policy)");
        return;
      }
      next.add(id);
    }
    setSelectedWorkerIds(next);
  };

  const handleAssign = async () => {
    if (selectedWorkerIds.size === 0) {
      toast.error("Please select at least one worker.");
      return;
    }
    if (!vehicle) return;
    
    setLoading(true);
    try {
      await jobsApi.assign({
        vehicle_id: parseInt(vehicle.id, 10),
        stage: stage,
        worker_ids: Array.from(selectedWorkerIds),
        expected_duration_minutes: 120, // Default duration
        supervisor_id: user?.id,
      });
      toast.success(`Job assigned successfully for stage ${stage}`);
      onAssignComplete();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to assign job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Production Job</DialogTitle>
          <DialogDescription>
            Assign workers to vehicle {vehicle?.vehicleNumber} for {stage} stage.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Platform No.</label>
            <Input 
              type="text" 
              value={vehicle ? `(PF No.- ${vehicle.platformNumber || vehicle.trackingId})` : ""} 
              disabled
              className="bg-muted/50 font-medium"
            />
          </div>
          
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Select Workers</label>
            <div className="border border-border rounded-md max-h-[200px] overflow-y-auto p-2 space-y-2">
              {availableWorkers.length === 0 && <p className="text-sm text-muted-foreground text-center p-2">No active workers found.</p>}
              {availableWorkers.map(w => (
                <div key={w.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                  <Checkbox 
                    id={`worker-${w.id}`} 
                    checked={selectedWorkerIds.has(parseInt(w.id, 10))}
                    onCheckedChange={() => toggleWorker(parseInt(w.id, 10))}
                  />
                  <label htmlFor={`worker-${w.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1">
                    {w.name} <span className="text-xs text-muted-foreground font-normal ml-2">({w.department})</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleAssign} disabled={loading || selectedWorkerIds.size === 0}>
            {loading ? "Assigning..." : "Assign Workers"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
