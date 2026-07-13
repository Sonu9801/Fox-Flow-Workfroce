import React, { useState } from "react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { motion } from "motion/react";
import { Calendar as CalendarIcon, Clock, Fingerprint, ChevronLeft, ChevronRight } from "lucide-react";

export function WorkerAttendanceTab({ history }: { history: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

  const getRecordForDay = (day: Date) => {
    return history.find(record => isSameDay(parseISO(record.date), day));
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1,y:0}} className="space-y-4 pb-24 transition-colors">
      <h2 className="text-xl font-black px-1 text-gray-900 dark:text-white tracking-tight">My Attendance</h2>
      
      {/* Calendar View */}
      <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
             <CalendarIcon size={18} className="text-[#4F6BFF] dark:text-[#60A5FA]" />
             <p className="text-sm font-semibold text-zinc-900 dark:text-white">{format(currentDate, "MMMM yyyy")}</p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={prevMonth} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors active:scale-95">
               <ChevronLeft size={16} strokeWidth={2.5}/>
             </button>
             <button onClick={nextMonth} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors active:scale-95">
               <ChevronRight size={16} strokeWidth={2.5}/>
             </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-gray-400">{d}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {/* Empty slots for start of month alignment */}
          {Array.from({ length: firstDayOfMonth.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="h-8"></div>
          ))}
          
          {daysInMonth.map(day => {
             const record = getRecordForDay(day);
             const isCurrentDay = isSameDay(day, today);
             
             let statusColor = 'bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 font-medium';
             if (record) {
                if (record.status === 'Present') statusColor = 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-bold';
                else if (record.status === 'Absent') statusColor = 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 font-bold';
                else statusColor = 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 font-bold';
             } else if (isCurrentDay) {
                statusColor = 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800';
             }

             return (
               <div key={day.toISOString()} className={`h-8 rounded-lg flex items-center justify-center text-[11px] ${statusColor}`}>
                 {format(day, "d")}
               </div>
             )
          })}
        </div>
      </div>

      {/* List View */}
      <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 transition-colors">
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-4">Past 30 Days Logs</p>
        <div className="space-y-3">
          {history.map((record: any) => (
            <div key={record.id} className="flex justify-between items-center p-3 border border-zinc-100 dark:border-zinc-800/50 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/30">
              <div>
                <p className="font-bold text-sm text-zinc-900 dark:text-white">{format(parseISO(record.date), "MMM dd, yyyy")}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                    <Fingerprint size={12} /> {record.punch_in ? format(parseISO(record.punch_in), "HH:mm") : "--"}
                  </div>
                  <span className="text-zinc-300 dark:text-zinc-600">•</span>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                    <Clock size={12} /> {record.punch_out ? format(parseISO(record.punch_out), "HH:mm") : "--"}
                  </div>
                </div>
              </div>
              <div className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                record.status === 'Present' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 
                record.status === 'Absent' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 
                'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400'
              }`}>
                {record.status}
              </div>
            </div>
          ))}
          {history.length === 0 && <p className="text-center text-zinc-500 dark:text-zinc-400 text-xs py-4">No records found.</p>}
        </div>
      </div>
    </motion.div>
  );
}
