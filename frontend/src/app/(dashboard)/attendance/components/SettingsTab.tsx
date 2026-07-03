import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, MapPin, Clock, Briefcase, Camera, Smartphone, Bell, Calendar, UserCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/lib/api";

export default function SettingsTab() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("location");
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ["attendanceSettings"],
    queryFn: async () => {
      const res = await api.get("/settings/attendance");
      return res.data;
    }
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const res = await api.get("/settings/attendance/shifts");
      return res.data;
    }
  });

  const { data: holidays = [] } = useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      const res = await api.get("/settings/attendance/holidays");
      return res.data;
    }
  });

  const [form, setForm] = useState<any>({});
  
  // Modals state
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftForm, setShiftForm] = useState<any>({ name: "", start_time: "", end_time: "" });
  
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayForm, setHolidayForm] = useState<any>({ date: "", name: "", type: "National" });
  
  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (updatedSettings: any) => {
      const res = await fetch("http://192.168.1.6:8000/api/settings/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings)
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendanceSettings"] });
      toast.success("Attendance settings saved successfully");
    },
    onError: () => {
      toast.error("Failed to save settings");
    }
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  const handleChange = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (shiftForm.id) {
        await api.put(`/settings/attendance/shifts/${shiftForm.id}`, shiftForm);
      } else {
        await api.post("/settings/attendance/shifts", shiftForm);
      }
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Shift saved successfully");
      setShowShiftModal(false);
    } catch (error) {
      toast.error("Failed to save shift");
    }
  };

  const handleDeleteShift = async (id: number) => {
    try {
      await api.delete(`/settings/attendance/shifts/${id}`);
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Shift deleted successfully");
    } catch (error) {
      toast.error("Failed to delete shift");
    }
  };

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/settings/attendance/holidays", holidayForm);
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.success("Holiday saved successfully");
      setShowHolidayModal(false);
    } catch (error) {
      toast.error("Failed to save holiday");
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    try {
      await api.delete(`/settings/attendance/holidays/${id}`);
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.success("Holiday deleted successfully");
    } catch (error) {
      toast.error("Failed to delete holiday");
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Global Attendance Configuration
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Control GPS fences, shifts, OT rules, and device policies.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Sidebar / Tabs Navigation */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card flex-shrink-0">
          <div className="md:hidden w-full overflow-x-auto no-scrollbar">
            <div className="flex gap-1 p-2 w-max">
              <NavButton active={activeTab === "location"} onClick={() => setActiveTab("location")} icon={MapPin} label="Company Location" />
              <NavButton active={activeTab === "rules"} onClick={() => setActiveTab("rules")} icon={Clock} label="Attendance Rules" />
              <NavButton active={activeTab === "ot"} onClick={() => setActiveTab("ot")} icon={Briefcase} label="Overtime Rules" />
              <NavButton active={activeTab === "sunday"} onClick={() => setActiveTab("sunday")} icon={Calendar} label="Sunday Rules" />
              <NavButton active={activeTab === "face"} onClick={() => setActiveTab("face")} icon={Camera} label="Face Verification" />
              <NavButton active={activeTab === "device"} onClick={() => setActiveTab("device")} icon={Smartphone} label="Device Policy" />
              <NavButton active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")} icon={Bell} label="Notifications" />
              <NavButton active={activeTab === "shifts"} onClick={() => setActiveTab("shifts")} icon={Clock} label="Shift Management" />
              <NavButton active={activeTab === "holidays"} onClick={() => setActiveTab("holidays")} icon={Calendar} label="Holiday Management" />
            </div>
          </div>
          <ScrollArea className="hidden md:block w-full h-full">
            <div className="flex flex-col gap-1 p-2">
              <NavButton active={activeTab === "location"} onClick={() => setActiveTab("location")} icon={MapPin} label="Company Location" />
              <NavButton active={activeTab === "rules"} onClick={() => setActiveTab("rules")} icon={Clock} label="Attendance Rules" />
              <NavButton active={activeTab === "ot"} onClick={() => setActiveTab("ot")} icon={Briefcase} label="Overtime Rules" />
              <NavButton active={activeTab === "sunday"} onClick={() => setActiveTab("sunday")} icon={Calendar} label="Sunday Rules" />
              <NavButton active={activeTab === "face"} onClick={() => setActiveTab("face")} icon={Camera} label="Face Verification" />
              <NavButton active={activeTab === "device"} onClick={() => setActiveTab("device")} icon={Smartphone} label="Device Policy" />
              <NavButton active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")} icon={Bell} label="Notifications" />
              <NavButton active={activeTab === "shifts"} onClick={() => setActiveTab("shifts")} icon={Clock} label="Shift Management" />
              <NavButton active={activeTab === "holidays"} onClick={() => setActiveTab("holidays")} icon={Calendar} label="Holiday Management" />
            </div>
          </ScrollArea>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-background">
          <ScrollArea className="h-full">
            <div className="p-8 max-w-3xl">
              
              {activeTab === "location" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold">Company Location & Geofence</h3>
                    <p className="text-sm text-muted-foreground">Set the primary location for attendance geofencing.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Company Name</Label>
                      <Input value={form.companyName || ""} onChange={(e) => handleChange("companyName", e.target.value)} className="mt-1" />
                    </div>
                    <div className="col-span-2">
                      <Label>Company Address</Label>
                      <Input value={form.address || ""} onChange={(e) => handleChange("address", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>Latitude</Label>
                      <Input type="number" value={form.latitude || 0} onChange={(e) => handleChange("latitude", parseFloat(e.target.value))} className="mt-1" />
                    </div>
                    <div>
                      <Label>Longitude</Label>
                      <Input type="number" value={form.longitude || 0} onChange={(e) => handleChange("longitude", parseFloat(e.target.value))} className="mt-1" />
                    </div>
                    <div className="col-span-2">
                      <Label>Geofence Radius (Meters)</Label>
                      <Input type="number" value={form.geofenceRadius || 200} onChange={(e) => handleChange("geofenceRadius", parseInt(e.target.value))} className="mt-1" />
                    </div>
                    <div className="col-span-2 mt-4 rounded-xl border border-border bg-muted flex items-center justify-center h-48">
                      <div className="text-center">
                        <MapPin size={32} className="mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Google Maps Preview (Mock)</p>
                        <p className="text-xs font-semibold text-primary mt-1">Radius: {form.geofenceRadius}m</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "rules" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold">Attendance Rules</h3>
                    <p className="text-sm text-muted-foreground">Configure global shift timings and late penalties.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Default Shift Start</Label>
                      <Input type="time" value={form.defaultShiftStart || "09:00"} onChange={(e) => handleChange("defaultShiftStart", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>Default Shift End</Label>
                      <Input type="time" value={form.defaultShiftEnd || "18:00"} onChange={(e) => handleChange("defaultShiftEnd", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>Present Window Ends At</Label>
                      <Input type="time" value={form.presentWindowEnd || "10:00"} onChange={(e) => handleChange("presentWindowEnd", e.target.value)} className="mt-1" />
                      <p className="text-xs text-muted-foreground mt-1">Workers punching in after this time will be marked Late or Half Day.</p>
                    </div>
                    <div>
                      <Label>Half Day Starts At</Label>
                      <Input type="time" value={form.halfDayStart || "10:00"} onChange={(e) => handleChange("halfDayStart", e.target.value)} className="mt-1" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "ot" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">Overtime Rules</h3>
                      <p className="text-sm text-muted-foreground">Configure overtime calculations and limits.</p>
                    </div>
                    <Switch checked={form.enableOt} onCheckedChange={(v) => handleChange("enableOt", v)} />
                  </div>
                  
                  {form.enableOt && (
                    <div className="grid grid-cols-2 gap-4 p-4 border border-border rounded-xl bg-muted/10">
                      <div>
                        <Label>OT Start Time</Label>
                        <Input type="time" value={form.otStartTime || "18:30"} onChange={(e) => handleChange("otStartTime", e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label>OT Rate Multiplier (e.g. 1.5x)</Label>
                        <Input type="number" step="0.1" value={form.otRateMultiplier || 1.5} onChange={(e) => handleChange("otRateMultiplier", parseFloat(e.target.value))} className="mt-1" />
                      </div>
                      <div>
                        <Label>Minimum OT Minutes to qualify</Label>
                        <Input type="number" value={form.minOtMinutes || 30} onChange={(e) => handleChange("minOtMinutes", parseInt(e.target.value))} className="mt-1" />
                      </div>
                      <div>
                        <Label>Maximum OT Hours per day</Label>
                        <Input type="number" value={form.maxOtHours || 4} onChange={(e) => handleChange("maxOtHours", parseInt(e.target.value))} className="mt-1" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "sunday" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">Sunday Rules</h3>
                      <p className="text-sm text-muted-foreground">Rules for workers performing tasks on Sundays.</p>
                    </div>
                    <Switch checked={form.enableSundayTracking} onCheckedChange={(v) => handleChange("enableSundayTracking", v)} />
                  </div>
                  
                  {form.enableSundayTracking && (
                    <div className="grid grid-cols-2 gap-4 p-4 border border-border rounded-xl bg-muted/10">
                      <div>
                        <Label>Sunday Rate Multiplier (e.g. 2.0x)</Label>
                        <Input type="number" step="0.1" value={form.sundayRateMultiplier || 2.0} onChange={(e) => handleChange("sundayRateMultiplier", parseFloat(e.target.value))} className="mt-1" />
                      </div>
                      <div>
                        <Label>Sunday OT Rate (e.g. 2.0x)</Label>
                        <Input type="number" step="0.1" value={form.sundayOtRate || 2.0} onChange={(e) => handleChange("sundayOtRate", parseFloat(e.target.value))} className="mt-1" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "face" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">Face Verification</h3>
                      <p className="text-sm text-muted-foreground">Require live selfies for punching in and out.</p>
                    </div>
                    <Switch checked={form.enableFaceVerification} onCheckedChange={(v) => handleChange("enableFaceVerification", v)} />
                  </div>
                  
                  {form.enableFaceVerification && (
                    <div className="grid grid-cols-2 gap-4 p-4 border border-border rounded-xl bg-muted/10">
                      <div>
                        <Label>Required Enrollment Images</Label>
                        <Input type="number" value={form.requiredImages || 5} onChange={(e) => handleChange("requiredImages", parseInt(e.target.value))} className="mt-1" />
                      </div>
                      <div>
                        <Label>Minimum Match %</Label>
                        <Input type="number" value={form.minMatchPercent || 85} onChange={(e) => handleChange("minMatchPercent", parseInt(e.target.value))} className="mt-1" />
                      </div>
                      <div className="col-span-2">
                        <Label>Attendance Photo Retention (Days)</Label>
                        <Input type="number" value={form.retentionDays || 30} onChange={(e) => handleChange("retentionDays", parseInt(e.target.value))} className="mt-1" />
                        <p className="text-xs text-muted-foreground mt-1">Photos older than this will be permanently deleted to save storage.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "device" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold">Device Policy</h3>
                    <p className="text-sm text-muted-foreground">Control device binding for fraud prevention.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                      <div>
                        <p className="font-medium">Single Device Mode</p>
                        <p className="text-sm text-muted-foreground">Workers can only punch in from their registered primary device.</p>
                      </div>
                      <Switch checked={form.singleDeviceMode} onCheckedChange={(v) => handleChange("singleDeviceMode", v)} />
                    </div>
                    <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                      <div>
                        <p className="font-medium">Allow Device Change Requests</p>
                        <p className="text-sm text-muted-foreground">Workers can request to switch their registered device.</p>
                      </div>
                      <Switch checked={form.allowDeviceChange} onCheckedChange={(v) => handleChange("allowDeviceChange", v)} />
                    </div>
                    <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                      <div>
                        <p className="font-medium">Require Supervisor Approval</p>
                        <p className="text-sm text-muted-foreground">Device change requests must be approved by a supervisor.</p>
                      </div>
                      <Switch checked={form.requireSupervisorApproval} onCheckedChange={(v) => handleChange("requireSupervisorApproval", v)} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold">Notifications</h3>
                    <p className="text-sm text-muted-foreground">Automated SMS/Push alerts for workforce management.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                      <div>
                        <p className="font-medium">Attendance Reminder</p>
                        <p className="text-sm text-muted-foreground">Send reminder if worker hasn't punched in by Present Window End.</p>
                      </div>
                      <Switch checked={form.attendanceReminder} onCheckedChange={(v) => handleChange("attendanceReminder", v)} />
                    </div>
                    <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                      <div>
                        <p className="font-medium">Punch Out Reminder</p>
                        <p className="text-sm text-muted-foreground">Send reminder when Shift Ends if worker hasn't punched out.</p>
                      </div>
                      <Switch checked={form.punchOutReminder} onCheckedChange={(v) => handleChange("punchOutReminder", v)} />
                    </div>
                    <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                      <div>
                        <p className="font-medium">Missing Punch Alert</p>
                        <p className="text-sm text-muted-foreground">Alert supervisor if worker forgets to punch out completely.</p>
                      </div>
                      <Switch checked={form.missingPunchAlert} onCheckedChange={(v) => handleChange("missingPunchAlert", v)} />
                    </div>
                    <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                      <div>
                        <p className="font-medium">Leave Alerts</p>
                        <p className="text-sm text-muted-foreground">Notify owner/supervisors of upcoming approved leaves.</p>
                      </div>
                      <Switch checked={form.leaveAlerts} onCheckedChange={(v) => handleChange("leaveAlerts", v)} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "shifts" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">Shift Management</h3>
                      <p className="text-sm text-muted-foreground">Manage organizational shifts and timings.</p>
                    </div>
                    <Button size="sm" onClick={() => { setShiftForm({ name: "", start_time: "", end_time: "" }); setShowShiftModal(true); }}>Add Shift</Button>
                  </div>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="text-left font-semibold p-3">Shift Name</th>
                          <th className="text-left font-semibold p-3">Start Time</th>
                          <th className="text-left font-semibold p-3">End Time</th>
                          <th className="text-left font-semibold p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shifts.map((shift: any) => (
                          <tr key={shift.id} className="border-b border-border hover:bg-muted/20">
                            <td className="p-3">{shift.name}</td>
                            <td className="p-3 text-muted-foreground">{shift.start_time}</td>
                            <td className="p-3 text-muted-foreground">{shift.end_time}</td>
                            <td className="p-3">
                              <Button variant="link" size="sm" className="h-auto p-0 mr-4" onClick={() => { setShiftForm(shift); setShowShiftModal(true); }}>Edit</Button>
                              <Button variant="link" size="sm" className="h-auto p-0 text-red-500" onClick={() => handleDeleteShift(shift.id)}>Remove</Button>
                            </td>
                          </tr>
                        ))}
                        {shifts.length === 0 && (
                          <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No shifts found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Dialog open={showShiftModal} onOpenChange={setShowShiftModal}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>{shiftForm.id ? "Edit Shift" : "Add Shift"}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSaveShift} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Shift Name</Label>
                          <Input required value={shiftForm.name} onChange={e => setShiftForm({...shiftForm, name: e.target.value})} placeholder="e.g. Morning Shift" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Input required type="time" value={shiftForm.start_time} onChange={e => setShiftForm({...shiftForm, start_time: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <Label>End Time</Label>
                            <Input required type="time" value={shiftForm.end_time} onChange={e => setShiftForm({...shiftForm, end_time: e.target.value})} />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button type="button" variant="outline" onClick={() => setShowShiftModal(false)}>Cancel</Button>
                          <Button type="submit">Save Shift</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {activeTab === "holidays" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">Holiday Management</h3>
                      <p className="text-sm text-muted-foreground">Configure national and festival holidays for payroll exemptions.</p>
                    </div>
                    <Button size="sm" onClick={() => { setHolidayForm({ date: "", name: "", type: "National" }); setShowHolidayModal(true); }}>Add Holiday</Button>
                  </div>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="text-left font-semibold p-3">Date</th>
                          <th className="text-left font-semibold p-3">Holiday Name</th>
                          <th className="text-left font-semibold p-3">Type</th>
                          <th className="text-left font-semibold p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holidays.map((hol: any) => (
                          <tr key={hol.id} className="border-b border-border hover:bg-muted/20">
                            <td className="p-3 font-medium">{hol.date}</td>
                            <td className="p-3">{hol.name}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-md text-xs ${hol.type === 'National' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                                {hol.type}
                              </span>
                            </td>
                            <td className="p-3">
                              <Button variant="link" size="sm" className="h-auto p-0 text-red-500" onClick={() => handleDeleteHoliday(hol.id)}>Remove</Button>
                            </td>
                          </tr>
                        ))}
                        {holidays.length === 0 && (
                          <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No holidays found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Dialog open={showHolidayModal} onOpenChange={setShowHolidayModal}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Holiday</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSaveHoliday} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Holiday Name</Label>
                          <Input required value={holidayForm.name} onChange={e => setHolidayForm({...holidayForm, name: e.target.value})} placeholder="e.g. Republic Day" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Input required type="date" value={holidayForm.date} onChange={e => setHolidayForm({...holidayForm, date: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <select 
                              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              value={holidayForm.type}
                              onChange={e => setHolidayForm({...holidayForm, type: e.target.value})}
                            >
                              <option value="National">National</option>
                              <option value="Festival">Festival</option>
                              <option value="Optional">Optional</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button type="button" variant="outline" onClick={() => setShowHolidayModal(false)}>Cancel</Button>
                          <Button type="submit">Save Holiday</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

            </div>
          </ScrollArea>
          
          <div className="p-4 border-t border-border bg-card sticky bottom-0 z-10 flex justify-end">
            <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2 w-full sm:w-auto justify-center shadow-sm">
              <Save size={16} /> {updateMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
