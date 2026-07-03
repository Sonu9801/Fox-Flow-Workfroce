import { cn } from "@/lib/utils";
import type { Priority } from "@/types";

const priorityConfig = {
  normal: {
    label: "Normal",
    className: "bg-muted/80 text-muted-foreground border border-border",
    dotClass: "bg-muted-foreground",
  },
  high: {
    label: "High",
    className: "bg-warning/15 text-warning border border-warning/30",
    dotClass: "bg-warning",
  },
  urgent: {
    label: "Urgent",
    className: "bg-destructive/15 text-destructive border border-destructive/30",
    dotClass: "bg-destructive animate-pulse",
  },
} as const;

interface PriorityBadgeProps {
  priority: Priority;
  showLabel?: boolean;
  className?: string;
}

export function PriorityBadge({
  priority,
  showLabel = true,
  className,
}: PriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig.normal;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium",
        config.className,
        className,
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full flex-shrink-0",
          config.dotClass,
        )}
      />
      {showLabel && config.label}
    </span>
  );
}
