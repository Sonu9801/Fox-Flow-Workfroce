import React from "react";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import { Bell, CheckCircle2, Check, AlertCircle, Info, Star, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export function NotificationsTab({ activeUser, setActiveTab }: { activeUser: any, setActiveTab: (tab: any) => void }) {
  const queryClient = useQueryClient();
  
  const { data: notifications = [] } = useQuery({ 
    queryKey: ["notifications"], 
    queryFn: () => notificationsApi.getAll() 
  });

  // Filter notifications for current supervisor if required
  const userNotifications = (notifications as any[]).filter((n: any) => 
    !n.reference_id || n.reference_id === activeUser?.id?.toString() || n.module === "all" || n.module === "workforce"
  ).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const unreadCount = userNotifications.filter((n: any) => !n.is_read).length;

  const markAsRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const getIconAndColor = (type: string) => {
    switch (type) {
      case "alert": return { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" };
      case "success": return { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" };
      case "warning": return { icon: Star, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" };
      case "info": 
      default: return { icon: Info, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" };
    }
  };

  const handleNotificationClick = (n: any) => {
    if (!n.is_read) {
      markAsRead.mutate(n.id);
    }
    
    // Navigate based on module
    if (n.module === "leave" || n.module === "attendance_correction" || n.title?.toLowerCase().includes("approval")) {
      setActiveTab("approvals");
    } else if (n.module === "production" || n.module === "quality") {
      setActiveTab("platforms");
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bell className="text-indigo-600" size={28} />
            Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated with your team's activity.</p>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 px-3 py-1 text-xs">
            {unreadCount} New
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {userNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl">
            <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">All caught up!</h3>
            <p className="text-sm text-gray-500 mt-1">You have no new notifications.</p>
          </div>
        ) : (
          userNotifications.map((n: any) => {
            const { icon: Icon, color, bg } = getIconAndColor(n.type || "info");
            return (
              <button 
                key={n.id} 
                onClick={() => handleNotificationClick(n)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex gap-4 ${
                  !n.is_read 
                    ? "bg-white dark:bg-zinc-900 border-indigo-200 shadow-sm" 
                    : "bg-gray-50 dark:bg-zinc-900/50 border-transparent opacity-75"
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center ${bg} ${color}`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`text-sm ${!n.is_read ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                      {n.title}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(n.created_at || new Date()), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                  {!n.is_read && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></div>
                      Tap to view
                    </div>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  );
}
