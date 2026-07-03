"use client";

import React, { useState } from "react";
import { Activity, Clock, CheckCircle2, XCircle, Truck, AlertTriangle, UserCog, Filter, Download } from "lucide-react";
import { useActivities, useVehicles, useWorkers } from "@/hooks/useQueries";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const getEventIcon = (type: string) => {
  switch (type) {
    case "qc_passed":
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case "qc_failed":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "vehicle_dispatched":
      return <Truck className="w-5 h-5 text-blue-500" />;
    case "emergency_created":
      return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    case "worker_started":
      return <UserCog className="w-5 h-5 text-purple-500" />;
    default:
      return <Activity className="w-5 h-5 text-gray-500" />;
  }
};

const getEventBgColor = (type: string) => {
  switch (type) {
    case "qc_passed": return "bg-green-500/10";
    case "qc_failed": return "bg-red-500/10";
    case "vehicle_dispatched": return "bg-blue-500/10";
    case "emergency_created": return "bg-orange-500/10";
    case "worker_started": return "bg-purple-500/10";
    default: return "bg-gray-500/10";
  }
};

export default function ActivityLogsPage() {
  const { data: activities = [], isLoading: isLoadingActivities } = useActivities();
  const { data: vehicles = [] } = useVehicles();
  const { data: workers = [] } = useWorkers();

  const [filter, setFilter] = useState<string>("all");

  const filteredActivities = activities
    .filter(activity => filter === "all" || activity.eventType === filter)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
              <p className="text-sm text-muted-foreground mt-1">
                System wide activity events and audits
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border">
              <Filter size={16} className="text-muted-foreground" />
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent text-sm font-medium text-foreground outline-none cursor-pointer"
              >
                <option value="all">All Events</option>
                <option value="qc_passed">QC Passed</option>
                <option value="qc_failed">QC Failed</option>
                <option value="vehicle_dispatched">Dispatches</option>
                <option value="stage_changed">Stage Changes</option>
                <option value="worker_started">Worker Activities</option>
              </select>
            </div>
            <Button variant="outline" className="gap-2">
              <Download size={16} /> Export
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {isLoadingActivities ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
                  <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No activities found</h3>
              <p className="text-muted-foreground mt-1">There are no recorded activities matching your filters.</p>
            </div>
          ) : (
            <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {filteredActivities.map((activity, index) => {
                const vehicle = vehicles.find(v => v.id === activity.vehicleId);
                const worker = workers.find(w => w.id === activity.workerId);
                
                return (
                  <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Icon */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${getEventBgColor(activity.eventType)}`}>
                      {getEventIcon(activity.eventType)}
                    </div>
                    
                    {/* Content */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                          {activity.eventType.replace('_', ' ')}
                        </span>
                        <div className="flex items-center text-xs text-muted-foreground mt-1 sm:mt-0">
                          <Clock className="w-3 h-3 mr-1" />
                          {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                        </div>
                      </div>
                      <p className="text-sm text-foreground">{activity.description}</p>
                      
                      {(vehicle || worker) && (
                        <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
                          {vehicle && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground">
                              Vehicle: {vehicle.vehicleNumber}
                            </span>
                          )}
                          {worker && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground">
                              Worker: {worker.name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

