import { cn } from "@/lib/utils";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface SparklineProps {
  data: number[];
  color?: string;
}

function Sparkline({ data, color = "currentColor" }: SparklineProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 32;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      width={width}
      height={height}
      className="opacity-70"
      role="img"
      aria-label="Trend sparkline"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
}

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - (1 - t) ** 3;
      setCount(Math.round(ease * target));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return count;
}

export type TrendDirection = "up" | "down" | "neutral";

interface KPICardProps {
  title: string;
  value: number;
  trend?: TrendDirection;
  trendValue?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  accentClass?: string;
  icon?: React.ReactNode;
  className?: string;
  "data-ocid"?: string;
}

export function KPICard({
  title,
  value,
  trend = "neutral",
  trendValue,
  sparklineData,
  sparklineColor,
  accentClass = "text-foreground",
  icon,
  className,
  "data-ocid": ocid,
}: KPICardProps) {
  const count = useCountUp(value);

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColorClass =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <motion.div
      data-ocid={ocid}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "bg-card border border-border rounded-xl p-4 shadow-subtle flex flex-col gap-3 hover:shadow-elevated transition-smooth cursor-default",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <span
            className={cn(
              "text-3xl font-bold font-display tabular-nums",
              accentClass,
            )}
          >
            {count}
          </span>
          {trendValue && (
            <span
              className={cn(
                "ml-2 text-xs font-medium flex items-center gap-0.5 inline-flex",
                trendColorClass,
              )}
            >
              <TrendIcon size={12} />
              {trendValue}
            </span>
          )}
        </div>
        {sparklineData && (
          <Sparkline
            data={sparklineData}
            color={sparklineColor ?? "oklch(var(--primary))"}
          />
        )}
      </div>
    </motion.div>
  );
}
