"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type HermesMetricCardProps = {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: { value: number; label: string };
  className?: string;
};

export function HermesMetricCard({
  title,
  value,
  icon,
  description,
  trend,
  className,
}: HermesMetricCardProps) {
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <Card className={cn("min-w-0", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{displayValue}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="mt-1 flex items-center gap-1">
            <span
              className={cn(
                "text-xs font-medium",
                trend.value > 0 && "text-emerald-500",
                trend.value < 0 && "text-red-500",
                trend.value === 0 && "text-muted-foreground"
              )}
            >
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
