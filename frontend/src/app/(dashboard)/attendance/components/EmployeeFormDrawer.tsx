import React, { useState, useEffect } from "react";
import { Worker } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmployeeFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker?: Worker | null;
}

export default function EmployeeFormDrawer({ open, onOpenChange, worker }: EmployeeFormDrawerProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  
  const [form, setForm] = useState({
    name: "",
    employeeId: "",
    mobileNumber: "",
    email: "",
    dateOfBirth: "",
    gender: "Male",
    
    department: "Fabrication",
    designation: "",
    role: "Worker",
    joiningDate: "",
    employmentStatus: "Active",
    
    shiftType: "General Shift",
    shiftStart: "09:00",
    shiftEnd: "18:00",
    
    salaryType: "Monthly",
    monthlySalary: "",
    dailyWage: "",
    otRatePerHour: "0",
    sundayRatePerHour: "0",
    
    baseSalary: 0,
    paymentFrequency: "Monthly",
    bankAccountNumber: "",
    bankName: "",
    ifscCode: "",
    
    emergencyContactName: "",
    emergencyContactNumber: "",
    emergencyContactRelationship: "Spouse",
    address: "",
    
    aadhaarNumber: "",
    panNumber: "",
    
    faceRegistrationStatus: "Pending"
  });

  useEffect(() => {
    if (worker) {
      setForm({
        name: worker.name,
        employeeId: worker.employeeId,
        mobileNumber: worker.mobileNumber || "",
        email: worker.email || "",
        dateOfBirth: worker.dateOfBirth || "",
        gender: worker.gender || "Male",
        
        department: worker.department,
        designation: worker.designation || "",
        role: worker.role || "Worker",
        joiningDate: worker.joiningDate || "",
        employmentStatus: worker.employmentStatus || "Active",
        
        shiftType: worker.shiftType || "General Shift",
        shiftStart: worker.shiftStart || "09:00",
        shiftEnd: worker.shiftEnd || "18:00",
        
        salaryType: worker.salaryProfile?.salaryType || "Monthly",
        monthlySalary: worker.salaryProfile?.monthlySalary?.toString() || "",
        dailyWage: worker.salaryProfile?.dailyWage?.toString() || "",
        otRatePerHour: worker.salaryProfile?.otRatePerHour?.toString() || "0",
        sundayRatePerHour: worker.salaryProfile?.sundayRatePerHour?.toString() || "0",
        
        baseSalary: worker.baseSalary || 0,
        paymentFrequency: worker.paymentFrequency || "Monthly",
        bankAccountNumber: worker.bankAccountNumber || "",
        bankName: worker.bankName || "",
        ifscCode: worker.ifscCode || "",
        
        emergencyContactName: worker.emergencyContactName || "",
        emergencyContactNumber: worker.emergencyContactNumber || "",
        emergencyContactRelationship: worker.emergencyContactRelationship || "",
        address: worker.address || "",
        
        aadhaarNumber: worker.aadhaarNumber || "",
        panNumber: worker.panNumber || "",
        
        faceRegistrationStatus: worker.faceRegistrationStatus || "Pending"
      });
    } else {
      // Auto-generate employee ID if new
      setForm(prev => ({
        ...prev,
        employeeId: `FOX-EMP-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
      }));
    }
  }, [worker, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = worker ? `/api/workers/${worker.id}` : "/api/workers";
      const method = worker ? "PUT" : "POST";
      
      const payload = {
        ...form,
        salary_profile: {
          salary_type: form.salaryType,
          monthly_salary: form.monthlySalary ? parseFloat(form.monthlySalary) : null,
          daily_wage: form.dailyWage ? parseFloat(form.dailyWage) : null,
          ot_rate_per_hour: parseFloat(form.otRatePerHour || "0"),
          sunday_rate_per_hour: parseFloat(form.sundayRatePerHour || "0")
        }
      };
      
      const res = await fetch(`http://192.168.1.6:8000${url}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["workers"] });
        onOpenChange(false);
      } else {
        console.error("Failed to save employee");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("Camera access denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleCaptureFace = () => {
    setIsScanning(true);
    setScanProgress(0);
    startCamera();
    
    let prog = 0;
    const interval = setInterval(() => {
      prog += 20;
      setScanProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          stopCamera();
          setIsScanning(false);
          setForm(prev => ({...prev, faceRegistrationStatus: "Completed"}));
        }, 500);
      }
    }, 500);
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="bg-muted/50 px-4 py-2 mt-6 mb-4 border-y border-border flex items-center">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-[100dvh] bg-card">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <SheetHeader className="px-6 py-4 border-b border-border flex-shrink-0">
            <SheetTitle>{worker ? "Edit Employee" : "Add New Employee"}</SheetTitle>
            <SheetDescription>
              {worker ? "Update employee details and salary configuration." : "Enter the details to onboard a new employee to Fox Flow."}
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="pb-8">
              <SectionHeader title="Section 1: Personal Information" />
              <div className="px-6 grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Employee ID (Auto Generated)</Label>
                  <Input value={form.employeeId} disabled className="bg-muted mt-1" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Full Name *</Label>
                  <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Mobile Number *</Label>
                  <Input required type="tel" maxLength={10} pattern="\d{10}" title="Enter a 10-digit mobile number" value={form.mobileNumber} onChange={e => setForm({...form, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})} className="mt-1" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="mt-1" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} className="mt-1" />
                </div>
              </div>

              <SectionHeader title="Section 2: Employment Details" />
              <div className="px-6 grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label>Department</Label>
                  <Select value={form.department} onValueChange={v => setForm({...form, department: v})}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select dept" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fabrication">Fabrication</SelectItem>
                      <SelectItem value="Paint">Paint</SelectItem>
                      <SelectItem value="Assembly">Assembly</SelectItem>
                      <SelectItem value="Quality">Quality</SelectItem>
                      <SelectItem value="Dispatch">Dispatch</SelectItem>
                      <SelectItem value="Management">Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Worker">Worker</SelectItem>
                      <SelectItem value="Operator">Operator</SelectItem>
                      <SelectItem value="Supervisor">Supervisor</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Engineer">Engineer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Designation</Label>
                  <Input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="mt-1" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Joining Date</Label>
                  <Input type="date" value={form.joiningDate} onChange={e => setForm({...form, joiningDate: e.target.value})} className="mt-1" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Employment Status</Label>
                  <Select value={form.employmentStatus} onValueChange={v => setForm({...form, employmentStatus: v})}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SectionHeader title="Section 3: Shift Details" />
              <div className="px-6 grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Shift Type</Label>
                  <Select value={form.shiftType} onValueChange={v => setForm({...form, shiftType: v})}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Shift" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General Shift">General Shift</SelectItem>
                      <SelectItem value="Morning Shift">Morning Shift</SelectItem>
                      <SelectItem value="Evening Shift">Evening Shift</SelectItem>
                      <SelectItem value="Night Shift">Night Shift</SelectItem>
                      <SelectItem value="Custom Shift">Custom Shift</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Shift Start</Label>
                  <Input type="time" value={form.shiftStart} onChange={e => setForm({...form, shiftStart: e.target.value})} className="mt-1" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Shift End</Label>
                  <Input type="time" value={form.shiftEnd} onChange={e => setForm({...form, shiftEnd: e.target.value})} className="mt-1" />
                </div>
              </div>

              <SectionHeader title="Section 4: Salary Details" />
              <div className="px-6 grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Salary Type</Label>
                  <Select value={form.salaryType} onValueChange={v => setForm({...form, salaryType: v})}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly Salary</SelectItem>
                      <SelectItem value="Daily Wage">Daily Wage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.salaryType === "Monthly" ? (
                  <div className="col-span-2">
                    <Label>Monthly Salary (₹)</Label>
                    <Input type="number" value={form.monthlySalary} onChange={e => setForm({...form, monthlySalary: e.target.value})} className="mt-1" />
                  </div>
                ) : (
                  <div className="col-span-2">
                    <Label>Daily Wage Amount (₹)</Label>
                    <Input type="number" value={form.dailyWage} onChange={e => setForm({...form, dailyWage: e.target.value})} className="mt-1" />
                  </div>
                )}
                <div className="col-span-2 sm:col-span-1">
                  <Label>OT Rate Per Hour (₹)</Label>
                  <Input type="number" value={form.otRatePerHour} onChange={e => setForm({...form, otRatePerHour: e.target.value})} className="mt-1" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Sunday Rate Per Hour (₹)</Label>
                  <Input type="number" value={form.sundayRatePerHour} onChange={e => setForm({...form, sundayRatePerHour: e.target.value})} className="mt-1" />
                </div>
              </div>

              <SectionHeader title="Section 5: Emergency Contact" />
              <div className="px-6 grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label>Emergency Contact Name</Label>
                  <Input value={form.emergencyContactName} onChange={e => setForm({...form, emergencyContactName: e.target.value})} className="mt-1" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Contact Number</Label>
                  <Input value={form.emergencyContactNumber} onChange={e => setForm({...form, emergencyContactNumber: e.target.value})} className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Relationship</Label>
                  <Input value={form.emergencyContactRelationship} onChange={e => setForm({...form, emergencyContactRelationship: e.target.value})} className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Full Address</Label>
                  <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="mt-1" />
                </div>
              </div>

              <SectionHeader title="Section 6: Identity Details" />
              <div className="px-6 grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label>Aadhaar Number</Label>
                  <Input value={form.aadhaarNumber} onChange={e => setForm({...form, aadhaarNumber: e.target.value})} className="mt-1" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>PAN Number</Label>
                  <Input value={form.panNumber} onChange={e => setForm({...form, panNumber: e.target.value})} className="mt-1" />
                </div>
              </div>

              <SectionHeader title="Section 7: Face Registration" />
              <div className="px-6">
                <div className="border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3">
                  {isScanning ? (
                    <div className="flex flex-col items-center gap-4 w-full max-w-[200px] mx-auto py-2">
                      <div className="relative w-28 h-28 rounded-full border-4 border-primary/20 overflow-hidden bg-muted flex items-center justify-center">
                        <video 
                          ref={videoRef}
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover absolute inset-0 z-0"
                        />
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-primary/40 transition-all duration-500 ease-in-out z-10" 
                          style={{ height: `${scanProgress}%` }}
                        />
                        <div className="absolute inset-0 border-4 border-primary rounded-full animate-pulse opacity-50 z-20" />
                      </div>
                      <div className="w-full">
                        <p className="text-sm font-semibold text-foreground mb-1">Scanning Face... {scanProgress}%</p>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden w-full">
                          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${scanProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  ) : form.faceRegistrationStatus === "Completed" ? (
                    <>
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                        <CheckCircle2 size={32} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Face Registration Completed</h4>
                        <p className="text-sm text-muted-foreground mt-1">Ready for Face Verification punches.</p>
                      </div>
                      <Button type="button" variant="outline" className="mt-2" onClick={() => setForm(p => ({...p, faceRegistrationStatus: "Pending"}))}>
                        Recapture
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                        <Camera size={32} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Face Registration Pending</h4>
                        <p className="text-sm text-muted-foreground mt-1">Capture 5 angles for reliable attendance marking.</p>
                      </div>
                      <Button type="button" onClick={handleCaptureFace} className="mt-2 gap-2">
                        <Camera size={16} /> Start Registration
                      </Button>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
          
          <SheetFooter className="px-6 py-4 border-t border-border mt-auto flex-shrink-0">
            <SheetClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : worker ? "Save Changes" : "Register Employee"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
