"use client";

import type { FinanceKpiView } from "@/modules/finance/types/finance-view";
import { MetricKpiCard } from "@/modules/finance/components/metric-kpi-card";
import { useDashboardCardInjection } from "../../hooks/use-dashboard-card-injection";

type Props = {
  item: FinanceKpiView;
};

export function ClickableMetricCard({ item }: Props) {
  const { injectMetricContext } = useDashboardCardInjection();

  return (
    <MetricKpiCard
      item={item}
      onClick={() =>
        injectMetricContext({
          selectedMetricKey: item.key,
          metricLabel: item.label,
          metricValue: item.value,
        })
      }
    />
  );
}
