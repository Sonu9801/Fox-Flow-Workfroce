"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUploadInvoice, useCreateInvoice } from "@/hooks/useQueries";
import { UploadCloud, Camera, Image as ImageIcon, FileText, ChevronLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function InvoiceUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState<number>(0);
  
  const uploadMutation = useUploadInvoice();
  const createMutation = useCreateInvoice();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null); // PDF preview is complex, just show icon
      }
      
      processOCR(file);
    }
  };

  const processOCR = async (file: File) => {
    setIsProcessing(true);
    setOcrData(null);
    try {
      const result = await uploadMutation.mutateAsync(file);
      setOcrData(result);
      setOcrConfidence(result.ocr_confidence_score || 0);
      toast.success("OCR completed!");
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      toast.error(detail || "Failed to process invoice");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!ocrData) return;
    try {
      // Sanitize empty strings to null for backend validation
      const payload = { ...ocrData };
      if (payload.invoice_date === "") payload.invoice_date = null;
      if (payload.invoice_number === "") payload.invoice_number = null;
      if (payload.vendor_name === "") payload.vendor_name = null;
      if (payload.vendor_gstin === "") payload.vendor_gstin = null;
      if (payload.hsn_sac === "") payload.hsn_sac = null;

      await createMutation.mutateAsync(payload);
      toast.success("Invoice saved successfully");
      router.push("/invoices");
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const debugMsg = `Err: ${error.message}. Data: ${JSON.stringify(error.response?.data)}`;
      if (detail && detail.existing_id) {
        toast.error(
          <div className="flex flex-col gap-2">
            <span>{detail.message}</span>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full text-xs"
              onClick={() => router.push(`/invoices/${detail.existing_id}`)}
            >
              View Existing Invoice
            </Button>
          </div>,
          { duration: 8000 }
        );
      } else if (Array.isArray(detail)) {
        toast.error(detail[0]?.msg || "Validation Error: Please check all fields.");
      } else {
        toast.error(typeof detail === 'string' ? detail : "Failed to save invoice");
      }
    }
  };

  return (
    <div className="p-4 md:p-6 pb-24" data-ocid="invoices.upload">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Upload Invoice
          </h1>
          <p className="text-sm text-muted-foreground">
            Capture or select an invoice to extract data automatically.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Upload / Preview */}
        <div className="flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl p-6 shadow-subtle flex flex-col items-center justify-center text-center min-h-[300px]">
            {previewUrl ? (
              <div className="relative w-full">
                <img src={previewUrl} alt="Invoice preview" className="w-full max-h-[500px] object-contain rounded-lg border border-border" />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur-md"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setOcrData(null);
                  }}
                >
                  Change File
                </Button>
              </div>
            ) : selectedFile ? (
               <div className="flex flex-col items-center gap-3">
                 <FileText size={48} className="text-primary/70" />
                 <p className="font-medium">{selectedFile.name}</p>
                 <Button variant="outline" onClick={() => setSelectedFile(null)}>Change File</Button>
               </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <UploadCloud size={48} className="text-primary/50 mb-4" />
                <h3 className="font-semibold text-lg mb-1">Drag & Drop or Choose</h3>
                <p className="text-sm text-muted-foreground mb-6">Supports PDF, JPG, PNG.</p>
                
                <input 
                  type="file" 
                  accept=".pdf,image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-sm">
                  <Button variant="outline" className="h-12 w-full" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon size={18} className="mr-2 text-primary" /> Gallery / Files
                  </Button>
                  <Button variant="outline" className="h-12 w-full" onClick={() => {
                     // For mobile camera direct opening, we use accept="image/*" and capture="environment"
                     const input = document.createElement("input");
                     input.type = "file";
                     input.accept = "image/*";
                     input.capture = "environment";
                     input.onchange = (e: any) => handleFileChange(e);
                     input.click();
                  }}>
                    <Camera size={18} className="mr-2 text-primary" /> Camera
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Extracted Data */}
        <div className="flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl shadow-subtle overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 size={18} className="text-primary" /> 
                Extracted Data
              </h3>
              {ocrData && (
                <span className={`text-xs font-bold px-2 py-1 rounded ${ocrConfidence >= 90 ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                  {ocrConfidence.toFixed(1)}% Confidence
                </span>
              )}
            </div>
            
            <div className="p-6 flex-1">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p>Processing with AI OCR...</p>
                </div>
              ) : !ocrData ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <p>Upload a file to see extracted data.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ocrConfidence < 90 && (
                    <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4 text-xs text-warning-foreground">
                      <strong>Warning:</strong> OCR confidence is low. Please manually verify the extracted fields below.
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Invoice Number</label>
                      <input 
                        type="text" 
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                        value={ocrData.invoice_number || ''}
                        onChange={(e) => setOcrData({...ocrData, invoice_number: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Date</label>
                      <input 
                        type="date" 
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                        value={ocrData.invoice_date || ''}
                        onChange={(e) => setOcrData({...ocrData, invoice_date: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Vendor Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                      value={ocrData.vendor_name || ''}
                      onChange={(e) => setOcrData({...ocrData, vendor_name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Vendor GSTIN</label>
                    <input 
                      type="text" 
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 uppercase"
                      value={ocrData.vendor_gstin || ''}
                      onChange={(e) => setOcrData({...ocrData, vendor_gstin: e.target.value.toUpperCase()})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Subtotal (₹)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                        value={ocrData.subtotal || ''}
                        onChange={(e) => setOcrData({...ocrData, subtotal: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">GST Amount (₹)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                        value={ocrData.gst_amount || ''}
                        onChange={(e) => setOcrData({...ocrData, gst_amount: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Grand Total (₹)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full bg-background border border-primary/50 font-bold rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary/20"
                      value={ocrData.grand_total || ''}
                      onChange={(e) => setOcrData({...ocrData, grand_total: parseFloat(e.target.value) || 0})}
                    />
                  </div>

                </div>
              )}
            </div>
            
            {ocrData && (
              <div className="p-4 border-t border-border bg-muted/10">
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleSave}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                  Verify & Save Invoice
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
