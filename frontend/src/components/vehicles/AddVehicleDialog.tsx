"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Priority, Stage } from "@/types";

const MODELS_MAP: Record<string, string[]> = {
  "DV": ["DV-120", "DV-170", "DV- 220 City", "DV- 220 MAXX", "DV- 260 Strom", "DV-330", "Other"],
  "HD": ["HD-120", "HD-170", "HD- 220 City", "HD- 220 MAXX", "HD- 260 Strom", "HD-330", "Other"],
  "PV": ["PV-120", "PV-170", "PV- 220 City", "PV- 220 MAXX", "PV- 260 Strom", "PV-330", "Other"],
  "PIAGGIO": ["PIAGGIO", "Other"],
  "Montra Electric": ["Montra Electric", "Other"],
  "Other": ["Other"],
};

function CustomModelSelect({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-muted/50 border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all flex items-center justify-between text-left"
      >
        <span className="truncate">{value || "Select Model"}</span>
        <ChevronDown size={12} className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-xl max-h-[250px] overflow-y-auto py-1"
          >
            {Object.entries(MODELS_MAP).map(([series, variants]) => (
              <div key={series} className="flex flex-col">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (variants.length === 1 && variants[0] === series) {
                      onChange(series);
                      setIsOpen(false);
                    } else {
                      setExpandedSeries(expandedSeries === series ? null : series);
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-muted/50 text-primary flex items-center justify-between transition-colors"
                >
                  {series}
                  {variants.length > 1 && (
                    <ChevronDown size={14} className={cn("transition-transform", expandedSeries === series && "rotate-180")} />
                  )}
                </button>
                <AnimatePresence>
                  {expandedSeries === series && variants.length > 1 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-muted/10"
                    >
                      {variants.map(variant => (
                        <button
                          key={variant}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            onChange(variant);
                            setIsOpen(false);
                          }}
                          className="w-full text-left px-4 pl-6 py-2 text-sm hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between"
                        >
                          {variant}
                          {value === variant && <span className="text-primary text-xs font-bold">✓</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const PRODUCT_CATEGORIES = [
  "All Categories",
  "Cargo Box",
  "Garbage Body",
  "Grocery Cart",
  "Food Cart",
];

export interface AddVehicleDialogProps {
  onClose: () => void;
  onAdd: (vehicleData: any) => void;
  isOemSubmission?: boolean;
}

export function AddVehicleDialog({ onClose, onAdd, isOemSubmission = false }: AddVehicleDialogProps) {
  const [form, setForm] = useState({
    vehicleNumber: "",
    platformNumber: "",
    vin: "",
    chassisNumber: "",
    oemName: "",
    oemNameOther: "",
    dealerName: "",
    dealerNameOther: "",
    modelName: "",
    modelNameOther: "",
    vehicleType: "",
    vehicleTypeOther: "",
    productCategory: "Cargo Box",
    productCategoryOther: "",
    priority: "normal" as Priority,
    estimatedDelivery: "",
    notes: "",
    // Logistics Fields
    driverName: "",
    driverMobileNumber: "",
    transportCompany: "",
    truckNumber: "",
    lrNumber: "",
    invoiceNumber: "",
    dispatchChallanNumber: "",
    dispatchDateTime: "",
    expectedArrivalDateTime: "",
    documentsUrl: "", // Mock URL
    remarks: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalOemName = form.oemName === "Other" ? form.oemNameOther : form.oemName;
    const finalDealerName = form.dealerName === "Other" ? form.dealerNameOther : form.dealerName;
    const finalModelName = form.modelName === "Other" ? form.modelNameOther : form.modelName;
    const finalVehicleType = form.vehicleType === "Other" ? form.vehicleTypeOther : form.vehicleType;
    const finalProductCategory = form.productCategory === "Other" ? form.productCategoryOther : form.productCategory;

    // Manual validation for custom select and 'Other' fields
    if (!finalModelName) {
      alert("Please select or enter a Model Name.");
      return;
    }
    if (form.dealerName === "Other" && !form.dealerNameOther) {
      alert("Please enter Dealer Name.");
      return;
    }
    if (form.vehicleType === "Other" && !form.vehicleTypeOther) {
      alert("Please enter Vehicle Type.");
      return;
    }
    if (form.productCategory === "Other" && !form.productCategoryOther) {
      alert("Please enter Product Category.");
      return;
    }

    const now = new Date().toISOString();
    const trackingId = `FF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const combinedNotes = [
      form.chassisNumber ? `Chassis Number: ${form.chassisNumber}` : "",
      form.vin ? `VIN: ${form.vin}` : "",
      finalDealerName ? `Dealer Name: ${finalDealerName}` : "",
      finalModelName ? `Model Name: ${finalModelName}` : "",
      finalVehicleType ? `Vehicle Type: ${finalVehicleType}` : "",
      form.notes
    ].filter(Boolean).join("\n");

    onAdd({
      trackingId,
      vehicleNumber: form.vehicleNumber || "",
      oemName: finalOemName,
      productCategory: finalProductCategory,
      priority: form.priority,
      currentStage: isOemSubmission ? "oem_submitted" : "received",
      assignedWorkerIds: [],
      receivedAt: now,
      estimatedDelivery: form.estimatedDelivery
        ? new Date(form.estimatedDelivery).toISOString()
        : new Date(Date.now() + 7 * 86400000).toISOString(),
      progressPercent: 0,
      notes: combinedNotes,
      
      // Logistics Fields
      driverName: form.driverName || undefined,
      driverMobileNumber: form.driverMobileNumber || undefined,
      transportCompany: form.transportCompany || undefined,
      truckNumber: form.truckNumber || undefined,
      lrNumber: form.lrNumber || undefined,
      invoiceNumber: form.invoiceNumber || undefined,
      dispatchChallanNumber: form.dispatchChallanNumber || undefined,
      dispatchDateTime: form.dispatchDateTime ? new Date(form.dispatchDateTime).toISOString() : undefined,
      expectedArrivalDateTime: form.expectedArrivalDateTime ? new Date(form.expectedArrivalDateTime).toISOString() : undefined,
      documentsUrl: form.documentsUrl || undefined,
      remarks: form.remarks || undefined,

      // Verification fields matching OEM input
      platformNumber: form.platformNumber || undefined,
      chassisNumber: form.chassisNumber || undefined,
      vin: form.vin || undefined,
      dealerName: finalDealerName || undefined,
      vehicleModel: finalModelName || undefined,
      vehicleType: finalVehicleType || undefined,
      submittedByOem: finalOemName || undefined,
      submittedAt: now,
    });
    onClose();
  };

  const inputCls =
    "w-full bg-muted/50 border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all";
  const labelCls = "text-xs font-medium text-muted-foreground mb-1.5 block";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-none flex items-center justify-between px-5 py-4 border-b border-border bg-card rounded-t-2xl">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {isOemSubmission ? "Add Vehicle Dispatch" : "Add Manual Vehicle"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isOemSubmission ? "Submit a new vehicle for production verification" : "New vehicle to Received queue"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground transition-colors"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Section: Basic Vehicle Details */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 pb-1 border-b border-border/50">Vehicle Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tracking / Vehicle Number</label>
                <input
                  placeholder="e.g. FF-2026"
                  value={form.vehicleNumber}
                  onChange={(e) => setForm((f) => ({ ...f, vehicleNumber: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Platform Number *</label>
                <input
                  required
                  placeholder="Platform 123"
                  value={form.platformNumber}
                  onChange={(e) => setForm((f) => ({ ...f, platformNumber: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>VIN *</label>
                <input
                  required
                  placeholder="VIN-123456789"
                  value={form.vin}
                  onChange={(e) => setForm((f) => ({ ...f, vin: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Chassis Number *</label>
                <input
                  required
                  placeholder="CH-98765"
                  value={form.chassisNumber}
                  onChange={(e) => setForm((f) => ({ ...f, chassisNumber: e.target.value }))}
                  className={inputCls}
                />
              </div>
              
              <div>
                <label className={labelCls}>OEM Name *</label>
                <div className="relative">
                  <select
                    required
                    value={form.oemName}
                    onChange={(e) => setForm((f) => ({ ...f, oemName: e.target.value }))}
                    className={cn(inputCls, "appearance-none pr-7")}
                  >
                    <option value="">Select OEM</option>
                    <option value="EULER MOTORS">EULER MOTORS</option>
                    <option value="MONTRA ELECTRIC">MONTRA ELECTRIC</option>
                    <option value="BAJAJ AUTO">BAJAJ AUTO</option>
                    <option value="PIAGGIO">PIAGGIO</option>
                    <option value="JUPITER ELECTRIC MOBILITY">JUPITER ELECTRIC MOBILITY</option>
                    <option value="TVS MOTORS">TVS MOTORS</option>
                    <option value="E NEXT MOBILITY">E NEXT MOBILITY</option>
                    <option value="E AUTO FARIDABAD">E AUTO FARIDABAD</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                {form.oemName === "Other" && (
                  <input
                    required
                    placeholder="Enter OEM Name"
                    value={form.oemNameOther}
                    onChange={(e) => setForm((f) => ({ ...f, oemNameOther: e.target.value }))}
                    className={cn(inputCls, "mt-2")}
                  />
                )}
              </div>
              
              <div>
                <label className={labelCls}>Dealer Name *</label>
                <div className="relative">
                  <select
                    required
                    value={form.dealerName}
                    onChange={(e) => setForm((f) => ({ ...f, dealerName: e.target.value }))}
                    className={cn(inputCls, "appearance-none pr-7")}
                  >
                    <option value="">Select Dealer</option>
                    <option value="Tech UP">Tech UP</option>
                    <option value="Eco Edge">Eco Edge</option>
                    <option value="Smart Solution">Smart Solution</option>
                    <option value="Sincear Marketing">Sincear Marketing</option>
                    <option value="Bhutani Auto Cap">Bhutani Auto Cap</option>
                    <option value="KK Auto mobile">KK Auto mobile</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                {form.dealerName === "Other" && (
                  <input
                    placeholder="Enter Dealer Name"
                    value={form.dealerNameOther}
                    onChange={(e) => setForm((f) => ({ ...f, dealerNameOther: e.target.value }))}
                    className={cn(inputCls, "mt-2")}
                  />
                )}
              </div>

              <div>
                <label className={labelCls}>Model Name *</label>
                <CustomModelSelect 
                  value={form.modelName} 
                  onChange={(val) => setForm(f => ({ ...f, modelName: val }))} 
                />
                {form.modelName === "Other" && (
                  <input
                    required
                    placeholder="Enter Model Name"
                    value={form.modelNameOther}
                    onChange={(e) => setForm((f) => ({ ...f, modelNameOther: e.target.value }))}
                    className={cn(inputCls, "mt-2")}
                  />
                )}
              </div>

              <div>
                <label className={labelCls}>Vehicle Type *</label>
                <div className="relative">
                  <select
                    required
                    value={form.vehicleType}
                    onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))}
                    className={cn(inputCls, "appearance-none pr-7")}
                  >
                    <option value="">Select type</option>
                    <option value="3 wheeler">3 wheeler</option>
                    <option value="4 wheeler">4 wheeler</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                {form.vehicleType === "Other" && (
                  <input
                    placeholder="Enter Vehicle Type"
                    value={form.vehicleTypeOther}
                    onChange={(e) => setForm((f) => ({ ...f, vehicleTypeOther: e.target.value }))}
                    className={cn(inputCls, "mt-2")}
                  />
                )}
              </div>
              
              <div>
                <label className={labelCls}>Product Category *</label>
                <div className="relative">
                  <select
                    required
                    value={form.productCategory}
                    onChange={(e) => setForm((f) => ({ ...f, productCategory: e.target.value }))}
                    className={cn(inputCls, "appearance-none pr-7")}
                  >
                    {PRODUCT_CATEGORIES.slice(1).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                {form.productCategory === "Other" && (
                  <input
                    placeholder="Enter Product Category"
                    value={form.productCategoryOther}
                    onChange={(e) => setForm((f) => ({ ...f, productCategoryOther: e.target.value }))}
                    className={cn(inputCls, "mt-2")}
                  />
                )}
              </div>

              <div>
                <label className={labelCls}>Priority</label>
                <div className="relative">
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))}
                    className={cn(inputCls, "appearance-none pr-7")}
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className={labelCls}>Estimated Delivery</label>
                <input
                  type="datetime-local"
                  value={form.estimatedDelivery}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedDelivery: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Section: Logistics Details (Always visible, but specifically for OEM/Transport) */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 pb-1 border-b border-border/50">Logistics & Dispatch Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Transport Company</label>
                <input
                  placeholder="Enter Transport Co."
                  value={form.transportCompany}
                  onChange={(e) => setForm((f) => ({ ...f, transportCompany: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Truck Number</label>
                <input
                  placeholder="e.g. MH-12-AB-3456"
                  value={form.truckNumber}
                  onChange={(e) => setForm((f) => ({ ...f, truckNumber: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Driver Name *</label>
                <input
                  required
                  placeholder="Driver's Full Name"
                  value={form.driverName}
                  onChange={(e) => setForm((f) => ({ ...f, driverName: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Driver Mobile Number *</label>
                <input
                  required
                  type="tel"
                  maxLength={10}
                  pattern="\d{10}"
                  title="Mobile number must be exactly 10 digits"
                  placeholder="10-digit mobile number"
                  value={form.driverMobileNumber}
                  onChange={(e) => setForm((f) => ({ ...f, driverMobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>LR Number</label>
                <input
                  placeholder="Enter LR Number"
                  value={form.lrNumber}
                  onChange={(e) => setForm((f) => ({ ...f, lrNumber: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Invoice Number</label>
                <input
                  placeholder="Enter Invoice Number"
                  value={form.invoiceNumber}
                  onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Dispatch Challan Number</label>
                <input
                  placeholder="Enter Challan Number"
                  value={form.dispatchChallanNumber}
                  onChange={(e) => setForm((f) => ({ ...f, dispatchChallanNumber: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Dispatch Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.dispatchDateTime}
                  onChange={(e) => setForm((f) => ({ ...f, dispatchDateTime: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Expected Arrival Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.expectedArrivalDateTime}
                  onChange={(e) => setForm((f) => ({ ...f, expectedArrivalDateTime: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Documents Upload</label>
                <label className={cn(inputCls, "flex items-center justify-center gap-2 cursor-pointer bg-muted/30 hover:bg-muted/50 border-dashed border-2")}>
                  <Upload size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Upload Files</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setForm((f) => ({ ...f, documentsUrl: e.target.files![0].name }))
                      }
                    }}
                  />
                </label>
                {form.documentsUrl && (
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">Selected: {form.documentsUrl}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Notes</label>
              <textarea
                rows={2}
                placeholder="Special instructions or notes..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className={cn(inputCls, "resize-none")}
              />
            </div>
            <div>
              <label className={labelCls}>Remarks</label>
              <textarea
                rows={2}
                placeholder="Additional remarks..."
                value={form.remarks}
                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                className={cn(inputCls, "resize-none")}
              />
            </div>
          </div>

          </div>

          <div className="flex-none flex gap-2 border-t border-border/50 p-4 bg-card rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isOemSubmission ? "Submit Dispatch" : "Add Vehicle"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
