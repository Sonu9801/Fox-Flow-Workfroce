import React from "react";
import { format, parseISO } from "date-fns";
import { motion } from "motion/react";
import { Briefcase, Calendar as CalendarIcon, Clock, Plus, Loader2 } from "lucide-react";

export function WorkerLeaveTab({ 
  leaveHistory, 
  isLoading, 
  onApplyLeave 
}: { 
  leaveHistory: any[], 
  isLoading: boolean, 
  onApplyLeave: () => void 
}) {
  return (
    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1,y:0}} className="space-y-4 pb-24">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Leaves</h2>
        <button 
          onClick={onApplyLeave}
          className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
        >
          <Plus size={14} strokeWidth={2.5} /> Apply
        </button>
      </div>
      
      <div className="bg-white rounded-[24px] p-5 shadow-sm border border-zinc-200">
        <p className="text-sm font-semibold text-zinc-500 mb-4">Leave History</p>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-blue-500" size={24} />
          </div>
        ) : (
          <div className="space-y-3">
            {leaveHistory.map((leave: any) => (
              <div key={leave.id} className="flex flex-col p-3.5 border border-zinc-100 rounded-xl bg-zinc-50/50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-sm text-zinc-900">{leave.leave_type}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
                        <CalendarIcon size={12} /> 
                        {format(parseISO(leave.start_date), "MMM dd")} - {format(parseISO(leave.end_date), "MMM dd")}
                      </div>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                    leave.status === 'approved' ? 'bg-green-100 text-green-700' : 
                    leave.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {leave.status}
                  </div>
                </div>
                {leave.reason && (
                  <p className="text-xs text-zinc-500 bg-white p-2 rounded-lg border border-zinc-100 mt-1 line-clamp-2">
                    {leave.reason}
                  </p>
                )}
              </div>
            ))}
            
            {leaveHistory.length === 0 && (
              <div className="text-center py-8">
                <Briefcase size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-[14px] font-medium text-gray-500">No leave history found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
