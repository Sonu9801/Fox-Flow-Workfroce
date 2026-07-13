"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SupervisorDashboard } from "../SupervisorDashboard";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function SupervisorPage() {
  const router = useRouter();
  const { initialize, isAuthenticated, role, name, email } = useAuthStore();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    initialize();
    
    // Slight delay to allow Zustand to rehydrate from localStorage
    const timer = setTimeout(() => {
      const currentAuth = useAuthStore.getState();
      if (!currentAuth.isAuthenticated) {
        router.push("/login");
        return;
      }

      if (currentAuth.role?.toLowerCase() !== "supervisor") {
        if (currentAuth.role?.toLowerCase() === "worker") {
          router.push("/workforce");
        } else {
          router.push("/");
        }
        return;
      }
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [initialize, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
      </div>
    );
  }

  // Construct a worker object to pass to SupervisorDashboard, although SupervisorDashboard will fetch the rest via /auth/me
  const supervisorUser = {
    id: undefined, // Will be fetched via /auth/me
    name: name,
    email: email,
    role: role
  };

  return <SupervisorDashboard worker={supervisorUser} onLogout={() => {}} />;
}
