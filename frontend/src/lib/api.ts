import axios from "axios";

const getApiUrl = () => {
  if (typeof window === "undefined") return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  return "/api";
};

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true"
  },
});

import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

declare global {
  interface Window {
    _lastTimeoutToast?: number;
  }
}

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token") || localStorage.getItem("worker_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Ignore if the request was to /auth/login, /auth/refresh, or /auth/register to prevent infinite loops
    if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/register')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = typeof window !== "undefined" ? (localStorage.getItem("refreshToken") || localStorage.getItem("worker_refreshToken")) : null;
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        
        const response = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken });
        const newToken = response.data.access_token;
        
        if (typeof window !== "undefined") {
          if (localStorage.getItem("worker_token")) {
            localStorage.setItem("worker_token", newToken);
            const infoStr = localStorage.getItem("worker_info");
            if (infoStr) {
              try {
                const info = JSON.parse(infoStr);
                info.access_token = newToken;
                localStorage.setItem("worker_info", JSON.stringify(info));
              } catch (e) {}
            }
          } else {
            useAuthStore.getState().updateToken(newToken);
          }
        }
        
        processQueue(null, newToken);
        originalRequest.headers.Authorization = 'Bearer ' + newToken;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        if (typeof window !== "undefined") {
          const isWorker = !!localStorage.getItem("worker_token");
          if (isWorker) {
            localStorage.clear();
            window.location.href = '/workforce/login';
          } else {
            useAuthStore.getState().logout();
            window.location.href = '/login';
          }
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Handle Ngrok/Cloudflare timeouts (504) or Network Errors
    if (error.response?.status === 504 || error.message === 'Network Error') {
      console.warn("Server timeout or network error. It might be reloading.");
      if (typeof window !== "undefined" && !window.location.pathname.includes('/login')) {
        // Only show toast once every few seconds to avoid spam
        if (!window._lastTimeoutToast || Date.now() - window._lastTimeoutToast > 5000) {
          window._lastTimeoutToast = Date.now();
          toast.error("Server is reconnecting. Please wait a moment...", { id: "network-timeout" });
        }
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (email: string, name: string, role = "operator", dealer_name?: string) => {
    const payload: any = { email, name, role };
    if (dealer_name) payload.dealer_name = dealer_name;
    const response = await api.post("/auth/register", payload);
    return response.data;
  },
  requestOtp: async (email: string) => {
    const response = await api.post("/auth/request-otp", { email });
    return response.data;
  },
  verifyOtp: async (email: string, otp_code: string) => {
    const response = await api.post("/auth/verify-otp", { email, otp_code });
    return response.data;
  },
  refresh: async (refreshToken: string) => {
    const response = await api.post("/auth/refresh", { refresh_token: refreshToken });
    return response.data;
  },
  me: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

export const vehiclesApi = {
  getAll: async () => {
    const response = await api.get("/vehicles");
    return response.data;
  },
  getOne: async (id: number | string) => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/vehicles", data);
    return response.data;
  },
  oemSubmit: async (data: any) => {
    const response = await api.post("/vehicles/oem-dispatch", data);
    return response.data;
  },
  update: async (id: number | string, data: any) => {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data;
  },
  updateStage: async (id: number | string, stage: string, progress?: number, priority?: string, reason?: string) => {
    const data: any = { stage };
    if (progress !== undefined) data.progress_percent = progress;
    if (priority !== undefined) data.priority = priority;
    if (reason !== undefined) data.reason = reason;
    const response = await api.patch(`/vehicles/${id}/stage`, data);
    return response.data;
  },
  verify: async (id: number | string, data: any) => {
    const response = await api.post(`/vehicles/${id}/verify`, data);
    return response.data;
  },
  reject: async (id: number | string, reason: string) => {
    const response = await api.post(`/vehicles/${id}/reject`, { reason });
    return response.data;
  },
};

export const workersApi = {
  getAll: async () => {
    const response = await api.get("/workers");
    return response.data;
  },
  getOne: async (id: number | string) => {
    const response = await api.get(`/workers/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/workers", data);
    return response.data;
  },
  update: async (id: number | string, data: any) => {
    const response = await api.put(`/workers/${id}`, data);
    return response.data;
  },
  updateStatus: async (id: number | string, status: string, reason: string = "") => {
    const response = await api.patch(`/workers/${id}/status`, { status, reason });
    return response.data;
  },
  archive: async (id: number | string, reason: string) => {
    const response = await api.post(`/workers/${id}/archive`, { reason });
    return response.data;
  },
  resetPassword: async (id: number | string, reason: string) => {
    const response = await api.post(`/workers/${id}/reset-password`, { reason });
    return response.data;
  }
};

export const qualityApi = {
  getAll: async () => {
    const response = await api.get("/quality");
    return response.data;
  },
  getOne: async (id: number | string) => {
    const response = await api.get(`/quality/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/quality", data);
    return response.data;
  },
  update: async (id: number | string, data: any) => {
    const response = await api.put(`/quality/${id}`, data);
    return response.data;
  },
  uploadPhoto: async (id: number | string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/quality/${id}/photos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  createDefect: async (data: any) => {
    const response = await api.post("/quality/defects", data);
    return response.data;
  },
  updateDefectStatus: async (id: number | string, status: string) => {
    const response = await api.put(`/quality/defects/${id}/status?status_str=${encodeURIComponent(status)}`);
    return response.data;
  },
};

export const dispatchApi = {
  getAll: async () => {
    const response = await api.get("/dispatch");
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/dispatch", data);
    return response.data;
  },
  update: async (id: number | string, data: any) => {
    const response = await api.put(`/dispatch/${id}`, data);
    return response.data;
  },
  updateStatus: async (id: number | string, status: string) => {
    const response = await api.patch(`/dispatch/${id}/status`, { status });
    return response.data;
  },
};

export const invoicesApi = {
  getAll: async () => {
    const response = await api.get("/invoices");
    return response.data;
  },
  getOne: async (id: number | string) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },
  getDashboardStats: async () => {
    const response = await api.get("/invoices/dashboard-stats");
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get("/invoices/analytics");
    return response.data;
  },
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/invoices/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/invoices", data);
    return response.data;
  },
  update: async (id: number | string, data: any) => {
    const response = await api.patch(`/invoices/${id}`, data);
    return response.data;
  },
};

export const activitiesApi = {
  getAll: async () => {
    const response = await api.get("/activities");
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/activities", data);
    return response.data;
  },
};

export const notificationsApi = {
  getAll: async (unreadOnly: boolean = false) => {
    const response = await api.get(`/notifications?unread_only=${unreadOnly}`);
    return response.data;
  },
  markAsRead: async (id: number | string) => {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },
  markAsClicked: async (id: number | string) => {
    const response = await api.post(`/notifications/${id}/click`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.post("/notifications/read-all");
    return response.data;
  },
};

export const attendanceApi = {
  getSettings: async () => {
    const response = await api.get("/settings/attendance");
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get("/attendance/analytics");
    return response.data;
  },
  getLogs: async () => {
    const response = await api.get("/attendance/logs/detailed");
    return response.data;
  },
  getAll: async () => {
    const response = await api.get("/attendance");
    return response.data;
  },
  getExceptions: async () => {
    const response = await api.get("/attendance/exceptions");
    return response.data;
  },
  approveException: async (id: number | string, reason: string) => {
    const response = await api.put(`/attendance/exceptions/${id}/approve`, { reason });
    return response.data;
  },
  update: async (id: number | string, data: any) => {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  },
  getWorkerSummary: async (workerId: string | number) => {
    const response = await api.get(`/attendance/worker/${workerId}/summary`);
    return response.data;
  },
  getWorkerHistory: async (workerId: string | number) => {
    const response = await api.get(`/attendance/worker/${workerId}/history`);
    return response.data;
  },
  getWorkerMonthlySummary: async (workerId: string | number, month?: string) => {
    const url = month ? `/attendance/worker/${workerId}/monthly-summary?month=${month}` : `/attendance/worker/${workerId}/monthly-summary`;
    const response = await api.get(url);
    return response.data;
  },
  submitCorrection: async (workerId: string | number, dateStr: string, type: string, notes: string) => {
    const response = await api.post(`/attendance/exceptions?worker_id=${workerId}&date_str=${dateStr}&type=${encodeURIComponent(type)}&notes=${encodeURIComponent(notes)}`);
    return response.data;
  },
  applyLeave: async (workerId: string | number, startDate: string, endDate: string, type: string, reason: string) => {
    const response = await api.post(`/leave/`, {
      worker_id: Number(workerId),
      start_date: startDate,
      end_date: endDate,
      leave_type: type,
      reason: reason
    });
    return response.data;
  },
  getLeaveHistory: async (workerId: string | number) => {
    const response = await api.get(`/leave/worker/${workerId}`);
    return response.data;
  },
  updateProfile: async (workerId: string | number, profileData: any) => {
    const response = await api.put(`/workers/${workerId}/profile_edit`, profileData);
    return response.data;
  },
  getDocuments: async (workerId: string | number) => {
    const response = await api.get(`/documents/worker/${workerId}`);
    return response.data;
  },
  getSalaryHistory: async (workerId: string | number) => {
    const response = await api.get(`/payroll/worker/${workerId}`);
    return response.data;
  },
  getTeamSummary: async (managerId: string | number) => {
    const response = await api.get(`/team/summary/${managerId}`);
    return response.data;
  },
  getPendingRequests: async (managerId: string | number) => {
    const response = await api.get(`/team/pending-requests/${managerId}`);
    return response.data;
  }
};

export const jobsApi = {
  assign: async (data: any) => {
    const response = await api.post("/jobs/assign", data);
    return response.data;
  },
  getWorkerJobs: async (workerId: string | number) => {
    const response = await api.get(`/jobs/worker/${workerId}`);
    return response.data;
  },
  updateStatus: async (jobId: string | number, data: any) => {
    const response = await api.patch(`/jobs/${jobId}/status`, data);
    return response.data;
  }
};

export const payrollApi = {
  getEmployeePayroll: async (month?: string) => {
    const params = month ? { month } : {};
    const response = await api.get("/payroll/employees", { params });
    return response.data;
  },
  updateEmployeePayroll: async (workerId: number | string, data: any) => {
    const response = await api.put(`/payroll/employees/${workerId}`, data);
    return response.data;
  },
  generate: async (month?: string) => {
    const params = month ? { month } : {};
    const response = await api.post("/payroll/generate", null, { params });
    return response.data;
  }
};

export const leaveApi = {
  getAll: async () => {
    const response = await api.get("/leave");
    return response.data;
  },
  updateStatus: async (id: number | string, data: { status: string, remarks?: string }) => {
    const response = await api.put(`/leave/${id}/status`, data);
    return response.data;
  }
};

export const componentsApi = {
  startTask: async (component_type: string, component_number: string) => {
    const response = await api.post("/components/start", { component_type, component_number });
    return response.data;
  },
  submitTask: async (task_id: number, photo_proof_url: string, notes?: string) => {
    const response = await api.post(`/components/${task_id}/submit`, { photo_proof_url, notes });
    return response.data;
  },
  getWorkerTasks: async (worker_id: number) => {
    const response = await api.get(`/components/worker/${worker_id}`);
    return response.data;
  },
  getAllTasks: async () => {
    const response = await api.get("/components");
    return response.data;
  }
};

