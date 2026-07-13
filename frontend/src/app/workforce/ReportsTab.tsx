import React, { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { vehiclesApi, attendanceApi, workersApi, leaveApi } from "@/lib/api";
import { exportToCSV, exportToPDF, exportToExcel } from "@/app/(dashboard)/reports/components/exportUtils";
import { FileText, FileSpreadsheet, File, BarChart3, Clock, Users, ShieldCheck, ChevronDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";

export function ReportsTab({ activeUser }: { activeUser: any }) {
  const [selectedReport, setSelectedReport] = useState<string>("Production");
  const [isExporting, setIsExporting] = useState(false);

  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: vehiclesApi.getAll });
  const { data: workers = [] } = useQuery({ queryKey: ["workers"], queryFn: workersApi.getAll });
  const { data: leaves = [] } = useQuery({ queryKey: ["leaves"], queryFn: leaveApi.getAll });
  
  // Need raw attendance logs for detailed reports, but we can mock with workers list for now or fetch analytics
  const { data: attendanceAnalytics = {} } = useQuery({ queryKey: ["attendanceAnalytics"], queryFn: attendanceApi.getAnalytics });

  const reportsList = [
    { id: "Production", title: "Production Report", desc: "Vehicle tracking and stage distribution.", icon: BarChart3, color: "text-blue-500", bg: "bg-blue-50" },
    { id: "Attendance", title: "Attendance Report", desc: "Daily attendance, absence, and late reporting.", icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
    { id: "Workers", title: "Worker Productivity", desc: "Workforce distribution and status.", icon: Users, color: "text-green-500", bg: "bg-green-50" },
    { id: "Leaves", title: "Leave Report", desc: "Leave requests and history.", icon: FileText, color: "text-purple-500", bg: "bg-purple-50" },
  ];

  const handleExport = async (type: "csv" | "excel" | "pdf") => {
    setIsExporting(true);
    
    try {
      const dateRange = format(new Date(), "MMM dd, yyyy");
      
      if (selectedReport === "Production") {
        const headers = ["TrackingID", "VehicleNumber", "OEM", "Stage", "Progress"];
        const tableData = vehicles.map((v: any) => ({
          TrackingID: v.tracking_id,
          VehicleNumber: v.vehicle_number,
          OEM: v.oem_name,
          Stage: v.current_stage,
          Progress: `${v.progress_percent}%`,
        }));
        
        const filename = "Production_Report";
        if (type === "csv") exportToCSV(filename, headers, tableData);
        else if (type === "excel") exportToExcel(filename, headers, tableData);
        else exportToPDF(filename, "Production Report", headers, tableData, { dateRange, summary: "Vehicle production status." });
      }
      
      else if (selectedReport === "Attendance") {
        const headers = ["EmployeeID", "Name", "Department", "Status"];
        const tableData = workers.filter((w: any) => !activeUser?.department || w.department === activeUser.department).map((w: any) => ({
          EmployeeID: w.employee_id,
          Name: w.name,
          Department: w.department,
          Status: "Available", // Simplified for PWA export
        }));
        
        const filename = "Attendance_Report";
        if (type === "csv") exportToCSV(filename, headers, tableData);
        else if (type === "excel") exportToExcel(filename, headers, tableData);
        else exportToPDF(filename, "Attendance Report", headers, tableData, { dateRange, summary: "Daily attendance reporting." });
      }

      else if (selectedReport === "Workers") {
        const headers = ["EmployeeID", "Name", "Role", "Department", "SkillLevel"];
        const tableData = workers.filter((w: any) => !activeUser?.department || w.department === activeUser.department).map((w: any) => ({
          EmployeeID: w.employee_id,
          Name: w.name,
          Role: w.role,
          Department: w.department,
          SkillLevel: w.skill_level || "Standard",
        }));
        
        const filename = "Workers_Report";
        if (type === "csv") exportToCSV(filename, headers, tableData);
        else if (type === "excel") exportToExcel(filename, headers, tableData);
        else exportToPDF(filename, "Worker Productivity Report", headers, tableData, { dateRange, summary: "Workforce distribution." });
      }
      
      else if (selectedReport === "Leaves") {
        const headers = ["WorkerID", "Type", "StartDate", "EndDate", "Status"];
        const tableData = leaves.map((l: any) => ({
          WorkerID: l.worker_id,
          Type: l.leave_type,
          StartDate: format(new Date(l.start_date), "yyyy-MM-dd"),
          EndDate: format(new Date(l.end_date), "yyyy-MM-dd"),
          Status: l.status,
        }));
        
        const filename = "Leaves_Report";
        if (type === "csv") exportToCSV(filename, headers, tableData);
        else if (type === "excel") exportToExcel(filename, headers, tableData);
        else exportToPDF(filename, "Leave Report", headers, tableData, { dateRange, summary: "Leave requests and history." });
      }
      
    } catch (e) {
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <FileText className="text-indigo-600" size={28} />
          Reports Hub
        </h1>
        <p className="text-sm text-gray-500 mt-1">Generate and export realtime data.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {reportsList.map((r) => (
          <button 
            key={r.id} 
            onClick={() => setSelectedReport(r.id)}
            className={`p-4 rounded-[24px] border transition-all text-left flex flex-col gap-3 relative overflow-hidden ${
              selectedReport === r.id 
                ? "bg-white dark:bg-zinc-900 border-indigo-500 shadow-md shadow-indigo-500/10" 
                : "bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800"
            }`}
          >
            {selectedReport === r.id && (
              <div className="absolute top-3 right-3 text-indigo-500">
                <CheckCircle2 size={16} />
              </div>
            )}
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${r.bg} ${r.color}`}>
              <r.icon size={20} />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{r.title}</p>
              <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{r.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-[32px] border border-indigo-100 dark:border-indigo-800/30">
        <h3 className="font-extrabold text-indigo-900 dark:text-indigo-100 mb-4">Export {selectedReport}</h3>
        <div className="grid grid-cols-3 gap-2">
          <Button 
            className="rounded-2xl h-14 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm flex-col gap-1 dark:bg-zinc-900 dark:text-gray-300 dark:border-zinc-800 dark:hover:bg-zinc-800" 
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
          >
            <File className="text-red-500" size={18} />
            <span className="text-[10px] font-bold uppercase">PDF</span>
          </Button>
          <Button 
            className="rounded-2xl h-14 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm flex-col gap-1 dark:bg-zinc-900 dark:text-gray-300 dark:border-zinc-800 dark:hover:bg-zinc-800" 
            onClick={() => handleExport("excel")}
            disabled={isExporting}
          >
            <FileSpreadsheet className="text-green-600" size={18} />
            <span className="text-[10px] font-bold uppercase">Excel</span>
          </Button>
          <Button 
            className="rounded-2xl h-14 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm flex-col gap-1 dark:bg-zinc-900 dark:text-gray-300 dark:border-zinc-800 dark:hover:bg-zinc-800" 
            onClick={() => handleExport("csv")}
            disabled={isExporting}
          >
            <FileText className="text-blue-500" size={18} />
            <span className="text-[10px] font-bold uppercase">CSV</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
