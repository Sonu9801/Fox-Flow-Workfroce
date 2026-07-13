import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, HardHat, Hammer, PaintBucket } from "lucide-react";
import { toast } from "sonner";
import { componentsApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export function SelfAssignModal({
  isOpen,
  onClose,
  workerId,
}: {
  isOpen: boolean;
  onClose: () => void;
  workerId: number;
}) {
  const [componentType, setComponentType] = useState("Platform");
  const [componentNumber, setComponentNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentNumber) {
      toast.error("Please enter a component number");
      return;
    }
    
    setLoading(true);
    try {
      await componentsApi.startTask(componentType, componentNumber);
      toast.success(`${componentType} task started successfully!`);
      queryClient.invalidateQueries({ queryKey: ["workerComponents", workerId] });
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to start task";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HardHat className="text-blue-500" /> Start New Work
            </h2>
            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleStart} className="p-5 space-y-4">
            <div className="space-y-2">
              <Label>Component Type</Label>
              <select
                value={componentType}
                onChange={(e) => setComponentType(e.target.value)}
                className="w-full h-12 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Platform">Platform</option>
                <option value="Gate">Gate</option>
                <option value="Aircutter">Aircutter</option>
                <option value="Paint">Paint</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Component Number / ID</Label>
              <Input
                placeholder="e.g. PL-101"
                value={componentNumber}
                onChange={(e) => setComponentNumber(e.target.value)}
                className="h-12 rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50"
              />
              {componentType === "Platform" && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">* Maximum 2 workers allowed per platform</p>
              )}
            </div>
            
            <Button
              type="submit"
              disabled={loading || !componentNumber}
              className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg mt-2"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Start Work"}
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
