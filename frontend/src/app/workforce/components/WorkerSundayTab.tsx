import React from "react";
import { format, parseISO, isSunday } from "date-fns";
import { motion } from "motion/react";
import { Sun, Fingerprint, Clock } from "lucide-react";

export function WorkerSundayTab({ history }: { history: any[] }) {
  // Filter history for Sundays
  const sundayRecords = history.filter(record => isSunday(parseISO(record.date)));

  return (
    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1,y:0}} className="space-y-4 pb-24">
      <h2 className="text-xl font-black px-1 text-gray-900 tracking-tight">Sunday Work</h2>
      
      <div className="bg-white rounded-[24px] p-5 shadow-sm border border-zinc-200">
        <p className="text-sm font-semibold text-zinc-500 mb-4">Past 30 Days Sunday Logs</p>
        <div className="space-y-3">
          {sundayRecords.map((record: any) => (
            <div key={record.id} className="flex justify-between items-center p-3 border border-zinc-100 rounded-xl bg-zinc-50/50">
              <div>
                <p className="font-bold text-sm text-zinc-900">{format(parseISO(record.date), "MMM dd, yyyy")}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
                    <Fingerprint size={12} /> {record.punch_in ? format(parseISO(record.punch_in), "HH:mm") : "--"}
                  </div>
                  <span className="text-zinc-300">•</span>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
                    <Clock size={12} /> {record.punch_out ? format(parseISO(record.punch_out), "HH:mm") : "--"}
                  </div>
                </div>
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
          
          {sundayRecords.length === 0 && (
            <div className="text-center py-8">
              <Sun size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-[14px] font-medium text-gray-500">No Sunday work records found</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
