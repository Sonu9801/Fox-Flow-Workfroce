import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/worker',
  // Assuming JWT auth is handled via cookies or interceptors in the project
});

export interface JobPhoto {
  id: number;
  job_id: number;
  photo_url: string;
  photo_type: string;
  timestamp: string;
  remarks?: string;
}

export interface WorkerJob {
  id: number;
  vehicle_id: number;
  stage: string;
  status: string;
  start_time?: string;
  end_time?: string;
  job_number?: string;
  customer?: string;
  site?: string;
  priority?: string;
  instructions?: string;
  required_material?: string;
  machine_required?: string;
  qc_checklist_url?: string;
  drawing_url?: string;
  progress_percent?: number;
  assigned_date?: string;
  expected_completion?: string;
  photos: JobPhoto[];
}

export interface WorkerDashboardStats {
  present_days: number;
  absent_days: number;
  leave_days: number;
  ot_hours: number;
  sunday_worked: number;
  total_assigned_jobs: number;
  pending_jobs: number;
  in_progress_jobs: number;
  completed_today: number;
}

export interface PerformanceStats {
  jobs_completed: number;
  avg_completion_time_hrs: number;
  attendance_percent: number;
  ot_hours: number;
  performance_score: number;
  monthly_trend: string;
}

// Queries
export const useWorkerDashboard = () => {
  return useQuery({
    queryKey: ['worker', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get<WorkerDashboardStats>('/dashboard');
      return data;
    },
  });
};

export const useWorkerJobs = (statusFilter?: string) => {
  return useQuery({
    queryKey: ['worker', 'jobs', statusFilter],
    queryFn: async () => {
      const params = statusFilter && statusFilter !== 'All' ? { status_filter: statusFilter } : {};
      const { data } = await api.get<WorkerJob[]>('/jobs', { params });
      return data;
    },
  });
};

export const useJobDetails = (id: string | number) => {
  return useQuery({
    queryKey: ['worker', 'jobs', id],
    queryFn: async () => {
      const { data } = await api.get<WorkerJob>(`/jobs/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const usePerformanceStats = () => {
  return useQuery({
    queryKey: ['worker', 'performance'],
    queryFn: async () => {
      const { data } = await api.get<PerformanceStats>('/performance');
      return data;
    },
  });
};

// Mutations
export const useStartJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<WorkerJob>(`/jobs/${id}/start`);
      return data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['worker', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['worker', 'dashboard'] });
    },
  });
};

export const usePauseJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<WorkerJob>(`/jobs/${id}/pause`);
      return data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['worker', 'jobs'] });
    },
  });
};

export const useResumeJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<WorkerJob>(`/jobs/${id}/resume`);
      return data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['worker', 'jobs'] });
    },
  });
};

export const useCompleteJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<WorkerJob>(`/jobs/${id}/complete`);
      return data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['worker', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['worker', 'dashboard'] });
    },
  });
};

export const useUploadProgressPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const { data } = await api.post(`/jobs/${id}/progress-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['worker', 'jobs', id] });
    },
  });
};

export const useUploadCompletionPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const { data } = await api.post(`/jobs/${id}/completion-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['worker', 'jobs', id] });
    },
  });
};
