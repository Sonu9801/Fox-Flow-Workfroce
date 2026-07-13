import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, MessageSquare, Loader2, Info } from "lucide-react";
import { attendanceApi } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: number | string;
}

export function ApplyLeaveModal({ isOpen, onClose, workerId }: ApplyLeaveModalProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    type: "Casual",
    reasonCategory: "",
    customReason: "",
  });

  const GENUINE_REASONS = [
    "Medical / Sick Leave",
    "Family Emergency",
    "Personal Work",
    "Festival / Religious Event",
    "Transportation / Vehicle Issue",
    "Other"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reasonCategory) {
      toast.error("Please fill all required fields");
      return;
    }
    
    // Combine reason category and custom reason if provided
    const finalReason = formData.reasonCategory === "Other" 
        ? formData.customReason 
        : formData.customReason ? `${formData.reasonCategory} - ${formData.customReason}` : formData.reasonCategory;

    if (!finalReason) {
        toast.error("Please provide a reason for the leave");
        return;
    }

    try {
      setLoading(true);
      await attendanceApi.applyLeave(
        workerId, 
        formData.startDate, 
        formData.endDate, 
        formData.type, 
        finalReason
      );
      toast.success("Leave application submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["leaveHistory"] });
      onClose();
    } catch (error: any) {
      let errorMsg = "Failed to submit leave application";
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === "string") {
          errorMsg = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMsg = error.response.data.detail[0]?.msg || errorMsg;
        }
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-50 pb-8 flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-black text-gray-900">Apply for Leave</h2>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-600 active:scale-95 transition-transform">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="bg-blue-50 text-blue-700 p-3 rounded-xl flex items-start gap-2 mb-6 text-sm">
                <Info size={16} className="mt-0.5 shrink-0" />
                <p>Please select a genuine reason for your leave. Applications with detailed reasons are approved faster.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5"><Calendar size={14}/> Start Date</label>
                    <input 
                      type="date" 
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5"><Calendar size={14}/> End Date</label>
                    <input 
                      type="date" 
                      required
                      value={formData.endDate}
                      min={formData.startDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Leave Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="Casual">Casual Leave</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Earned">Earned Leave</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Genuine Reason</label>
                  <select 
                    required
                    value={formData.reasonCategory}
                    onChange={(e) => setFormData({...formData, reasonCategory: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="" disabled>Select a reason...</option>
                    {GENUINE_REASONS.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>

                {formData.reasonCategory !== "" && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5"><MessageSquare size={14}/> Additional Details (Optional)</label>
                    <textarea 
                      placeholder={formData.reasonCategory === "Other" ? "Please specify your reason here..." : "Add any specific details here..."}
                      value={formData.customReason}
                      onChange={(e) => setFormData({...formData, customReason: e.target.value})}
                      rows={3}
                      required={formData.reasonCategory === "Other"}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#4F6BFF] text-white font-bold py-4 rounded-xl mt-4 active:scale-[0.98] transition-transform flex items-center justify-center disabled:opacity-70"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : "Submit Leave Application"}
                </button>

              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
