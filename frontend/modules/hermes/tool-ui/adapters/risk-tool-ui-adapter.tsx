"use client";

import type { ToolUiAdapterProps } from "../types";
import { RiskAlertSummaryCard } from "@/modules/risk/components/risk-alert-summary-card";

export function RiskToolUiAdapter({
  model,
  onInjectContext,
}: ToolUiAdapterProps) {
  if (model.kind !== "risk.summary") return null;

  return (
    <RiskAlertSummaryCard
      item={{
        title: model.title,
        level: model.level,
        topic: model.topic,
        impact: model.impact,
        recommendation: model.recommendation,
      }}
      onClick={() =>
        onInjectContext?.({
          riskTopic: model.topic,
          riskLevel: model.level,
          sourceKind: model.kind,
        })
      }
    />
  );
}
