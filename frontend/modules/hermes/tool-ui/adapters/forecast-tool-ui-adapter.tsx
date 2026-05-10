"use client";

import type { ToolUiAdapterProps } from "../types";
import { ForecastSummaryCard } from "@/modules/forecast/components/forecast-summary-card";

export function ForecastToolUiAdapter({
  model,
  onInjectContext,
}: ToolUiAdapterProps) {
  if (model.kind !== "forecast.summary") return null;

  return (
    <ForecastSummaryCard
      item={model.item}
      onClick={() =>
        onInjectContext?.({
          forecastPeriod: model.item.period,
          sourceKind: model.kind,
        })
      }
    />
  );
}
