"use client";

import { useAuthStore } from "@/store/authStore";
import { useNotifications, useMarkNotificationClicked, useMarkAllNotificationsRead } from "@/hooks/useQueries";
import { useTheme } from "next-themes";
import { 
  Bell, Menu, Search, X, Sun, Moon, 
  LayoutDashboard, BarChart3, Factory, Package, Trash2, 
  Users, Clock, Banknote, CheckCircle2, Truck, Boxes, 
  FileBarChart, Activity, Building2, Settings 
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
    ]
  },
  {
    title: "Production",
    items: [
      { label: "All Vehicles", href: "/production?category=All+Categories", icon: Factory },
      { label: "Cargo Box", href: "/production?category=Cargo+Box", icon: Package },
      { label: "Garbage Body", href: "/production?category=Garbage+Body", icon: Trash2 },
      { label: "Grocery Cart", href: "/production?category=Grocery+Cart", icon: Package },
      { label: "Food Cart", href: "/production?category=Food+Cart", icon: Package },
    ]
  },
  {
    title: "Workforce",
    items: [
      { label: "Workers", href: "/workers", icon: Users },
      { label: "Attendance", href: "/attendance", icon: Clock },
      { label: "Payroll", href: "/payroll", icon: Banknote },
    ]
  },
  {
    title: "Quality & Delivery",
    items: [
      { label: "Quality Control", href: "/quality-control", icon: CheckCircle2 },
      { label: "Dispatch", href: "/dispatch", icon: Truck },
      { label: "Inventory", href: "/inventory", icon: Boxes },
    ]
  },
  {
    title: "System",
    items: [
      { label: "Reports", href: "/reports", icon: FileBarChart },
      { label: "Activity Logs", href: "/activity-logs", icon: Activity },
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "OEM Portal", href: "/oem-portal", icon: Building2 },
    ]
  }
];

export function MobileTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: notifications = [] } = useNotifications();
  const markClickedMutation = useMarkNotificationClicked();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const { username, role, logout } = useAuthStore();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  useEffect(() => {
    // Attempt to lock screen orientation to portrait
    if (typeof screen !== 'undefined' && screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('portrait').catch(() => {
        // Silently ignore if not supported or no permission
      });
    }
    
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const notifIconColor: Record<string, string> = {
    error: "bg-destructive/20 text-destructive",
    warning: "bg-warning/20 text-warning",
    success: "bg-success/20 text-success",
    info: "bg-primary/20 text-primary",
  };

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  const displayEmail = username ? `${username.toLowerCase()}@foxflow.in` : "admin@foxflow.in";

  return (
    <>
      <header className="md:hidden sticky top-0 h-14 flex items-center justify-between px-4 bg-card border-b border-border shadow-subtle z-50 pt-safe">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-primary-foreground" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-foreground text-sm tracking-tight leading-none">FOXFLOW</span>
            <span className="text-[9px] text-muted-foreground font-semibold tracking-widest uppercase mt-0.5">Mobile</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full text-muted-foreground hover:bg-muted active:scale-95 transition-all relative w-9 h-9 flex items-center justify-center"
          >
            <Sun
              size={20}
              className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute"
            />
            <Moon
              size={20}
              className="rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute"
            />
          </button>
          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full text-muted-foreground hover:bg-muted active:scale-95 transition-all"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-card">
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
                  className="fixed left-4 right-4 top-[3.5rem] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-80 max-w-sm mx-auto sm:mx-0 bg-popover border border-border rounded-xl shadow-elevated z-[100] overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3 border-b border-border">
                    <span className="text-sm font-semibold">Notifications</span>
                    <button
                      type="button"
                      onClick={() => markAllReadMutation.mutate()}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {notifications.slice(0, 5).map((n: any) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          if (!n.read || !n.clicked) markClickedMutation.mutate(n.id);
                          setShowNotifications(false);
                          if (n.target_url) router.push(n.target_url);
                        }}
                        className={cn(
                          "w-full text-left flex gap-3 p-3 border-b border-border/50 hover:bg-muted/40 transition-smooth",
                          !n.read && "bg-primary/5"
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold",
                            notifIconColor[n.type]
                          )}
                        >
                          {n.type === "error" ? "!" : n.type === "success" ? "✓" : n.type === "warning" ? "⚠" : "i"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-xs font-semibold truncate", !n.read ? "text-foreground" : "text-muted-foreground")}>{n.title}</p>
                          <p className={cn("text-xs line-clamp-2 mt-0.5", !n.read ? "text-muted-foreground" : "text-muted-foreground/70")}>{n.message}</p>
                        </div>
                      </button>
                    ))}
                    {notifications.length > 5 && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowNotifications(false);
                          router.push("/notifications");
                        }}
                        className="w-full py-3 text-xs text-center text-primary font-semibold hover:bg-muted/50 border-t border-border/50 transition-colors"
                      >
                        View all notifications
                      </button>
                    )}
                    {notifications.length === 0 && (
                      <div className="p-6 text-center text-sm text-muted-foreground font-medium">
                        No notifications
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Drawer Menu Button */}
          <button
            type="button"
            onClick={() => setShowDrawer(true)}
            className="p-2 rounded-full text-muted-foreground hover:bg-muted active:scale-95 transition-all"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-3/4 max-w-sm bg-card border-l border-border shadow-2xl z-[70] flex flex-col md:hidden pt-safe"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {username ? username.slice(0, 2).toUpperCase() : "FM"}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground leading-none">{username?.toUpperCase() || "ADMIN"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{displayEmail}</p>
                  </div>
                </div>
                <button onClick={() => setShowDrawer(false)} className="p-2 rounded-full bg-muted/50 text-muted-foreground active:scale-95">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto py-2 px-2 scrollbar-thin">
                {navGroups.map((group) => (
                  <div key={group.title} className="mb-4 px-2">
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">{group.title}</p>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        let isActive = false;
                        if (item.href === "/") {
                          isActive = pathname === "/";
                        } else if (item.href.includes("?")) {
                          isActive = typeof window !== 'undefined' && window.location.search.includes(item.href.split("?")[1]);
                        } else {
                          isActive = pathname.startsWith(item.href);
                        }
                        
                        return (
                          <button
                            key={item.label}
                            onClick={() => {
                              setShowDrawer(false);
                              router.push(item.href);
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-foreground/80 hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <Icon size={18} className={isActive ? "text-primary" : "text-muted-foreground"} />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                <div className="px-4 pt-4 mt-2 mb-4 border-t border-border/50">
                   <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">Account</p>
                   <button onClick={() => { setShowDrawer(false); router.push("/settings"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground/80 hover:bg-muted font-medium text-sm transition-colors">
                     <Settings size={18} className="text-muted-foreground" />
                     Settings
                   </button>
                   <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 text-destructive font-medium text-sm transition-colors mt-1">
                     <X size={18} />
                     Sign Out
                   </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
