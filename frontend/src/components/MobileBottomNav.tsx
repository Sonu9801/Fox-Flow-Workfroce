"use client";

import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Factory,
  Users,
  Truck,
  Settings,
  Menu,
  Building2,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { role } = useAuthStore();
  const currentRole = role?.toLowerCase() || 'manager';

  let navItems = [];

  if (currentRole === 'worker') {
    navItems = [
      { label: "Home", href: "/workforce", icon: LayoutDashboard },
      { label: "Attendance", href: "/attendance", icon: Clock },
      { label: "Settings", href: "/settings", icon: Settings },
    ];
  } else if (currentRole === 'oem') {
    navItems = [
      { label: "Portal", href: "/oem-portal", icon: Building2 },
      { label: "Settings", href: "/settings", icon: Settings },
    ];
  } else {
    // Manager, Owner, Supervisor
    navItems = [
      { label: "Home", href: "/", icon: LayoutDashboard },
      { label: "Production", href: "/production?category=All+Categories", icon: Factory },
      { label: "Workers", href: "/workers", icon: Users },
      { label: "Dispatch", href: "/dispatch", icon: Truck },
      { label: "Menu", href: "/reports", icon: Menu },
    ];
  }

  return (
    <nav className="fixed bottom-0 w-full bg-card border-t border-border z-50 md:hidden pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
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
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive && "drop-shadow-[0_0_8px_rgba(var(--primary),0.4)]")} />
              <span className="text-[10px] font-medium tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
