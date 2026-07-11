"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVehicles, useVerifyVehicle, useRejectVehicle } from "@/hooks/useQueries";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Upload, Eye, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VerificationPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id);
  const { data: vehicles, isLoading } = useVehicles();
  
  const verifyMutation = useVerifyVehicle();
  const rejectMutation = useRejectVehicle();

  const [checklist, setChecklist] = useState({
    platformMatch: false,
    vinMatch: false,
    chassisMatch: false,
    driverMatch: false,
    conditionOk: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedPhotos(Array.from(e.target.files));
      alert(`${e.target.files.length} photo(s) selected for upload.`);
    }
  };

  const handleDocumentView = (docType: string) => {
    alert(`No ${docType} available for this vehicle yet.`);
  };

  const [verifyData, setVerifyData] = useState({
    platformNumber: "",
    vin: "",
    chassisNumber: "",
    driverName: "",
    driverMobileNumber: "",
    truckNumber: "",
    verificationNotes: "",
  });

  const vehicle = vehicles?.find((v) => String(v.id) === id);

  useEffect(() => {
    if (vehicle) {
      setVerifyData({
        platformNumber: vehicle.platformNumber || vehicle.vehicleNumber || "",
        vin: vehicle.vin || "",
        chassisNumber: vehicle.chassisNumber || "",
        driverName: vehicle.driverName || "",
        driverMobileNumber: vehicle.driverMobileNumber || "",
        truckNumber: vehicle.truckNumber || "",
        verificationNotes: "",
      });
    }
  }, [vehicle]);

  if (isLoading) {
    return <div className="p-8 flex items-center justify-center">Loading vehicle data...</div>;
  }

  if (!vehicle) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-bold mb-4">Vehicle Not Found</h2>
        <button onClick={() => router.push("/production")} className="text-primary hover:underline">
          Return to Production Board
        </button>
      </div>
    );
  }

  const isAllChecked = Object.values(checklist).every(Boolean);

  const handleAccept = () => {
    verifyMutation.mutate({
      id: vehicle.id,
      data: verifyData,
    });
    router.push("/production");
  };

  const handleReject = () => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    rejectMutation.mutate({ id: vehicle.id, reason });
    router.push("/production");
  };

  const CompareRow = ({ label, original, verified, onChange, required }: any) => {
    const isMismatch = original !== verified && original !== "";
    return (
      <div className={cn("grid grid-cols-12 gap-4 items-center p-3 border-b border-border/50", isMismatch && "bg-destructive/5")}>
        <div className="col-span-3 text-sm font-medium text-foreground">{label}</div>
        <div className="col-span-4 text-sm text-muted-foreground bg-muted/30 p-2 rounded">{original || "N/A"}</div>
        <div className="col-span-5">
          <input
            type="text"
            required={required}
            value={verified}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "w-full bg-card border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary",
              isMismatch ? "border-destructive text-destructive" : "border-input"
            )}
            placeholder={`Verify ${label}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-muted/5">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-card flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/production")}
            className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold font-display text-foreground tracking-tight flex items-center gap-2">
              Incoming Verification
              <span className="bg-warning/20 text-warning px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">
                Pending
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tracking ID: <span className="font-medium text-foreground">{vehicle.trackingId}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Details */}
            <div className="col-span-2 space-y-6">
              
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-muted/20">
                  <h2 className="font-semibold text-sm">Compare & Verify Information</h2>
                </div>
                <div className="p-0">
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/10 text-xs font-semibold text-muted-foreground border-b border-border/50">
                    <div className="col-span-3">Field</div>
                    <div className="col-span-4">OEM Submitted Value</div>
                    <div className="col-span-5">Verified Value (Actual)</div>
                  </div>
                  
                  <CompareRow 
                    label="Platform Number" 
                    original={vehicle.platformNumber || vehicle.vehicleNumber} 
                    verified={verifyData.platformNumber}
                    onChange={(val: string) => setVerifyData(d => ({ ...d, platformNumber: val }))}
                    required
                  />
                  <CompareRow 
                    label="VIN" 
                    original={vehicle.vin} 
                    verified={verifyData.vin}
                    onChange={(val: string) => setVerifyData(d => ({ ...d, vin: val }))}
                  />
                  <CompareRow 
                    label="Chassis Number" 
                    original={vehicle.chassisNumber} 
                    verified={verifyData.chassisNumber}
                    onChange={(val: string) => setVerifyData(d => ({ ...d, chassisNumber: val }))}
                  />
                  <CompareRow 
                    label="Driver Name" 
                    original={vehicle.driverName} 
                    verified={verifyData.driverName}
                    onChange={(val: string) => setVerifyData(d => ({ ...d, driverName: val }))}
                  />
                  <CompareRow 
                    label="Driver Mobile" 
                    original={vehicle.driverMobileNumber} 
                    verified={verifyData.driverMobileNumber}
                    onChange={(val: string) => setVerifyData(d => ({ ...d, driverMobileNumber: val }))}
                  />
                  <CompareRow 
                    label="Truck Number" 
                    original={vehicle.truckNumber} 
                    verified={verifyData.truckNumber}
                    onChange={(val: string) => setVerifyData(d => ({ ...d, truckNumber: val }))}
                  />
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-muted/20">
                  <h2 className="font-semibold text-sm">Additional Verification Notes</h2>
                </div>
                <div className="p-5">
                  <textarea
                    value={verifyData.verificationNotes}
                    onChange={(e) => setVerifyData(d => ({ ...d, verificationNotes: e.target.value }))}
                    className="w-full bg-muted/30 border border-input rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 min-h-[100px]"
                    placeholder="Enter any discrepancies, damages, or notes here..."
                  />
                </div>
              </div>

            </div>

            {/* Right Column: Checklist & Action */}
            <div className="col-span-1 space-y-6">
              
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-muted/20">
                  <h2 className="font-semibold text-sm">Mandatory Checklist</h2>
                </div>
                <div className="p-5 space-y-3">
                  <label className="flex items-start gap-3 p-2 rounded hover:bg-muted/30 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="mt-1"
                      checked={checklist.platformMatch}
                      onChange={(e) => setChecklist(c => ({ ...c, platformMatch: e.target.checked }))}
                    />
                    <div className="text-sm">
                      <span className="font-medium block">Platform Number matches</span>
                      <span className="text-xs text-muted-foreground">Physically verified on vehicle</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-2 rounded hover:bg-muted/30 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="mt-1"
                      checked={checklist.vinMatch}
                      onChange={(e) => setChecklist(c => ({ ...c, vinMatch: e.target.checked }))}
                    />
                    <div className="text-sm">
                      <span className="font-medium block">VIN/Chassis matches</span>
                      <span className="text-xs text-muted-foreground">Matched with invoice</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-2 rounded hover:bg-muted/30 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="mt-1"
                      checked={checklist.driverMatch}
                      onChange={(e) => setChecklist(c => ({ ...c, driverMatch: e.target.checked }))}
                    />
                    <div className="text-sm">
                      <span className="font-medium block">Driver Identity Verified</span>
                      <span className="text-xs text-muted-foreground">DL/ID checked</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-2 rounded hover:bg-muted/30 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="mt-1"
                      checked={checklist.conditionOk}
                      onChange={(e) => setChecklist(c => ({ ...c, conditionOk: e.target.checked }))}
                    />
                    <div className="text-sm">
                      <span className="font-medium block">Physical Condition OK</span>
                      <span className="text-xs text-muted-foreground">No damages found</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-muted/20">
                  <h2 className="font-semibold text-sm">Arrival Photos</h2>
                </div>
                <div className="p-5">
                  <div 
                    onClick={handleUploadClick}
                    className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <Upload size={24} className="mb-2" />
                    <span className="text-sm font-medium">Upload Photos</span>
                    <span className="text-xs mt-1 text-center">Capture front, back, side & chassis no.</span>
                  </div>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handlePhotoChange} 
                  />
                  {selectedPhotos.length > 0 && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      {selectedPhotos.length} photo(s) selected
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                 <div className="px-5 py-3 border-b border-border bg-muted/20">
                  <h2 className="font-semibold text-sm">OEM Documents</h2>
                </div>
                <div className="p-4 space-y-2">
                  <button onClick={() => handleDocumentView("Invoice Document")} className="w-full flex items-center justify-between p-2 text-sm border border-border rounded hover:bg-muted/30">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-primary"/> 
                      Invoice Document
                    </div>
                    <Eye size={14} className="text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDocumentView("Delivery Challan")} className="w-full flex items-center justify-between p-2 text-sm border border-border rounded hover:bg-muted/30">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-primary"/> 
                      Delivery Challan
                    </div>
                    <Eye size={14} className="text-muted-foreground" />
                  </button>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-card flex items-center justify-between z-10 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-2">
          {!isAllChecked && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-warning bg-warning/10 px-3 py-1.5 rounded-full">
              <AlertCircle size={14} /> Complete mandatory checklist to accept
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReject}
            className="px-5 py-2.5 rounded-lg border border-destructive/30 text-destructive font-semibold text-sm hover:bg-destructive hover:text-white transition-colors flex items-center gap-2"
          >
            <XCircle size={16} /> Reject Vehicle
          </button>
          <button
            onClick={handleAccept}
            disabled={!isAllChecked}
            className={cn(
              "px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all shadow-sm",
              isAllChecked 
                ? "bg-success text-white hover:bg-success/90 hover:shadow" 
                : "bg-success/50 text-white/70 cursor-not-allowed"
            )}
          >
            <CheckCircle2 size={16} /> Accept to Production
          </button>
        </div>
      </div>

    </div>
  );
}
