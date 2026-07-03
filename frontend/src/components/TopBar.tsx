"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { Bell, ChevronDown, Moon, Search, Sun } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications, useMarkNotificationClicked, useMarkAllNotificationsRead } from "@/hooks/useQueries";

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const {
    searchQuery,
    setSearchQuery,
  } = useUIStore();
  const { data: notifications = [] } = useNotifications();
  const markClickedMutation = useMarkNotificationClicked();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const { username, role, logout } = useAuthStore();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  const notifIconColor: Record<string, string> = {
    error: "bg-destructive/20 text-destructive",
    warning: "bg-warning/20 text-warning",
    success: "bg-success/20 text-success",
    info: "bg-primary/20 text-primary",
  };

  const displayUser = username ? username.toUpperCase() : "FM";
  const displayRole = role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : "Factory Manager";
  const displayEmail = username ? `${username}@foxflow.in` : "admin@foxflow.in";

  return (
    <header className="h-14 flex items-center gap-3 px-4 bg-card border-b border-border shadow-subtle flex-shrink-0 z-50">
      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          id="global-search"
          data-ocid="topbar.search_input"
          type="text"
          placeholder="Global search... ⌘K"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-smooth"
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Theme toggle */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-ocid="topbar.theme_toggle"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Sun
            size={16}
            className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
          />
          <Moon
            size={16}
            className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
          />
        </Button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            data-ocid="topbar.notification_bell"
            onClick={() => setShowNotifications((v) => !v)}
            className="relative h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                data-ocid="topbar.notification_popover"
                className="absolute right-0 top-10 w-80 bg-popover border border-border rounded-xl shadow-elevated z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">
                    Notifications
                  </span>
                  <button
                    type="button"
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.slice(0, 5).map((n: any) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        if (!n.read || !n.clicked) markClickedMutation.mutate(n.id);
                        setShowNotifications(false);
                        if (n.target_url) {
                          router.push(n.target_url);
                        }
                      }}
                      className={cn(
                        "w-full text-left flex gap-3 p-3 border-b border-border/50 hover:bg-muted/40 transition-smooth",
                        !n.read && "bg-primary/5",
                      )}
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs",
                          notifIconColor[n.type],
                        )}
                      >
                        {n.type === "error"
                          ? "!"
                          : n.type === "success"
                            ? "✓"
                            : n.type === "warning"
                              ? "⚠"
                              : "i"}
                      </div>
                      <div className="min-w-0 font-body">
                        <p className={cn("text-xs font-semibold truncate", !n.read ? "text-foreground" : "text-muted-foreground")}>
                          {n.title}
                        </p>
                        <p className={cn("text-xs line-clamp-2", !n.read ? "text-muted-foreground" : "text-muted-foreground/70")}>
                          {n.message}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1 shadow-[0_0_5px_rgba(var(--primary),0.6)]" />
                      )}
                    </button>
                  ))}
                  
                  {notifications.length > 5 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);
                        router.push("/notifications");
                      }}
                      className="w-full py-2 text-xs text-center text-primary font-medium hover:bg-muted/50 border-t border-border/50 transition-colors"
                    >
                      View all notifications
                    </button>
                  )}
                  {notifications.length === 0 && (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No notifications
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button
            type="button"
            data-ocid="topbar.user_menu_toggle"
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 h-8 rounded-lg hover:bg-muted transition-smooth"
          >
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {displayUser.slice(0, 2)}
            </div>
            <ChevronDown size={13} className="text-muted-foreground" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                data-ocid="topbar.user_dropdown"
                className="absolute right-0 top-10 w-48 bg-popover border border-border rounded-xl shadow-elevated z-50 overflow-hidden py-1"
              >
                <div className="px-3 py-2 border-b border-border font-body">
                  <p className="text-xs font-semibold text-foreground">
                    {displayRole}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {displayEmail}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/settings")}
                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted transition-smooth"
                >
                  Settings
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-smooth"
                >
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
