"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { MobileTopBar } from "@/components/MobileTopBar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuthStore } from "@/store/authStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, initialize } = useAuthStore();
  const [loading, setLoading] = useState(true);
  
  // Hook up WebSocket client
  useWebSocket();

  useEffect(() => {
    initialize();
    
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
    } else {
      const role = localStorage.getItem("role");
      if (role?.toLowerCase() === 'worker' && window.location.pathname === '/') {
        window.location.href = "/workforce";
        return;
      }
      if (role?.toLowerCase() === 'oem' && window.location.pathname === '/') {
        window.location.href = "/oem-portal";
        return;
      }
      setLoading(false);
    }
  }, [initialize, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground font-body">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-muted-foreground animate-pulse">Starting session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background font-body">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex sticky top-0 h-screen flex-shrink-0 z-40">
        <Sidebar />
      </div>
      
      <div className="flex flex-col flex-1 min-w-0 pb-16 md:pb-0">
        {/* Desktop TopBar */}
        <div className="hidden md:block sticky top-0 z-50">
          <TopBar />
        </div>
        
        {/* Mobile TopBar */}
        <MobileTopBar />

        <main
          className="flex-1 flex flex-col bg-background"
          data-ocid="main.content"
        >
          {children}
        </main>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
