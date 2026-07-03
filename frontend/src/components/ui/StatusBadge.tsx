import { cn } from "@/lib/utils";
import type { Stage } from "@/types";

const stageConfig: Partial<Record<Stage, { label: string; className: string }>> = {
  received: { label: "Received", className: "bg-muted text-muted-foreground" },
  fabrication: {
    label: "Fabrication",
    className: "bg-primary/15 text-primary border border-primary/30",
  },
  paint: {
    label: "Paint",
    className: "bg-purple-500/15 text-purple-500 border border-purple-500/30",
  },
  rtd: {
    label: "RTD",
    className: "bg-success/15 text-success border border-success/30",
  },
  dispatch: {
    label: "Dispatched",
    className:
      "bg-success/25 text-success font-semibold border border-success/40",
  },
  oem: {
    label: "OEM Submitted",
    className: "bg-warning/15 text-warning border border-warning/30",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/15 text-destructive border border-destructive/30",
  },
};

interface StatusBadgeProps {
  stage: Stage;
  className?: string;
}

export function StatusBadge({ stage, className }: StatusBadgeProps) {
  const normStage = (
    stage?.toLowerCase() === "readytodispatch" ? "rtd" : 
    stage?.toLowerCase() === "dispatched" ? "dispatch" : 
    stage?.toLowerCase()
  ) as Stage;

  const config = stageConfig[normStage] || { label: stage, className: "bg-muted text-muted-foreground" };
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
