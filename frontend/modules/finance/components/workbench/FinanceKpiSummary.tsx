"use client";

import { FinanceMetricCard } from "../shared/FinanceMetricCard";
import type { WorkbenchKpi } from "../../types/finance.types";

type FinanceKpiSummaryProps = {
  kpi: WorkbenchKpi;
};

export function FinanceKpiSummary({ kpi }: FinanceKpiSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      <FinanceMetricCard title="应收总额" value={kpi.totalReceivables} />
      <FinanceMetricCard title="应付总额" value={kpi.totalPayables} />
      <FinanceMetricCard title="逾期金额" value={kpi.overdueAmount} />
      <FinanceMetricCard title="30日现金流预测" value={kpi.cashflowForecast30d} />
      <FinanceMetricCard
        title="高风险客户数"
        value={{ amount: kpi.highRiskClientCount * 100, currency: "CNY" }}
      />
    </div>
  );
}
