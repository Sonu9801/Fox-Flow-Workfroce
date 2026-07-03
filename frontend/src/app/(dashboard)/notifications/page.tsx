"use client";

import React, { useState } from "react";
import { Bell, Check, Clock } from "lucide-react";
import { useNotifications, useMarkNotificationClicked, useMarkAllNotificationsRead } from "@/hooks/useQueries";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const router = useRouter();
  const { data: notifications = [], isLoading } = useNotifications();
  const markClickedMutation = useMarkNotificationClicked();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const handleNotificationClick = (notification: any) => {
    if (!notification.read || !notification.clicked) {
      markClickedMutation.mutate(notification.id);
    }
    if (notification.target_url) {
      router.push(notification.target_url);
    }
  };

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const notifIconColor: Record<string, string> = {
    error: "bg-destructive/20 text-destructive border-destructive/30",
    warning: "bg-warning/20 text-warning border-warning/30",
    success: "bg-success/20 text-success border-success/30",
    info: "bg-primary/20 text-primary border-primary/30",
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 py-5 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                System alerts and updates
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => markAllReadMutation.mutate()}
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Check size={16} />
            Mark all as read
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell size={24} className="text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No notifications</h3>
              <p className="text-muted-foreground mt-1">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification: any) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "w-full text-left bg-card border rounded-xl p-5 transition-all hover:shadow-md",
                  !notification.read 
                    ? "border-primary/40 shadow-sm" 
                    : "border-border/60 shadow-none opacity-80 hover:opacity-100"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg border",
                      notifIconColor[notification.type] || notifIconColor.info
                    )}
                  >
                    {notification.type === "error" ? "!"
                      : notification.type === "success" ? "✓"
                      : notification.type === "warning" ? "⚠"
                      : "i"}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={cn("text-base font-semibold truncate", !notification.read ? "text-foreground" : "text-muted-foreground")}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0 mt-1">
                        <Clock size={12} />
                        {formatDate(notification.timestamp)}
                      </div>
                    </div>
                    
                    <p className={cn("text-sm line-clamp-2", !notification.read ? "text-muted-foreground" : "text-muted-foreground/70")}>
                      {notification.message}
                    </p>
                    
                    {notification.target_url && (
                      <p className="text-xs text-primary font-medium mt-3">
                        Click to view details &rarr;
                      </p>
                    )}
                  </div>
                  
                  {!notification.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-2 shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
