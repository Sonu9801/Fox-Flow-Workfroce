export type Priority = "normal" | "high" | "urgent";
export type Stage = "oem" | "incoming_verification" | "supervisor_verification" | "received" | "fabrication" | "paint" | "quality" | "rtd" | "dispatch" | "delivered" | "rejected";
export type WorkerStatus = "active" | "break" | "offline";
export type QCResult = "passed" | "failed" | "conditional";
export type DispatchStatus =
  | "pending"
  | "scheduled"
  | "in_transit"
  | "dispatched";
export type ActivityEventType =
  | "worker_started"
  | "qc_passed"
  | "qc_failed"
  | "vehicle_dispatched"
  | "emergency_created"
  | "stage_changed";

export interface Vehicle {
  id: string;
  trackingId: string;
  vehicleNumber: string;
  productCategory: string;
  oemName: string;
  priority: Priority;
  currentStage: Stage;
  assignedWorkerIds: string[];
  receivedAt: string;
  estimatedDelivery: string;
  progressPercent: number;
  notes: string;
  driverName?: string;
  driverMobileNumber?: string;
  transportCompany?: string;
  truckNumber?: string;
  lrNumber?: string;
  invoiceNumber?: string;
  dispatchChallanNumber?: string;
  dispatchDateTime?: string | null;
  expectedArrivalDateTime?: string | null;
  documentsUrl?: string | null;
  remarks?: string | null;
  rejectionReason?: string | null;

  // Verification Fields
  verificationStatus: "pending" | "verified" | "rejected" | "approved" | "hold";
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  arrivalTime?: string | null;
  arrivalPhotos?: string | null;
  verificationNotes?: string | null;
  platformNumber?: string | null;
  chassisNumber?: string | null;
  vin?: string | null;
  dealerName?: string | null;
  vehicleModel?: string | null;
  vehicleType?: string | null;
  submittedByOem?: string | null;
  submittedAt?: string | null;
  gateEntryTime?: string | null;
  gateEntryNumber?: string | null;
  holdReason?: string | null;
  expectedResolution?: string | null;
  dispatchLocation?: string | null;
  currentLocation?: string | null;
  arrivalLocation?: string | null;
  dispatchCoordinates?: string | null;
  arrivalCoordinates?: string | null;
  productionJobs?: ProductionJob[];
  workers?: Worker[];
  qcStatus?: string;
}

export interface Worker {
  id: string;
  name: string;
  employeeId: string;
  status: WorkerStatus;
  currentTaskId: string | null;
  hoursToday: number;
  department: string;
  performanceScore: number;
  mobileNumber?: string;
  designation?: string;
  role: string;
  joiningDate?: string;
  profilePhotoUrl?: string;
  shiftStart: string;
  shiftEnd: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  shiftType: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelationship?: string;
  address?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  employmentStatus: string;
  faceRegistrationStatus: string;
  salaryProfile?: SalaryProfile;
  attendance?: any;
  salary?: any;
  baseSalary?: number;
  paymentFrequency?: string;
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
}

export interface SalaryProfile {
  salaryType: string;
  monthlySalary?: number;
  dailyWage?: number;
  otRatePerHour: number;
  sundayRatePerHour: number;
}

export interface DefectRecord {
  id: number;
  qcRecordId: number;
  vehicleId: number;
  defectType: string;
  severity: string;
  category: string;
  description: string;
  responsibleDepartment?: string;
  responsibleWorkerId?: number;
  targetResolutionDate?: string;
  status: string;
}

export interface QCRecord {
  id: number;
  vehicleId: number;
  inspectorId?: number;
  stage: string;
  status: string; // Pending, In Progress, Passed, Failed, Rework
  expectedTime?: string;
  startTime?: string;
  endTime?: string;
  checklist?: any[];
  photos?: string[];
  signature?: any;
  defects: DefectRecord[];
  // Legacy
  inspectorName?: string;
  inspectedAt?: string;
  result?: string;
  defectsFound?: number; // legacy number of defects
  notes?: string;
}

export interface DispatchRecord {
  id: number;
  vehicleId: number;
  scheduledDate: string;
  carrier: string;
  status: string; // Scheduled, InTransit, Delivered
  destination: string;
  trackingNumber: string;
  deliveredTime?: string | null;
  receiverName?: string | null;
  receiverSignature?: string | null;
  deliveryPhoto?: string | null;
  deliveryRemarks?: string | null;
}

export interface InventoryItem {
  id: string;
  partName: string;
  sku: string;
  stockLevel: number;
  reorderLevel: number;
  location: string;
  updatedAt: string;
}

export interface ActivityEvent {
  id: number;
  eventType: string;
  description: string;
  vehicleId?: number;
  workerId?: number;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
  editedBy?: string;
  reason?: string;
}

export interface DashboardStats {
  vehiclesReceived: number;
  inFabrication: number;
  inPaint: number;
  readyToDispatch: number;
  dispatchToday: number;
  delayedOrders: number;
  emergencyOrders: number;
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  target_url?: string;
}

export interface ProductionJob {
  id: number;
  vehicle_id: number;
  stage: string;
  status: "not_started" | "assigned" | "in_progress" | "paused" | "completed" | "rejected" | "rework";
  supervisor_id?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  expected_duration_minutes?: number | null;
  photo_proof_url?: string | null;
  comments?: string | null;
  workers?: Worker[];
  qcStatus?: string;
}
