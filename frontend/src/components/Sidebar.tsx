"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Building2,
  Cable,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Factory,
  LayoutDashboard,
  Package,
  Radio,
  Settings,
  Trash2,
  Truck,
  Users,
  Wrench,
  Zap,
  Clock,
  Banknote,
  FileBarChart,
  Activity,
  Bell
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

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
      { label: "Settings", href: "/settings", icon: Settings },
    ]
  }
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { username, role, initialize } = useAuthStore();
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Overview": true,
    "Production": true,
    "Workforce": true,
    "Quality & Delivery": true,
    "System": true
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  const displayUser = username ? username.toUpperCase() : "FM";
  const displayRole = role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : "Factory Manager";
  const displayEmail = username ? `${username}@foxflow.in` : "admin@foxflow.in";

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 64 : 260 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex flex-col h-full bg-sidebar border-r border-sidebar-border overflow-hidden flex-shrink-0 z-30"
      >
        <div className="flex items-center h-14 px-3 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-primary-foreground" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <span className="font-display font-bold text-sidebar-foreground text-sm tracking-tight whitespace-nowrap">
                    FOXFLOW
                  </span>
                  <span className="block text-[10px] text-muted-foreground font-medium tracking-widest uppercase whitespace-nowrap">
                    ERP
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-4 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-1">
              {!sidebarCollapsed ? (
                <button 
                  onClick={() => toggleGroup(group.title)}
                  className="flex items-center justify-between px-2 py-1.5 w-full text-left"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {group.title}
                  </span>
                  <ChevronDown 
                    size={14} 
                    className={cn(
                      "text-muted-foreground/50 transition-transform duration-200",
                      expandedGroups[group.title] ? "" : "-rotate-90"
                    )}
                  />
                </button>
              ) : (
                <div className="h-4 border-b border-sidebar-border/30 mb-2 mx-2" />
              )}
              
              <AnimatePresence initial={false}>
                {(expandedGroups[group.title] || sidebarCollapsed) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-1 overflow-hidden"
                  >
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      let isActive = false;
                      if (item.href === "/") {
                        isActive = pathname === "/";
                      } else if (item.href.includes("?")) {
                        // Very simple active check for now
                        isActive = typeof window !== 'undefined' && window.location.search.includes(item.href.split("?")[1]);
                      } else {
                        isActive = pathname.startsWith(item.href);
                      }

                      const content = (
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-smooth relative group",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full"
                              transition={{ duration: 0.2, ease: "easeOut" }}
                            />
                          )}
                          <Icon
                            size={18}
                            className={cn(
                              "flex-shrink-0 transition-colors",
                              isActive
                                ? "text-primary"
                                : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                            )}
                          />
                          <AnimatePresence>
                            {!sidebarCollapsed && (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="truncate"
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </Link>
                      );

                      if (sidebarCollapsed) {
                        return (
                          <Tooltip key={item.label}>
                            <TooltipTrigger asChild>{content}</TooltipTrigger>
                            <TooltipContent side="right">{item.label}</TooltipContent>
                          </Tooltip>
                        );
                      }
                      return <div key={item.label}>{content}</div>;
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-2 flex-shrink-0">
          <div
            className={cn(
              "flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-smooth cursor-pointer",
              sidebarCollapsed && "justify-center"
            )}
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
              {displayUser.slice(0, 2)}
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-0 flex-1"
                >
                  <p className="text-xs font-semibold text-sidebar-foreground truncate">
                    {displayRole}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {displayEmail}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(
              "mt-1 w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-smooth",
              sidebarCollapsed && "justify-center"
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronLeft size={16} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
