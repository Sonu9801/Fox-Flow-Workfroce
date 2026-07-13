import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, Phone, MessageSquare, Mail, FileText, ChevronRight, ShieldCheck, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function WorkerSupportTab() {
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitIssue = async () => {
    if (!issueText.trim()) return toast.error("Please describe your issue");
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    toast.success("Issue submitted successfully! IT will contact you soon.");
    setIssueText("");
    setShowIssueModal(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="p-5 pb-32 max-w-md mx-auto relative"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Help & Support</h2>
        <p className="text-sm text-gray-500 font-medium mt-1">Get assistance with FoxFlow</p>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-3xl p-5 mb-6 text-white shadow-[0_8px_30px_rgba(79,107,255,0.3)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
            <HelpCircle size={24} className="text-white" />
          </div>
          <h3 className="font-bold text-lg">Need immediate help?</h3>
        </div>
        <p className="text-blue-100 text-sm mb-4">Our HR and IT teams are available during working hours.</p>
        <div className="flex gap-3">
          <a href="tel:+919876543210" className="flex-1 bg-white text-blue-600 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
            <Phone size={16} /> Call HR
          </a>
          <button onClick={() => setShowIssueModal(true)} className="flex-1 bg-blue-700/50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
            <MessageSquare size={16} /> Ticket
          </button>
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-900 mb-3 px-1 uppercase tracking-wider">Quick Actions</h3>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden mb-6">
        
        <a href="mailto:support@foxflow.com" className="w-full flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
              <Mail size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-sm">Email Support</p>
              <p className="text-xs text-gray-500">support@foxflow.com</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </a>

        <button onClick={() => setShowIssueModal(true)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-sm">Report App Issue</p>
              <p className="text-xs text-gray-500">Bugs or glitches</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </button>
      </div>

      {/* Issue Reporting Modal */}
      <AnimatePresence>
        {showIssueModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Report an Issue</h3>
                <button onClick={() => setShowIssueModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                  <X size={20} />
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Describe your problem</label>
                <textarea 
                  value={issueText}
                  onChange={(e) => setIssueText(e.target.value)}
                  placeholder="E.g. I can't punch out, or the app is crashing..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                />
              </div>

              <button 
                onClick={handleSubmitIssue}
                disabled={isSubmitting}
                className="w-full bg-[#4F6BFF] text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
              >
                {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : "Submit Ticket"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
