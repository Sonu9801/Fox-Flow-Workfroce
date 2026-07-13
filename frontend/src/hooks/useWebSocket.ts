import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Dynamically get the host to support testing from other devices on the same network
    const getWsUrl = () => {
      if (typeof window === "undefined") return "ws://localhost:8000/ws";
      const host = window.location.hostname;
      // If deployed, you might want to use process.env.NEXT_PUBLIC_WS_URL here instead
      return `ws://${host}:8000/ws`;
    };
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL && !process.env.NEXT_PUBLIC_WS_URL.includes("127.0.0.1") && !process.env.NEXT_PUBLIC_WS_URL.includes("localhost") 
      ? process.env.NEXT_PUBLIC_WS_URL 
      : getWsUrl();
    
    let ws: WebSocket;
    let timeoutId: NodeJS.Timeout;
    let reconnectTimeout = 5000;
    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) return;
      
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (isUnmounted) {
          ws.close();
          return;
        }
        console.log("WebSocket connected to:", wsUrl);
        reconnectTimeout = 5000; // Reset timeout on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case "VEHICLE_CREATED":
            case "VEHICLE_UPDATED":
            case "VEHICLE_STAGE_CHANGED":
              queryClient.invalidateQueries({ queryKey: ["vehicles"] });
              queryClient.invalidateQueries({ queryKey: ["activities"] });
              break;
            case "WORKER_CREATED":
            case "WORKER_UPDATED":
            case "WORKER_STATUS_CHANGED":
              queryClient.invalidateQueries({ queryKey: ["workers"] });
              break;
            case "QC_RECORD_CREATED":
              queryClient.invalidateQueries({ queryKey: ["qcRecords"] });
              queryClient.invalidateQueries({ queryKey: ["vehicles"] });
              queryClient.invalidateQueries({ queryKey: ["activities"] });
              break;
            case "DISPATCH_RECORD_CREATED":
            case "DISPATCH_STATUS_CHANGED":
              queryClient.invalidateQueries({ queryKey: ["dispatchRecords"] });
              queryClient.invalidateQueries({ queryKey: ["vehicles"] });
              queryClient.invalidateQueries({ queryKey: ["activities"] });
              break;
            case "ACTIVITY_EVENT_CREATED":
              queryClient.invalidateQueries({ queryKey: ["activities"] });
              break;
            case "NEW_NOTIFICATION":
              queryClient.invalidateQueries({ queryKey: ["notifications"] });
              break;
            case "ATTENDANCE_UPDATE":
              queryClient.invalidateQueries({ queryKey: ["attendanceAnalytics"] });
              queryClient.invalidateQueries({ queryKey: ["attendanceExceptions"] });
              queryClient.invalidateQueries({ queryKey: ["attendanceLogs"] });
              queryClient.invalidateQueries({ queryKey: ["workers"] });
              queryClient.invalidateQueries({ queryKey: ["workerSummary"] });
              queryClient.invalidateQueries({ queryKey: ["workerHistory"] });
              queryClient.invalidateQueries({ queryKey: ["workerMonthlySummary"] });
              break;
            case "LEAVE_UPDATE":
              queryClient.invalidateQueries({ queryKey: ["leaves"] });
              queryClient.invalidateQueries({ queryKey: ["attendanceAnalytics"] });
              break;
            case "JOB_ASSIGNED":
            case "JOB_STATUS_CHANGED":
              queryClient.invalidateQueries({ queryKey: ["workerJobs"] });
              break;
            default:
              break;
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message", err);
        }
      };

      ws.onclose = () => {
        if (isUnmounted) return;
        // Exponential backoff for reconnection
        const nextTimeout = Math.min(reconnectTimeout * 1.5, 30000);
        console.log(`WebSocket disconnected. Retrying in ${Math.round(nextTimeout / 1000)} seconds...`);
        timeoutId = setTimeout(() => {
          reconnectTimeout = nextTimeout;
          connect();
        }, nextTimeout);
      };

      ws.onerror = (err) => {
        if (isUnmounted) return;
        // Use console.warn instead of console.error to prevent Next.js from showing a full-screen error overlay
        console.warn("WebSocket connection failed. Retrying in background...", wsUrl);
        ws.close();
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      if (ws) {
        // Remove event listeners to avoid triggering onclose/onerror during unmount
        ws.onclose = null;
        ws.onerror = null;
        ws.onopen = null;
        ws.onmessage = null;
        ws.close();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [queryClient]);
}
