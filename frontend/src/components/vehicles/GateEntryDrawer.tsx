"use client";

import React, { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/authStore";
import { vehiclesApi } from "@/lib/api";
import { toast } from "sonner";
import { MapPin, FileText, Clock, User, CheckCircle, XCircle, PauseCircle, Download } from "lucide-react";
import type { Vehicle } from "@/types";

interface GateEntryDrawerProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerificationComplete: () => void;
}

export function GateEntryDrawer({ vehicle, open, onOpenChange, onVerificationComplete }: GateEntryDrawerProps) {
  const { role } = useAuthStore();
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "hold" | null>(null);

  const isVerifier = role === "supervisor" || role === "manager" || role === "admin" || role === "owner";

  const handleVerify = async (action: "approve" | "reject" | "hold") => {
    if (!remarks.trim() && action !== "approve") {
      toast.error("Remarks are mandatory for Reject and Hold actions.");
      return;
    }

    if (!vehicle) return;
    
    setLoading(true);
    setActionType(action);
    try {
      await vehiclesApi.verify(vehicle.id, {
        action,
        remarks: remarks || "Verified",
      });
      toast.success(`Vehicle ${action}d successfully`);
      onOpenChange(false);
      onVerificationComplete();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || `Failed to ${action} vehicle`);
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-background/95 backdrop-blur-xl border-l border-border flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-border bg-card/50 sticky top-0 z-10">
          <SheetTitle className="text-2xl font-bold font-display flex items-center gap-2">
            Gate Entry Verification
          </SheetTitle>
          <SheetDescription>
            Verify documents and perform visual inspection for {vehicle?.vehicleNumber}
          </SheetDescription>
        </SheetHeader>

        {vehicle && (
          <div className="flex-1 p-6 space-y-8">
            {/* Vehicle Information */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} /> Vehicle Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-xl border border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Vehicle Number</p>
                  <p className="font-semibold">{vehicle.vehicleNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-semibold">{vehicle.productCategory}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Priority</p>
                  <p className="font-semibold capitalize text-primary">{vehicle.priority}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Platform Number</p>
                  <p className="font-semibold">{vehicle.platformNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Chassis Number</p>
                  <p className="font-semibold">{vehicle.chassisNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">VIN</p>
                  <p className="font-semibold">{vehicle.vin || "N/A"}</p>
                </div>
              </div>
            </section>
            
            {/* Driver Information */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <User size={16} /> Driver & Logistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-xl border border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Driver Name</p>
                  <p className="font-semibold">{vehicle.driverName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Driver Mobile</p>
                  <p className="font-semibold">{vehicle.driverMobileNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Transport Company</p>
                  <p className="font-semibold">{vehicle.transportCompany || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Truck Number</p>
                  <p className="font-semibold">{vehicle.truckNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">LR Number</p>
                  <p className="font-semibold">{vehicle.lrNumber || "N/A"}</p>
                </div>
              </div>
            </section>

            {/* Dispatch Info & Timeline */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} /> Timeline
              </h3>
              <div className="bg-muted/20 p-4 rounded-xl border border-border">
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted-foreground/20 before:to-transparent">
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border border-background bg-primary/20 text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow"></div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-border bg-card shadow-sm">
                      <p className="text-xs text-muted-foreground">Expected Arrival</p>
                      <p className="font-semibold text-sm">{vehicle.expectedArrivalDateTime ? new Date(vehicle.expectedArrivalDateTime).toLocaleString() : "Not specified"}</p>
                    </div>
                  </div>
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border border-background bg-warning/20 text-warning shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow"></div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-border bg-card shadow-sm">
                      <p className="text-xs text-muted-foreground">Gate Entry Pending</p>
                      <p className="font-semibold text-sm">Waiting for Supervisor</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* GPS Location (Mock) */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <MapPin size={16} /> GPS Location
            </h3>
            <div className="bg-muted/20 p-1 rounded-xl border border-border h-48 relative overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 opacity-20 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=28.6139,77.2090&zoom=12&size=800x400&sensor=false')] bg-cover bg-center"></div>
               <div className="z-10 bg-background/90 backdrop-blur-md p-4 rounded-xl border border-border text-center shadow-lg">
                  <MapPin size={24} className="text-primary mx-auto mb-2" />
                  <p className="font-bold text-sm">Fox Enterprises Gate 1</p>
                  <p className="text-xs text-muted-foreground">{vehicle.currentLocation || "Location tracking pending"}</p>
               </div>
            </div>
          </section>

          {/* Documents (Mock Preview) */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Download size={16} /> Documents
            </h3>
            <div className="flex gap-4">
               <div className="flex-1 bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                 <FileText size={24} className="text-muted-foreground mb-2" />
                 <p className="text-xs font-semibold">Delivery Challan</p>
               </div>
               <div className="flex-1 bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                 <FileText size={24} className="text-muted-foreground mb-2" />
                 <p className="text-xs font-semibold">E-Way Bill</p>
               </div>
            </div>
          </section>
        </div>
        )}

        {isVerifier && vehicle && vehicle.verificationStatus === "pending" && (
          <SheetFooter className="p-6 border-t border-border bg-card/50 flex flex-col gap-4 mt-auto">
            <div className="w-full">
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">Supervisor Remarks (Required for Reject/Hold)</label>
              <Textarea 
                placeholder="Enter verification remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="resize-none min-h-[80px]"
              />
            </div>
            <div className="flex items-center gap-3 w-full">
              <Button 
                variant="outline" 
                className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => handleVerify("reject")}
                disabled={loading}
              >
                <XCircle size={16} className="mr-2" /> Reject
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 border-warning text-warning hover:bg-warning/10"
                onClick={() => handleVerify("hold")}
                disabled={loading}
              >
                <PauseCircle size={16} className="mr-2" /> Hold
              </Button>
              <Button 
                className="flex-1 bg-success hover:bg-success/90 text-white"
                onClick={() => handleVerify("approve")}
                disabled={loading}
              >
                <CheckCircle size={16} className="mr-2" /> Approve
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
