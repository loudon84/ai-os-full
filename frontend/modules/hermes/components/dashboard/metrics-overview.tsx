"use client";

import { useHermesMetrics } from "../../hooks/useHermesMetrics";
import { ClickableMetricCard } from "./clickable-metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { FinanceKpiView } from "@/modules/finance/types/finance-view";

export function MetricsOverview() {
  const { metrics, query } = useHermesMetrics();

  if (query.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const items: FinanceKpiView[] = [
    {
      key: "sessions",
      label: "Sessions",
      value: metrics?.sessions ?? 0,
      hint: "Conversation sessions",
    },
    {
      key: "messages",
      label: "Messages",
      value: metrics?.messages ?? 0,
      hint: "All message turns",
    },
    {
      key: "toolCalls",
      label: "Tool Calls",
      value: metrics?.toolCalls ?? 0,
      hint: "Executed tool calls",
    },
    {
      key: "tokens",
      label: "Tokens",
      value: (metrics?.totalPromptTokens ?? 0) + (metrics?.totalCompletionTokens ?? 0),
      hint: "Prompt + completion",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <ClickableMetricCard key={item.key} item={item} />
      ))}
    </div>
  );
}
