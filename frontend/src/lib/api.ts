import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.6:8000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true"
  },
});

import { useAuthStore } from "@/store/authStore";

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
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
    
    // Ignore if the request was to /auth/login or /auth/refresh to prevent infinite loops
    if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
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
        const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        
        const response = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken });
        const newToken = response.data.access_token;
        
        if (typeof window !== "undefined") {
          useAuthStore.getState().updateToken(newToken);
        }
        
        processQueue(null, newToken);
        originalRequest.headers.Authorization = 'Bearer ' + newToken;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (typeof window !== "undefined") {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    const response = await api.post("/auth/login", formData, {
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "ngrok-skip-browser-warning": "true"
      },
    });
    return response.data;
  },
  register: async (username: string, password: string, role = "operator") => {
    const response = await api.post("/auth/register", { username, password, role });
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
    const response = await api.get("/vehicles/");
    return response.data;
  },
  getOne: async (id: number | string) => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/vehicles/", data);
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
    const response = await api.get("/workers/");
    return response.data;
  },
  getOne: async (id: number | string) => {
    const response = await api.get(`/workers/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/workers/", data);
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
    const response = await api.get("/quality/");
    return response.data;
  },
  getOne: async (id: number | string) => {
    const response = await api.get(`/quality/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/quality/", data);
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
    const response = await api.get("/dispatch/");
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/dispatch/", data);
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

export const inventoryApi = {
  getAll: async () => {
    const response = await api.get("/inventory/");
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/inventory/", data);
    return response.data;
  },
  update: async (id: number | string, data: any) => {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },
  adjustStock: async (id: number | string, quantity: number) => {
    const response = await api.patch(`/inventory/${id}/stock`, { quantity });
    return response.data;
  },
};

export const activitiesApi = {
  getAll: async () => {
    const response = await api.get("/activities/");
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/activities/", data);
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
  getAnalytics: async () => {
    const response = await api.get("/attendance/analytics");
    return response.data;
  },
  getLogs: async () => {
    const response = await api.get("/attendance/logs/detailed");
    return response.data;
  },
  getAll: async () => {
    const response = await api.get("/attendance/");
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

