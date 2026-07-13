import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { X, Camera as CameraIcon, Loader2 } from "lucide-react";
import Webcam from "react-webcam";
import { toast } from "sonner";
import { componentsApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export function SubmitComponentModal({
  isOpen,
  onClose,
  taskId,
  workerId
}: {
  isOpen: boolean;
  onClose: () => void;
  taskId: number | null;
  workerId: number;
}) {
  const webcamRef = useRef<Webcam>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  if (!isOpen || taskId === null) return null;

  const handleSubmit = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      toast.error("Could not capture photo.");
      return;
    }
    
    setLoading(true);
    try {
      await componentsApi.submitTask(taskId, imageSrc, "Completed via PWA");
      toast.success("Task completed successfully!");
      queryClient.invalidateQueries({ queryKey: ["workerComponents", workerId] });
      onClose();
    } catch (err: any) {
      toast.error("Failed to submit task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex flex-col bg-black">
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
          <h2 className="text-white font-bold text-lg">Submit Work Proof</h2>
          <button onClick={onClose} className="p-2 bg-white/20 rounded-full text-white backdrop-blur-md">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 relative bg-zinc-900 flex items-center justify-center overflow-hidden">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="p-6 pb-10 bg-black flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full max-w-sm h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : <><CameraIcon size={24} className="mr-2" /> Capture & Submit</>}
          </Button>
        </div>
      </div>
    </AnimatePresence>
  );
}
