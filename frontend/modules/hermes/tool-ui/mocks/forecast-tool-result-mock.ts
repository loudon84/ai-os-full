export function createForecastSummaryMock() {
  return {
    kind: "forecast.summary" as const,
    payload: {
      period: "2026-W18",
      cashIn: 680000,
      cashOut: 530000,
      endingCash: 710000,
      confidence: "0.81",
    },
  };
}

export function createLiquidityWarningMock() {
  return {
    kind: "forecast.liquidity.warning" as const,
    payload: {
      level: "medium" as const,
      message: "Projected ending cash may fall below weekly operating threshold in 2 weeks",
      suggestedAction: "Accelerate receivable collection and delay non-essential purchase orders",
      threshold: 300000,
      actualValue: 260000,
    },
  };
}

export function createCashflowTrendMock() {
  return {
    kind: "forecast.cashflow.trend" as const,
    payload: {
      title: "Forecast Cashflow Trend",
      points: [
        { period: "2026-W18", cashIn: 680000, cashOut: 530000, endingCash: 710000 },
        { period: "2026-W19", cashIn: 720000, cashOut: 550000, endingCash: 880000 },
        { period: "2026-W20", cashIn: 650000, cashOut: 580000, endingCash: 950000 },
      ],
    },
  };
}

export function createScenarioComparisonMock() {
  return {
    kind: "forecast.scenario.comparison" as const,
    payload: {
      title: "Scenario Comparison",
      rows: [
        { scenario: "Base", revenue: 2800000, endingCash: 950000, riskLabel: "low" },
        { scenario: "Optimistic", revenue: 3200000, endingCash: 1200000, riskLabel: "low" },
        { scenario: "Pessimistic", revenue: 2200000, endingCash: 400000, riskLabel: "high" },
      ],
    },
  };
}
