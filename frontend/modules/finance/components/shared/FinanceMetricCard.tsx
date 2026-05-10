"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatMoney } from "../../services/finance.mappers";
import type { Money } from "../../types/finance.types";

type FinanceMetricCardProps = {
  title: string;
  value: Money;
  trend?: "up" | "down" | "flat";
  changePercent?: number;
  className?: string;
};

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") {
    return (
      <svg
        className="h-4 w-4 text-emerald-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    );
  }
  if (trend === "down") {
    return (
      <svg
        className="h-4 w-4 text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    );
  }
  return (
    <svg
      className="h-4 w-4 text-muted-foreground"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

export function FinanceMetricCard({
  title,
  value,
  trend,
  changePercent,
  className,
}: FinanceMetricCardProps) {
  return (
    <Card className={cn("min-w-0", className)}>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">
          {formatMoney(value)}
        </p>
        {trend && changePercent != null && (
          <div className="mt-1 flex items-center gap-1">
            <TrendIcon trend={trend} />
            <span
              className={cn(
                "text-xs font-medium",
                trend === "up" && "text-emerald-500",
                trend === "down" && "text-red-500",
                trend === "flat" && "text-muted-foreground"
              )}
            >
              {changePercent > 0 ? "+" : ""}
              {changePercent.toFixed(1)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
