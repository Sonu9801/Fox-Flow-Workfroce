import React from "react";
import { motion } from "motion/react";
import { Bell, Megaphone } from "lucide-react";

export function WorkerNoticeTab({ notifications, title = "Notice Board", emptyText = "No new notices", icon = "megaphone" }: { notifications: any[], title?: string, emptyText?: string, icon?: string }) {
  const EmptyIcon = icon === "bell" ? Bell : Megaphone;
  
  return (
    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1,y:0}} className="space-y-4 pb-24">
      <h2 className="text-xl font-black px-1 text-gray-900 tracking-tight">{title}</h2>
      
      <div className="bg-white rounded-[24px] p-5 shadow-sm border border-zinc-200">
        <div className="space-y-4">
          {notifications.map((notif: any, idx: number) => {
            let iconColor = "text-gray-500";
            let bgColor = "bg-gray-100";
            let Icon = Bell;
            
            if (notif.type === 'leave') { iconColor = "text-green-500"; bgColor = "bg-green-50"; Icon = Bell; }
            else if (notif.type === 'payroll') { iconColor = "text-blue-500"; bgColor = "bg-blue-50"; Icon = Bell; }
            else if (notif.type === 'general') { iconColor = "text-purple-500"; bgColor = "bg-purple-50"; Icon = Megaphone; }

            return (
              <motion.div 
                key={notif.id || idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white rounded-[18px] border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 flex gap-4 items-center relative overflow-hidden"
              >
                <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 ${bgColor}`}>
                  <Icon size={20} className={iconColor} strokeWidth={2} />
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <h4 className="text-[16px] font-[700] text-[#111827] truncate leading-tight mb-1">{notif.title}</h4>
                  <p className="text-[13px] text-[#6B7280] line-clamp-2 leading-tight">{notif.body}</p>
                </div>
                <div className="flex flex-col items-end justify-start h-full shrink-0">
                  <span className="text-[12px] text-[#9CA3AF] mb-1.5">{notif.time || 'recent'}</span>
                  {notif.unread && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }} 
                      transition={{ repeat: Infinity, duration: 2 }} 
                      className="w-2.5 h-2.5 rounded-full bg-[#4F6BFF]" 
                    />
                  )}
                </div>
              </motion.div>
            )
          })}
          
          {notifications.length === 0 && (
            <div className="text-center py-8">
              <EmptyIcon size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-[14px] font-medium text-gray-500">{emptyText}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
