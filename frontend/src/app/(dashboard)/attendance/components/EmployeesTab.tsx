import React, { useState } from "react";
import { Worker } from "@/types";
import { Plus, Users, UserCheck, Briefcase } from "lucide-react";
import EmployeeFormDrawer from "./EmployeeFormDrawer";
import EmployeeProfileDrawer from "./EmployeeProfileDrawer";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EmployeesTabProps {
  workers: Worker[];
  isLoading: boolean;
}

export default function EmployeesTab({ workers, isLoading }: EmployeesTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

  const activeEmployees = workers.filter(w => w.employmentStatus === "Active").length;
  const supervisors = workers.filter(w => w.role === "Supervisor").length;

  const filteredWorkers = workers.filter(w => {
     if (departmentFilter !== "All" && w.department !== departmentFilter) return false;
     if (roleFilter !== "All" && w.role !== roleFilter) return false;
     return true;
  });

  const columns: ColumnDef<Worker>[] = [
    {
      id: "employeeId",
      header: "Employee ID",
      accessor: (row) => <span className="font-medium">{row.employeeId}</span>,
      sortable: true,
    },
    {
      id: "name",
      header: "Full Name",
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.mobileNumber || "No number"}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      id: "department",
      header: "Department",
      accessor: (row) => row.department,
      sortable: true,
    },
    {
      id: "role",
      header: "Role",
      accessor: (row) => row.role,
      sortable: true,
    },
    {
      id: "shift",
      header: "Shift",
      accessor: (row) => (
        <div>
          <p className="font-medium text-xs">{row.shiftType || "General"}</p>
          <p className="text-xs text-muted-foreground">{row.shiftStart} - {row.shiftEnd}</p>
        </div>
      ),
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      accessor: (row) => {
        const isActive = row.employmentStatus === "Active";
        return (
          <Badge variant="outline" className={isActive ? "border-emerald-500 text-emerald-500 bg-emerald-500/10" : "border-red-500 text-red-500 bg-red-500/10"}>
            {row.employmentStatus || "Active"}
          </Badge>
        );
      },
      sortable: true,
    },
  ];

  if (isLoading) return <div>Loading employees...</div>;

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      {/* OWNER KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary"><Users size={20} /></div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Employees</p>
            <h3 className="text-2xl font-bold">{workers.length}</h3>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500"><UserCheck size={20} /></div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Active Employees</p>
            <h3 className="text-2xl font-bold">{activeEmployees}</h3>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500"><Briefcase size={20} /></div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Workers / Supervisors</p>
            <h3 className="text-2xl font-bold">{workers.length - supervisors} / {supervisors}</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 bg-card rounded-xl border border-border shadow-sm p-5 overflow-hidden">
        <div className="flex justify-between items-start sm:items-center mb-4 flex-col sm:flex-row gap-4">
          <div>
            <h2 className="text-lg font-semibold">Employee Directory</h2>
            <p className="text-sm text-muted-foreground">Manage your workforce, profiles, and attendance settings.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
             <select 
               value={departmentFilter} 
               onChange={(e) => setDepartmentFilter(e.target.value)}
               className="flex-1 sm:flex-none bg-muted/50 border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
             >
               <option value="All">All Departments</option>
               <option value="Fabrication">Fabrication</option>
               <option value="Assembly">Assembly</option>
               <option value="Paint">Paint</option>
               <option value="Quality">Quality</option>
               <option value="Dispatch">Dispatch</option>
             </select>
             <select 
               value={roleFilter} 
               onChange={(e) => setRoleFilter(e.target.value)}
               className="flex-1 sm:flex-none bg-muted/50 border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
             >
               <option value="All">All Roles</option>
               <option value="Worker">Worker</option>
               <option value="Supervisor">Supervisor</option>
             </select>
            <Button
              onClick={() => {
                setSelectedWorker(null);
                setIsFormOpen(true);
              }}
              className="flex-1 sm:flex-none justify-center gap-2"
            >
              <Plus size={16} /> Add Employee
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredWorkers}
          searchKey={(row) => `${row.name} ${row.employeeId} ${row.department} ${row.mobileNumber}`}
          onRowClick={(row) => {
            setSelectedWorker(row);
            setIsProfileOpen(true);
          }}
          rowId={(row) => row.id}
        />
      </div>

      <EmployeeFormDrawer
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        worker={selectedWorker}
      />
      
      <EmployeeProfileDrawer
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        worker={selectedWorker}
        onEditClick={(worker) => {
          setSelectedWorker(worker);
          setIsFormOpen(true);
        }}
      />
    </div>
  );
}
