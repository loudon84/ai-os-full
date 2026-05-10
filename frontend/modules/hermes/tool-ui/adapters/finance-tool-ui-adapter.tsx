"use client";

import type { ToolUiAdapterProps } from "../types";
import { MetricKpiCard } from "@/modules/finance/components/metric-kpi-card";
import { CashflowTrendChart } from "@/modules/finance/components/cashflow-trend-chart";
import { AgingTable } from "@/modules/finance/components/aging-table";
import { ReceivableStatusCard } from "@/modules/finance/components/receivable-status-card";
import { VarianceWaterfallCard } from "@/modules/finance/components/variance-waterfall-card";
import { RiskExposureSummaryCard } from "@/modules/finance/components/risk-exposure-summary-card";

export function FinanceToolUiAdapter({
  model,
  onInjectContext,
}: ToolUiAdapterProps) {
  if (model.kind === "finance.kpi-list") {
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {model.items.map((item) => (
          <MetricKpiCard
            key={item.key}
            item={item}
            onClick={() =>
              onInjectContext?.({
                selectedMetricKey: item.key,
                metricLabel: item.label,
                sourceKind: model.kind,
              })
            }
          />
        ))}
      </div>
    );
  }

  if (model.kind === "finance.cashflow-trend") {
    return (
      <CashflowTrendChart
        title={model.title}
        data={model.data}
        onPointClick={(point) =>
          onInjectContext?.({
            selectedPeriod: point.period,
            selectedSeries: "cashflow",
            sourceKind: model.kind,
          })
        }
      />
    );
  }

  if (model.kind === "finance.aging-table") {
    return (
      <AgingTable
        rows={model.rows}
        onRowClick={(row) =>
          onInjectContext?.({
            agingBucket: row.bucket,
            sourceKind: model.kind,
          })
        }
      />
    );
  }

  if (model.kind === "finance.receivable-status") {
    return (
      <ReceivableStatusCard
        rows={model.rows}
        onRowClick={(row) =>
          onInjectContext?.({
            orderNo: row.orderNo,
            customerName: row.customerName,
            sourceKind: model.kind,
          })
        }
      />
    );
  }

  if (model.kind === "finance.variance-waterfall") {
    return (
      <VarianceWaterfallCard
        title={model.title}
        items={model.items}
        onBarClick={(item) =>
          onInjectContext?.({
            varianceLabel: item.label,
            sourceKind: model.kind,
          })
        }
      />
    );
  }

  if (model.kind === "finance.risk-exposure") {
    return (
      <RiskExposureSummaryCard
        title={model.title}
        items={model.items}
        onRowClick={(item) =>
          onInjectContext?.({
            riskCategory: item.category,
            riskLevel: item.level,
            sourceKind: model.kind,
          })
        }
      />
    );
  }

  return null;
}
