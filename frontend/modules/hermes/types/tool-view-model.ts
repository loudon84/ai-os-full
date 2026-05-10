import type {
  AgingRowView,
  CashflowPointView,
  FinanceKpiView,
  ReceivableStatusView,
  VarianceItemView,
  RiskExposureItemView,
} from "@/modules/finance/types/finance-view";
import type { ForecastSummaryView } from "@/modules/forecast/types/forecast-view";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type HermesToolViewModel =
  | { kind: "finance.kpi-list"; title?: string; items: FinanceKpiView[] }
  | { kind: "finance.cashflow-trend"; title?: string; data: CashflowPointView[] }
  | { kind: "finance.aging-table"; rows: AgingRowView[] }
  | { kind: "finance.receivable-status"; rows: ReceivableStatusView[] }
  | { kind: "finance.variance-waterfall"; title?: string; items: VarianceItemView[] }
  | { kind: "finance.risk-exposure"; title?: string; items: RiskExposureItemView[] }
  | { kind: "forecast.summary"; item: ForecastSummaryView }
  | {
      kind: "risk.summary";
      title?: string;
      level?: RiskLevel;
      topic?: string;
      impact?: string;
      recommendation?: string;
    }
  | { kind: "generic.json"; title?: string; data: unknown }
  | { kind: "generic.error"; title?: string; message: string };
