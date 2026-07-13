"use client";

import React, { useState } from "react";
import { FileBarChart, Filter, Calendar as CalendarIcon, Printer } from "lucide-react";
import { useVehicles, useWorkers, useQCRecords, useDispatchRecords, useActivities, useInvoices } from "@/hooks/useQueries";
import { useAuthStore } from "@/store/authStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { ExecutiveDashboardTab } from "./components/ExecutiveDashboardTab";
import { ProductionReportsTab } from "./components/ProductionReportsTab";
import { AttendanceReportsTab } from "./components/AttendanceReportsTab";
import { PayrollReportsTab } from "./components/PayrollReportsTab";
import { WorkersReportsTab } from "./components/WorkersReportsTab";
import { OemReportsTab } from "./components/OemReportsTab";
import { ActivityLogsTab } from "./components/ActivityLogsTab";
import { QualityReportsTab } from "./components/QualityReportsTab";
import { DispatchReportsTab } from "./components/DispatchReportsTab";
import { InvoiceReportsTab } from "./components/InvoiceReportsTab";
import { ComponentReportsTab } from "./components/ComponentReportsTab";

export default function ReportsPage() {
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles();
  const { data: workers = [], isLoading: isLoadingWorkers } = useWorkers();
  const { data: qcRecords = [], isLoading: isLoadingQC } = useQCRecords();
  const { data: dispatchRecords = [], isLoading: isLoadingDispatch } = useDispatchRecords();
  const { data: activities = [], isLoading: isLoadingActivities } = useActivities();
  const { data: invoices = [], isLoading: isLoadingInvoices } = useInvoices();
  const role = useAuthStore(state => state.role);
  const username = useAuthStore(state => state.name);

  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    oem: "All",
    department: "All",
    supervisor: "All",
    worker: "All",
    vehicleType: "All",
    status: "All"
  });

  const isLoading = isLoadingVehicles || isLoadingWorkers || isLoadingQC || isLoadingDispatch || isLoadingActivities || isLoadingInvoices;

  // Security Filtering
  const filteredVehicles = role === "oem" 
    ? vehicles.filter(v => v.oemName.toLowerCase() === username?.toLowerCase()) 
    : vehicles;
    
  const filteredDispatch = role === "oem"
    ? dispatchRecords.filter(d => filteredVehicles.some(v => v.id === d.vehicleId.toString()))
    : dispatchRecords;

  const filteredQC = role === "oem"
    ? qcRecords.filter(q => filteredVehicles.some(v => v.id === q.vehicleId.toString()))
    : qcRecords;

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-background p-6 animate-pulse space-y-6">
        <div className="h-20 bg-card rounded-xl border border-border w-full" />
        <div className="h-64 bg-card rounded-xl border border-border w-full" />
      </div>
    );
  }

  const isOem = role === "oem";
  const isWorker = role === "worker";

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex-shrink-0 p-4 md:px-6 md:py-5 border-b border-border bg-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileBarChart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isOem ? "Enterprise OEM Reports" : "Executive Enterprise Dashboard"}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto mt-4 md:mt-0">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border w-full md:w-auto">
              <CalendarIcon size={16} className="text-muted-foreground shrink-0" />
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent text-sm font-medium text-foreground outline-none cursor-pointer flex-1"
              >
                <option>Today</option>
                <option>Yesterday</option>
                <option>This Week</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>This Month</option>
                <option>All Time</option>
              </select>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" className="gap-2 flex-1 md:flex-none" onClick={handlePrint}>
                <Printer size={16} /> Print
              </Button>
              <Button variant="outline" className="gap-2 flex-1 md:flex-none" onClick={() => setShowFilters(!showFilters)}>
                <Filter size={16} /> Filters
              </Button>
            </div>
          </div>
        </div>
        
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Department</span>
              <select 
                className="bg-background border border-input rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[150px] w-full"
                value={(filters as any)['Department'] || 'All'}
                onChange={(e) => setFilters({...filters, 'Department': e.target.value})}
              >
                <option value="All">All Departments</option>
                <option value="Fabrication">Fabrication</option>
                <option value="Paint">Paint</option>
                <option value="Assembly">Assembly</option>
                <option value="Quality">Quality</option>
                <option value="Dispatch">Dispatch</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Shift</span>
              <select 
                className="bg-background border border-input rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[150px] w-full"
                value={(filters as any)['Shift'] || 'All'}
                onChange={(e) => setFilters({...filters, 'Shift': e.target.value})}
              >
                <option value="All">All Shifts</option>
                <option value="General Shift">General Shift</option>
                <option value="Morning Shift">Morning Shift</option>
                <option value="Night Shift">Night Shift</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Status</span>
              <select 
                className="bg-background border border-input rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[150px] w-full"
                value={(filters as any)['Status'] || 'All'}
                onChange={(e) => setFilters({...filters, 'Status': e.target.value})}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Offline">Offline</option>
                <option value="Break">Break</option>
              </select>
            </div>

            <div className="flex items-end w-full sm:w-auto sm:ml-auto">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setFilters({ ...filters, Department: "All", Shift: "All", Status: "All" })}
                className="text-muted-foreground hover:text-foreground w-full sm:w-auto"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue={isWorker ? "attendance" : "executive"} className="w-full">
            <TabsList className="mb-6 w-full justify-start h-auto p-1 bg-muted/50 overflow-x-auto flex-nowrap rounded-xl border border-border/50 no-scrollbar">
              {!isWorker && (
                <TabsTrigger value="executive" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-max">Executive Dashboard</TabsTrigger>
              )}
              <TabsTrigger value="production" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-max">Production</TabsTrigger>
              
              {!isOem && (
                <>
                  <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-max">Attendance</TabsTrigger>
                  <TabsTrigger value="payroll" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-max">Payroll</TabsTrigger>
                  <TabsTrigger value="workers" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-max">Workers</TabsTrigger>
                  <TabsTrigger value="components" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-max">Components</TabsTrigger>
                </>
              )}
              
              <TabsTrigger value="quality" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-max">Quality Control</TabsTrigger>
              <TabsTrigger value="dispatch" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-max">Dispatch</TabsTrigger>
              {!isOem && !isWorker && (
                <TabsTrigger value="invoices" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-max">Invoices</TabsTrigger>
              )}
              
              {!isOem && !isWorker && (
                <TabsTrigger value="oem" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-max">OEM</TabsTrigger>
              )}
              {!isOem && !isWorker && (
                <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-max">Activity Logs</TabsTrigger>
              )}
            </TabsList>

            {!isWorker && (
              <TabsContent value="executive">
                <ExecutiveDashboardTab 
                  vehicles={filteredVehicles} 
                  dispatchRecords={filteredDispatch}
                  workers={isOem ? [] : workers}
                  qcRecords={filteredQC}
                  activities={activities}
                  dateRange={dateRange}
                  filters={filters}
                />
              </TabsContent>
            )}
            
            <TabsContent value="production">
              <ProductionReportsTab vehicles={filteredVehicles} dateRange={dateRange} filters={filters} />
            </TabsContent>
            
            {!isOem && (
              <>
                <TabsContent value="attendance">
                  <AttendanceReportsTab workers={workers} dateRange={dateRange} filters={filters} />
                </TabsContent>
                <TabsContent value="payroll">
                  <PayrollReportsTab workers={workers} dateRange={dateRange} filters={filters} />
                </TabsContent>
                <TabsContent value="workers">
                  <WorkersReportsTab workers={workers} dateRange={dateRange} filters={filters} />
                </TabsContent>
                <TabsContent value="components">
                  <ComponentReportsTab />
                </TabsContent>
              </>
            )}

            <TabsContent value="quality">
              <QualityReportsTab qcRecords={filteredQC} dateRange={dateRange} filters={filters} />
            </TabsContent>

            <TabsContent value="dispatch">
              <DispatchReportsTab dispatchRecords={filteredDispatch} dateRange={dateRange} filters={filters} />
            </TabsContent>

            {!isOem && !isWorker && (
              <TabsContent value="invoices">
                <InvoiceReportsTab invoices={invoices} dateRange={dateRange} filters={filters} />
              </TabsContent>
            )}
            
            {!isOem && !isWorker && (
              <TabsContent value="oem">
                <OemReportsTab vehicles={vehicles} dispatchRecords={dispatchRecords} dateRange={dateRange} filters={filters} />
              </TabsContent>
            )}
            
            {!isOem && !isWorker && (
              <TabsContent value="activity">
                <ActivityLogsTab activities={activities} dateRange={dateRange} filters={filters} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
