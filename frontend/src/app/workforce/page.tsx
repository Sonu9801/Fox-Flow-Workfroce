"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkerDashboard } from "./WorkerDashboard";
import { SupervisorDashboard } from "./SupervisorDashboard";
import { ManagerDashboard } from "./ManagerDashboard";
import { AdminDashboard } from "./AdminDashboard";
import { Loader2 } from "lucide-react";

export default function WorkforceOrchestrator() {
  const router = useRouter();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const workerInfoStr = localStorage.getItem("worker_info");
    if (!workerInfoStr) {
      router.push("/workforce/login");
      return;
    }
    try {
      const info = JSON.parse(workerInfoStr);
      setWorker(info);
    } catch (e) {
      router.push("/workforce/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/workforce/login");
  };

  const handleSetWorker = (newWorker: any) => {
    setWorker(newWorker);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
      </div>
    );
  }

  if (!worker) return null;

  const role = worker.role?.toLowerCase() || "worker";

  switch (role) {
    case "admin":
    case "owner":
      return <AdminDashboard worker={worker} onLogout={handleLogout} />;
    case "manager":
      return <ManagerDashboard worker={worker} onLogout={handleLogout} />;
    case "supervisor":
      return <SupervisorDashboard worker={worker} onLogout={handleLogout} />;
    default:
      // Default fallback is worker
      return <WorkerDashboard worker={worker} onLogout={handleLogout} setWorker={handleSetWorker} />;
  }
}
