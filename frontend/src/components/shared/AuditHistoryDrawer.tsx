import React, { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useActivities } from "@/hooks/useQueries";
import { format } from "date-fns";

export interface AuditHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: string;
  recordId?: string | number;
  title?: string;
}

export function AuditHistoryDrawer({
  open,
  onOpenChange,
  module,
  recordId,
  title,
}: AuditHistoryDrawerProps) {
  const { data: activities = [], isLoading } = useActivities();

  const filteredHistory = useMemo(() => {
    if (!recordId) return [];
    return activities.filter((activity) => {
      if (["workers", "attendance", "payroll"].includes(module)) return activity.workerId === Number(recordId);
      if (["vehicles", "production", "quality_records", "dispatch_records", "dispatch", "quality"].includes(module)) return activity.vehicleId === Number(recordId);
      return false;
    });
  }, [activities, module, recordId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{title || "Audit History"}</SheetTitle>
        </SheetHeader>
        
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No history found for this record.
          </div>
        ) : (
          <div className="space-y-6 pl-4 pt-2">
            {filteredHistory.map((activity) => (
              <div key={activity.id} className="relative pl-6 border-l-2 border-primary/30 pb-2">
                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary border-2 border-background"></div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{format(new Date(activity.timestamp), "PP p")}</span>
                  <span className="font-semibold text-foreground">{activity.editedBy || "System"}</span>
                </div>
                <h4 className="text-sm font-semibold capitalize mb-1">
                  {activity.eventType.replace(/_/g, " ")}
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {activity.description}
                </p>
                {activity.reason && (
                  <div className="bg-muted/50 p-2 rounded text-xs border border-border mb-2">
                    <strong>Reason:</strong> {activity.reason}
                  </div>
                )}
                {activity.oldValue && activity.newValue && (
                  <div className="bg-card border border-border p-2 rounded text-[10px] font-mono overflow-x-auto">
                    <div className="text-destructive line-through mb-1">
                      - {typeof activity.oldValue === 'string' ? activity.oldValue : JSON.stringify(activity.oldValue)}
                    </div>
                    <div className="text-success">
                      + {typeof activity.newValue === 'string' ? activity.newValue : JSON.stringify(activity.newValue)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
