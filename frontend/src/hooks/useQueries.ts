import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  vehiclesApi, 
  workersApi, 
  qualityApi, 
  dispatchApi, 
  invoicesApi, 
  activitiesApi,
  notificationsApi,
  attendanceApi,
  payrollApi,
  jobsApi
} from "@/lib/api";
import type { Vehicle, Worker, QCRecord, DispatchRecord, ActivityEvent } from "@/types";

export function useVehicles() {
  return useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: vehiclesApi.getAll,
  });
}

export function useWorkers() {
  return useQuery<Worker[]>({
    queryKey: ["workers"],
    queryFn: workersApi.getAll,
  });
}

export function useAttendanceSettings() {
  return useQuery({
    queryKey: ["attendanceSettings"],
    queryFn: attendanceApi.getSettings,
  });
}

export function useQCRecords() {
  return useQuery<QCRecord[]>({
    queryKey: ["qcRecords"],
    queryFn: qualityApi.getAll,
  });
}

export function useDispatchRecords() {
  return useQuery<DispatchRecord[]>({
    queryKey: ["dispatchRecords"],
    queryFn: dispatchApi.getAll,
  });
}

export function useInvoices() {
  return useQuery<any[]>({
    queryKey: ["invoices"],
    queryFn: invoicesApi.getAll,
  });
}

export function useInvoiceDashboardStats() {
  return useQuery<any>({
    queryKey: ["invoiceStats"],
    queryFn: invoicesApi.getDashboardStats,
  });
}

export function useInvoiceAnalytics() {
  return useQuery<any>({
    queryKey: ["invoiceAnalytics"],
    queryFn: invoicesApi.getAnalytics,
  });
}

export function useActivities() {
  return useQuery<ActivityEvent[]>({
    queryKey: ["activities"],
    queryFn: activitiesApi.getAll,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getAll(),
  });
}

export function useAttendanceAnalytics() {
  return useQuery({
    queryKey: ["attendanceAnalytics"],
    queryFn: () => attendanceApi.getAnalytics(),
  });
}

export function useAttendanceLogs() {
  return useQuery({
    queryKey: ["attendanceLogs"],
    queryFn: () => attendanceApi.getLogs(),
  });
}

export function useAttendanceExceptions() {
  return useQuery({
    queryKey: ["attendanceExceptions"],
    queryFn: () => attendanceApi.getExceptions(),
  });
}

export function useApproveException() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number | string; reason: string }) => attendanceApi.approveException(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendanceExceptions"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceLogs"] });
    }
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => attendanceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendanceLogs"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceAnalytics"] });
    }
  });
}

// Mutations
export function useUpdateVehicleStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage, progress, priority, reason }: { id: number | string; stage: string; progress?: number; priority?: string; reason?: string }) =>
      vehiclesApi.updateStage(id, stage, progress, priority, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["dispatchRecords"] });
    },
  });
}

export function useVerifyVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => vehiclesApi.verify(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useRejectVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number | string; reason: string }) => vehiclesApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useUpdateWorkerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: number | string; status: string; reason: string }) =>
      workersApi.updateStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
  });
}

export function useArchiveWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number | string; reason: string }) =>
      workersApi.archive(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
  });
}

export function useResetWorkerPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number | string; reason: string }) =>
      workersApi.resetPassword(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
  });
}

export function useCreateQCRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => qualityApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qcRecords"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useUpdateQCRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => qualityApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qcRecords"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useUploadQCPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number | string; file: File }) => qualityApi.uploadPhoto(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qcRecords"] });
    },
  });
}

export function useCreateDefect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => qualityApi.createDefect(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qcRecords"] });
    },
  });
}

export function useCreateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
  });
}

export function useUpdateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => workersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
  });
}

export function useUpdateDefectStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: string }) => qualityApi.updateDefectStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qcRecords"] });
    },
  });
}

export function useCreateDispatchRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => dispatchApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatchRecords"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useUpdateDispatchRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => dispatchApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatchRecords"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useUploadInvoice() {
  return useMutation({
    mutationFn: (file: File) => invoicesApi.upload(file),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => invoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoiceStats"] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) =>
      invoicesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoiceStats"] });
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => vehiclesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useOemSubmitVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => vehiclesApi.oemSubmit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkNotificationClicked() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => notificationsApi.markAsClicked(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useEmployeePayroll(month?: string) {
  return useQuery({
    queryKey: ["employeePayroll", month],
    queryFn: () => payrollApi.getEmployeePayroll(month),
  });
}

export function useUpdateEmployeePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => payrollApi.updateEmployeePayroll(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeePayroll"] });
    }
  });
}

export function useGeneratePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (month?: string) => payrollApi.generate(month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeePayroll"] });
    }
  });
}

export function useWorkerSummary(workerId: string | number) {
  return useQuery({
    queryKey: ["workerSummary", workerId],
    queryFn: () => attendanceApi.getWorkerSummary(workerId),
    enabled: !!workerId,
  });
}

export function useWorkerHistory(workerId: string | number) {
  return useQuery({
    queryKey: ["workerHistory", workerId],
    queryFn: () => attendanceApi.getWorkerHistory(workerId),
    enabled: !!workerId,
  });
}

export function useWorkerMonthlySummary(workerId: string | number, month?: string) {
  return useQuery({
    queryKey: ["workerMonthlySummary", workerId, month],
    queryFn: () => attendanceApi.getWorkerMonthlySummary(workerId, month),
    enabled: !!workerId,
  });
}

export const useWorkerJobs = (workerId: string | number | undefined) => {
  return useQuery({
    queryKey: ["workerJobs", workerId],
    queryFn: () => jobsApi.getWorkerJobs(workerId!),
    enabled: !!workerId,
  });
};

export const useLeaveHistory = (workerId: string | number | undefined) => {
  return useQuery({
    queryKey: ["leaveHistory", workerId],
    queryFn: () => attendanceApi.getLeaveHistory(workerId!),
    enabled: !!workerId,
  });
};

export function useSubmitPunch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => attendanceApi.update(data.worker_id, data), // This should actually be whatever the punch API is, or offline queue logic
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workerSummary", variables.worker_id] });
      queryClient.invalidateQueries({ queryKey: ["workerHistory", variables.worker_id] });
      queryClient.invalidateQueries({ queryKey: ["workerMonthlySummary", variables.worker_id] });
    }
  });
}
