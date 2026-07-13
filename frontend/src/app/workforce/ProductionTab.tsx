import React, { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api";
import { CarFront, Clock, CheckCircle2, AlertCircle, ChevronRight, Users, Settings2, Search, Plus, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AddVehicleDialog } from "@/components/vehicles/AddVehicleDialog";
import { AssignJobDialog } from "@/components/vehicles/AssignJobDialog";
import { GateEntryDrawer } from "@/components/vehicles/GateEntryDrawer";
import { useCreateVehicle, useVerifyVehicle, useWorkers } from "@/hooks/useQueries";
import { toast } from "sonner";

export function ProductionTab({ activeUser }: { activeUser: any }) {
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "progress" | "completed">("progress");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [assignJobState, setAssignJobState] = useState<{ isOpen: boolean; vehicle: any | null }>({
    isOpen: false,
    vehicle: null,
  });
  const [verifyState, setVerifyState] = useState<{ isOpen: boolean; vehicle: any | null }>({
    isOpen: false,
    vehicle: null,
  });

  const createVehicleMutation = useCreateVehicle();
  const verifyVehicleMutation = useVerifyVehicle();
  const { data: workers = [] } = useWorkers();

  const { data: platforms = [], isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehiclesApi.getAll(),
    refetchInterval: 30000,
  });

  const getFilteredPlatforms = () => {
    let filtered = platforms;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p: any) => 
        (p.platformNumber || p.trackingId)?.toLowerCase().includes(q) ||
        p.vehicleNumber?.toLowerCase().includes(q) ||
        p.oemName?.toLowerCase().includes(q)
      );
    }
    return filtered;
  };

  const filteredPlatforms = getFilteredPlatforms();

  const columns = [
    { id: "oem", title: "OEM", stages: ["oem"], color: "border-gray-200 bg-gray-50/50 dark:bg-zinc-900/50 dark:border-zinc-800/80" },
    { id: "incoming_verification", title: "Verify (In)", stages: ["incoming_verification"], color: "border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900/30" },
    { id: "supervisor_verification", title: "Verify (Sup)", stages: ["supervisor_verification"], color: "border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900/30" },
    { id: "rejected", title: "Rejected", stages: ["rejected"], color: "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/30" },
    { id: "received", title: "Received", stages: ["received"], color: "border-gray-200 bg-gray-50/50 dark:bg-zinc-900/50 dark:border-zinc-800/80" },
    { id: "fabrication", title: "Fabrication", stages: ["fabrication"], color: "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/30" },
    { id: "paint", title: "Paint", stages: ["paint"], color: "border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-900/30" },
    { id: "quality", title: "Quality", stages: ["quality"], color: "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-900/30" },
    { id: "rtd", title: "RTD", stages: ["rtd", "readytodispatch"], color: "border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900/30" },
    { id: "dispatch", title: "Dispatch", stages: ["dispatch"], color: "border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900/30" },
    { id: "delivered", title: "Delivered", stages: ["delivered"], color: "border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900/30" },
  ];

  return (
    <div className="p-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Production</h2>
          <p className="text-sm text-gray-500 font-medium">Track vehicle assembly stages</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition-colors"
        >
          <Plus size={16} />
          Receive New
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input 
          placeholder="Search by Platform ID, Vehicle, or OEM..." 
          className="pl-10 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 rounded-xl h-12"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-6 gap-4 -mx-4 px-4 h-[calc(100vh-280px)] min-h-[500px]">
        {columns.map((col) => {
          const columnVehicles = filteredPlatforms.filter((pf: any) => {
            const stage = pf.currentStage?.toLowerCase() === "readytodispatch" ? "rtd" : pf.currentStage?.toLowerCase() || "";
            return col.stages.includes(stage);
          });
          
          return (
            <div 
              key={col.id} 
              className={`snap-center shrink-0 w-[85vw] max-w-[340px] flex flex-col rounded-[24px] border ${col.color} overflow-hidden`}
            >
              <div className="px-5 py-4 border-b border-inherit bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
                <h3 className="font-extrabold text-gray-900 dark:text-white">{col.title}</h3>
                <Badge variant="secondary" className="bg-white dark:bg-zinc-800 rounded-full font-bold">
                  {columnVehicles.length}
                </Badge>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3 hide-scrollbar">
                {columnVehicles.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                    <CarFront size={32} className="mb-2 opacity-20" />
                    <p className="text-sm font-medium">No vehicles</p>
                  </div>
                ) : (
                  columnVehicles.map((pf: any, idx: number) => {
                    const workerCount = pf.assignedWorkerIds?.length || pf.workers?.length || 0;
                    const stage = pf.currentStage?.toLowerCase() || "";
                    const isCompleted = ["rtd", "dispatch", "delivered", "readytodispatch"].includes(stage);
                    
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={pf.id} 
                        className="bg-white dark:bg-zinc-900 rounded-[20px] p-4 shadow-sm border border-gray-100 dark:border-zinc-800"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <Badge variant="outline" className="mb-2 bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] uppercase font-bold px-2 py-0.5">
                              {pf.currentStage || "Pending"}
                            </Badge>
                            <h3 className="font-extrabold text-lg leading-tight">{pf.platformNumber || pf.trackingId}</h3>
                            <p className="text-sm text-gray-800 dark:text-gray-300 font-bold mt-1">{pf.vehicleNumber || pf.vehicleModel}</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">{pf.oemName}</p>
                          </div>
                          {isCompleted ? (
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 size={16} />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                              <Settings2 size={16} />
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800">
                          <div className="flex justify-between items-center text-[11px] font-bold mb-2">
                            <span className="text-gray-600 flex items-center gap-1.5">
                              <Users size={12} /> 
                              {workerCount} {workerCount === 1 ? 'Worker' : 'Workers'}
                            </span>
                            <span className="text-indigo-600">{pf.progressPercent || 0}%</span>
                          </div>
                          
                          <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mb-3">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`} 
                              style={{ width: `${pf.progressPercent || 0}%` }}
                            />
                          </div>
                          
                          {(!isCompleted && ["oem", "incoming_verification", "supervisor_verification"].includes(stage)) && (
                            <button
                              onClick={() => setVerifyState({ isOpen: true, vehicle: pf })}
                              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors"
                            >
                              <CheckCircle2 size={14} />
                              Verify
                            </button>
                          )}
                          
                          {(!isCompleted && !["oem", "incoming_verification", "supervisor_verification", "rejected"].includes(stage)) && (
                            <button
                              onClick={() => setAssignJobState({ isOpen: true, vehicle: pf })}
                              className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors border border-indigo-200 dark:border-indigo-500/30"
                            >
                              <UserPlus size={14} />
                              Assign Job
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <AddVehicleDialog
          onClose={() => setShowAddModal(false)}
          onAdd={(data) => createVehicleMutation.mutate(data)}
          isOemSubmission={false}
        />
      )}

      <AssignJobDialog 
        vehicle={assignJobState.vehicle} 
        open={assignJobState.isOpen}
        stage={assignJobState.vehicle?.currentStage || ""}
        workers={workers}
        onClose={() => setAssignJobState({ isOpen: false, vehicle: null })} 
        onAssignComplete={() => setAssignJobState({ isOpen: false, vehicle: null })}
      />

      <GateEntryDrawer 
        vehicle={verifyState.vehicle}
        open={verifyState.isOpen}
        onOpenChange={(open) => setVerifyState({ isOpen: open, vehicle: open ? verifyState.vehicle : null })}
        onVerificationComplete={() => setVerifyState({ isOpen: false, vehicle: null })}
      />
    </div>
  );
}
