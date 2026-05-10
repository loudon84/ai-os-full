"use client";

import { useHermesDashboardContextStore } from "../stores/hermes-dashboard-context-store";

export function useDashboardCardInjection() {
  const patchContext = useHermesDashboardContextStore((s) => s.patchContext);

  return {
    injectMetricContext(payload: Record<string, unknown>) {
      patchContext({
        selectedMetricKey: String(payload.selectedMetricKey ?? ""),
        filters: {
          injectedFrom: "dashboard-metric-card",
          ...payload,
        },
      });
    },

    injectChartContext(payload: Record<string, unknown>) {
      patchContext({
        filters: {
          injectedFrom: "dashboard-chart",
          ...payload,
        },
      });
    },

    injectToolCardContext(payload: Record<string, unknown>) {
      patchContext({
        filters: {
          injectedFrom: "tool-ui-card",
          ...payload,
        },
      });
    },
  };
}
