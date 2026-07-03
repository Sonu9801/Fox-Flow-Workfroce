import React from "react";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { 
  X, MapPin, Camera, Clock, Calendar, Smartphone, Globe, Activity, CheckCircle, AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AttendanceDetailsDrawer({ open, onOpenChange, record }: any) {
  const isVisible = open && !!record;
  
  // If no record is ever passed, we just render hidden
  if (!record && !open) return null;

  const punchInTime = record?.punch_in ? parseISO(record.punch_in) : null;
  const punchOutTime = record?.punch_out ? parseISO(record.punch_out) : null;
  const dateStr = record?.date ? format(parseISO(record.date), "EEEE, MMMM do, yyyy") : "";

  return (
    <>
      <div 
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => onOpenChange(false)}
      />
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-card shadow-2xl border-l border-border z-50 flex flex-col transform transition-transform duration-300 ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-5 border-b border-border bg-muted/10">
          <div>
            <h2 className="text-lg font-bold">{record?.employee_name}</h2>
            <p className="text-sm text-muted-foreground">{record?.department} • {record?.employee_id}</p>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Header Stats */}
          <div className="bg-muted/30 rounded-xl p-4 flex justify-between items-center border border-border/50">
             <div className="flex gap-2 items-center">
                <Calendar size={18} className="text-muted-foreground"/>
                <span className="font-medium text-sm">{dateStr}</span>
             </div>
             <Badge variant="outline" className="bg-background">{record?.status}</Badge>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Punch In</p>
                <p className="text-2xl font-bold text-foreground">
                  {punchInTime ? format(punchInTime, "hh:mm a") : "--:--"}
                </p>
             </div>
             <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Punch Out</p>
                <p className="text-2xl font-bold text-foreground">
                  {punchOutTime ? format(punchOutTime, "hh:mm a") : "--:--"}
                </p>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
             <div className="bg-card border border-border p-3 rounded-lg shadow-sm text-center">
                <p className="text-xs text-muted-foreground mb-1">Net Hours</p>
                <p className="text-sm font-bold">{record.net_working_hours > 0 ? `${record.net_working_hours}h` : '--'}</p>
             </div>
             <div className="bg-card border border-border p-3 rounded-lg shadow-sm text-center">
                <p className="text-xs text-muted-foreground mb-1">OT Hours</p>
                <p className="text-sm font-bold text-purple-500">{record.ot_hours > 0 ? `${record.ot_hours}h` : '--'}</p>
             </div>
             <div className="bg-card border border-border p-3 rounded-lg shadow-sm text-center">
                <p className="text-xs text-muted-foreground mb-1">Late (mins)</p>
                <p className="text-sm font-bold text-orange-500">{record.late_minutes > 0 ? record.late_minutes : '--'}</p>
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
             <h3 className="font-semibold text-sm flex items-center gap-2"><MapPin size={16}/> GPS & Location</h3>
             <div className="bg-muted/20 p-3 rounded-lg text-sm grid gap-2 border border-border">
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Status:</span>
                   <span className="font-medium flex items-center gap-1 text-emerald-500"><CheckCircle size={14}/> {record.location_status}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Coordinates:</span>
                   <span className="font-medium text-xs font-mono">{record.latitude || "Unknown"}, {record.longitude || "Unknown"}</span>
                </div>
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
             <h3 className="font-semibold text-sm flex items-center gap-2"><Smartphone size={16}/> Device Footprint</h3>
             <div className="bg-muted/20 p-3 rounded-lg text-sm grid gap-2 border border-border">
                <div className="flex justify-between items-start gap-4">
                   <span className="text-muted-foreground whitespace-nowrap">User Agent:</span>
                   <span className="font-medium text-xs text-right break-words max-w-[200px]">{record.device_info}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-muted-foreground">IP Address:</span>
                   <span className="font-medium text-xs font-mono">{record.ip_address}</span>
                </div>
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border pb-8">
             <h3 className="font-semibold text-sm flex items-center gap-2"><Camera size={16}/> Selfie Verification</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <p className="text-xs font-medium text-center text-muted-foreground">Punch In</p>
                   {record.punch_in_photo_url ? (
                      <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border shadow-sm">
                         <img src={`http://192.168.1.6:8000${record.punch_in_photo_url}`} alt="Punch In" className="w-full h-full object-cover" />
                      </div>
                   ) : (
                      <div className="aspect-[3/4] rounded-lg bg-muted flex items-center justify-center border border-border shadow-sm text-xs text-muted-foreground flex-col gap-2">
                         <Camera size={24} className="opacity-20"/> No Photo
                      </div>
                   )}
                </div>
                <div className="space-y-2">
                   <p className="text-xs font-medium text-center text-muted-foreground">Punch Out</p>
                   {record.punch_out_photo_url ? (
                      <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border shadow-sm">
                         <img src={`http://192.168.1.6:8000${record.punch_out_photo_url}`} alt="Punch Out" className="w-full h-full object-cover" />
                      </div>
                   ) : (
                      <div className="aspect-[3/4] rounded-lg bg-muted flex items-center justify-center border border-border shadow-sm text-xs text-muted-foreground flex-col gap-2">
                         <Camera size={24} className="opacity-20"/> No Photo
                      </div>
                   )}
                </div>
             </div>
          </div>

        </div>
      </div>
    </>
  );
}
