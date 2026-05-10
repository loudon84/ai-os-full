"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type HealthStatusBadgeProps = {
  status: "healthy" | "degraded" | "offline";
  showLabel?: boolean;
  className?: string;
};

const statusConfig = {
  healthy: { label: "Healthy", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/25" },
  degraded: { label: "Degraded", className: "bg-amber-500/15 text-amber-600 border-amber-500/25" },
  offline: { label: "Offline", className: "bg-red-500/15 text-red-600 border-red-500/25" },
} as const;

export function HealthStatusBadge({ status, showLabel = true, className }: HealthStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      <span
        className={cn(
          "mr-1.5 inline-block h-2 w-2 rounded-full",
          status === "healthy" && "bg-emerald-500",
          status === "degraded" && "bg-amber-500",
          status === "offline" && "bg-red-500"
        )}
      />
      {showLabel && config.label}
    </Badge>
  );
}
