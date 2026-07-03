import React from "react";
import { Worker } from "@/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  User, Mail, Phone, Calendar, Clock, MapPin, 
  Briefcase, CheckCircle2, TrendingUp, CalendarDays,
  IndianRupee, X, Edit2
} from "lucide-react";

interface EmployeeProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: Worker | null;
  onEditClick: (worker: Worker) => void;
}

export default function EmployeeProfileDrawer({ open, onOpenChange, worker, onEditClick }: EmployeeProfileDrawerProps) {
  const DetailItem = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <Icon className="text-muted-foreground mt-0.5" size={16} />
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm text-foreground font-medium mt-0.5">{value || "N/A"}</p>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-card">
        <SheetHeader className="sr-only">
          <SheetTitle>Employee Profile</SheetTitle>
          <SheetDescription>Details of the selected employee</SheetDescription>
        </SheetHeader>
        {worker && (
          <>
            {/* Custom Header with Background */}
            <div className="relative h-32 bg-primary/10 flex-shrink-0">
              <div className="absolute -bottom-10 left-6">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold border-4 border-card shadow-sm">
                  {worker.name.charAt(0)}
                </div>
              </div>
            </div>

            <div className="px-6 pt-12 pb-4 border-b border-border flex-shrink-0 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-foreground">{worker.name}</h2>
                <p className="text-sm text-muted-foreground">{worker.employeeId} • {worker.designation || worker.role}</p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    {worker.employmentStatus}
                  </Badge>
                  <Badge variant="outline" className="bg-muted">
                    {worker.department}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={() => { onOpenChange(false); onEditClick(worker); }}>
                <Edit2 size={16} />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 flex flex-col gap-6">
                
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><CalendarDays size={14}/> Attendance</p>
                    <p className="text-lg font-semibold mt-1">92%</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock size={14}/> OT Hours</p>
                    <p className="text-lg font-semibold mt-1">12.5 hrs</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><TrendingUp size={14}/> Sunday Work</p>
                    <p className="text-lg font-semibold mt-1">1 day</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><IndianRupee size={14}/> Est. Salary</p>
                    <p className="text-lg font-semibold mt-1">₹18,500</p>
                  </div>
                </div>

                {/* Personal Details */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Personal Details</h3>
                  <div className="bg-muted/20 border border-border rounded-xl px-4 py-1">
                    <DetailItem icon={Phone} label="Mobile Number" value={worker.mobileNumber} />
                    <DetailItem icon={Mail} label="Email Address" value={worker.email} />
                    <DetailItem icon={Calendar} label="Date of Birth" value={worker.dateOfBirth} />
                    <DetailItem icon={User} label="Gender" value={worker.gender} />
                    <DetailItem icon={MapPin} label="Address" value={worker.address} />
                  </div>
                </div>

                {/* Work Details */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Work Details</h3>
                  <div className="bg-muted/20 border border-border rounded-xl px-4 py-1">
                    <DetailItem icon={Briefcase} label="Joining Date" value={worker.joiningDate} />
                    <DetailItem icon={Clock} label="Shift Details" value={`${worker.shiftType} (${worker.shiftStart} - ${worker.shiftEnd})`} />
                    <DetailItem icon={IndianRupee} label="Salary Config" value={worker.salaryProfile?.salaryType} />
                  </div>
                </div>

                {/* Face Registration */}
                <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${worker.faceRegistrationStatus === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                      {worker.faceRegistrationStatus === 'Completed' ? <CheckCircle2 size={20} /> : <User size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Face Registration</p>
                      <p className="text-xs text-muted-foreground">{worker.faceRegistrationStatus}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
