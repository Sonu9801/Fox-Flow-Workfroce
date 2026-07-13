import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { UserCircle, Phone, FileText, LogOut, Edit2, Check, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const WorkerProfileTab = ({ worker, onLogout, getTranslation, langIndex }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(worker.name || "");
  const [mobile, setMobile] = useState(worker.mobile_number || "");
  const [address, setAddress] = useState(worker.address || "");
  const [emergencyContact, setEmergencyContact] = useState(worker.emergency_contact_number || "");
  const [photoUrl, setPhotoUrl] = useState(worker.profile_photo_url || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/workers/${worker.id || worker.worker_id}/profile_edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("worker_token")}`
        },
        body: JSON.stringify({
          name: name,
          mobile_number: mobile,
          emergency_contact_number: emergencyContact,
          address: address,
          profile_photo_url: photoUrl
        })
      });

      if (response.ok) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        // Update local storage so the new name/photo persists across reloads
        const workerInfo = JSON.parse(localStorage.getItem("worker_info") || "{}");
        workerInfo.name = name;
        workerInfo.profile_photo_url = photoUrl;
        localStorage.setItem("worker_info", JSON.stringify(workerInfo));
        // Force reload to update the parent components (Sidebar, etc)
        window.location.reload();
      } else {
        toast.error("Failed to update profile.");
      }
    } catch (error) {
      toast.error("An error occurred while saving.");
    }
    setIsSaving(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/workers/${worker.id || worker.worker_id}/upload-photo`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("worker_token")}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setPhotoUrl(data.profile_photo_url);
        toast.success("Photo uploaded! Click save to apply changes.");
      } else {
        toast.error("Failed to upload photo.");
      }
    } catch (error) {
      toast.error("An error occurred during upload.");
    }
    setIsUploading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-zinc-200 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-zinc-800 to-zinc-900 flex justify-end p-4">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="text-white hover:text-gray-200 bg-black/20 p-2 rounded-full backdrop-blur-sm z-10 transition-colors h-10 w-10 flex items-center justify-center">
              <Edit2 size={18} />
            </button>
          ) : (
            <div className="flex gap-2 z-10">
              <button onClick={() => setIsEditing(false)} className="text-white hover:text-red-200 bg-red-500/50 p-2 rounded-full backdrop-blur-sm transition-colors h-10 w-10 flex items-center justify-center">
                <X size={18} />
              </button>
              <button onClick={handleSave} disabled={isSaving} className="text-white hover:text-green-200 bg-green-500/50 p-2 rounded-full backdrop-blur-sm transition-colors disabled:opacity-50 h-10 w-10 flex items-center justify-center">
                <Check size={18} />
              </button>
            </div>
          )}
        </div>
        
        <div className="w-24 h-24 rounded-[32px] bg-white overflow-hidden mb-4 border-4 border-white shadow-md relative z-10 mt-6 group">
          {photoUrl ? (
            <img src={photoUrl} className="w-full h-full object-cover" alt="Profile" />
          ) : (
            <UserCircle size={88} className="text-zinc-300 mx-auto mt-1" />
          )}
          
          {isEditing && (
            <div 
              className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-100 transition-opacity"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={24} className="text-white" />
              )}
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {isEditing ? (
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="text-[20px] font-black text-zinc-900 tracking-tight text-center border-b-2 border-blue-500 focus:outline-none mb-1 w-full max-w-[200px]"
            placeholder="Your Name"
          />
        ) : (
          <h2 className="text-[20px] font-black text-zinc-900 tracking-tight">{name || "Worker"}</h2>
        )}
        
        <p className="text-[12px] font-bold text-blue-600 mb-6 bg-blue-50 px-3 py-1 rounded-lg mt-2">
          {worker.designation || "Operator"} • {worker.department || "Production"}
        </p>
        
        <div className="w-full space-y-2 mb-8 text-left">
          <div className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
            <Phone size={16} className="text-zinc-400" /> 
            {isEditing ? (
              <input 
                type="text" 
                value={mobile} 
                onChange={(e) => setMobile(e.target.value)} 
                className="text-[13px] font-bold text-zinc-700 bg-transparent border-b border-gray-300 focus:outline-none w-full"
                placeholder="Mobile Number"
              />
            ) : (
              <span className="text-[13px] font-bold text-zinc-700">{mobile || "No Number"}</span>
            )}
          </div>

          {isEditing && (
            <div className="flex flex-col gap-1 p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
              <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Emergency Contact</label>
              <input 
                type="text" 
                value={emergencyContact} 
                onChange={(e) => setEmergencyContact(e.target.value)} 
                className="text-[13px] font-bold text-zinc-700 bg-transparent border-b border-gray-300 focus:outline-none w-full"
                placeholder="Emergency Contact"
              />
            </div>
          )}

          {isEditing && (
            <div className="flex flex-col gap-1 p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
              <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Address</label>
              <input 
                type="text" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                className="text-[13px] font-bold text-zinc-700 bg-transparent border-b border-gray-300 focus:outline-none w-full"
                placeholder="Your Address"
              />
            </div>
          )}

          {!isEditing && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
              <FileText size={16} className="text-zinc-400" /> 
              <span className="text-[13px] font-bold text-zinc-700">Aadhar: {worker.aadhar_number || "Not Provided"}</span>
            </div>
          )}
        </div>

        <Button variant="outline" className="w-full rounded-xl font-bold h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onLogout}>
          <LogOut size={16} className="mr-2" /> {getTranslation ? getTranslation(langIndex, "Logout") : "Sign Out"}
        </Button>
      </div>
    </motion.div>
  );
};
