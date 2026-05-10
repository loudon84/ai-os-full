"use client";

import { useHermesMetrics } from "../../hooks/useHermesMetrics";
import { HermesMetricCard } from "../shared/HermesMetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Mail, Wrench, Cpu } from "lucide-react";

export function MetricsCards() {
  const { metrics, query } = useHermesMetrics();

  if (query.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const totalTokens = (metrics?.totalPromptTokens ?? 0) + (metrics?.totalCompletionTokens ?? 0);

  const cards = [
    {
      title: "Sessions",
      value: metrics?.sessions ?? 0,
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      title: "Messages",
      value: metrics?.messages ?? 0,
      icon: <Mail className="h-4 w-4" />,
    },
    {
      title: "Tool Calls",
      value: metrics?.toolCalls ?? 0,
      icon: <Wrench className="h-4 w-4" />,
    },
    {
      title: "Total Tokens",
      value: totalTokens,
      icon: <Cpu className="h-4 w-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((item) => (
        <HermesMetricCard
          key={item.title}
          title={item.title}
          value={item.value}
          icon={item.icon}
        />
      ))}
    </div>
  );
}
