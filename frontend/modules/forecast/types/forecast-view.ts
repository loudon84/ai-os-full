export type ForecastSummaryView = {
  period: string;
  cashIn: number;
  cashOut: number;
  endingCash: number;
  confidence?: string;
};

export type ForecastCashflowPointView = {
  period: string;
  cashIn: number;
  cashOut: number;
  endingCash: number;
};

export type ScenarioComparisonRowView = {
  scenario: string;
  revenue?: number;
  endingCash: number;
  riskLabel?: string;
};

export type LiquidityWarningView = {
  level: "low" | "medium" | "high" | "critical";
  message: string;
  suggestedAction?: string;
  threshold?: number;
  actualValue?: number;
};
