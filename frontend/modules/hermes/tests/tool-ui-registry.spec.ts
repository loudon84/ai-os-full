import { describe, expect, it } from "vitest";
import { mapToolResultToViewModel } from "../tool-ui/registry";
import {
  createFinanceKpiMock,
  createReceivableAgingMock,
  createCashflowTrendMock,
  createReceivableStatusMock,
} from "../tool-ui/mocks/finance-tool-result-mock";
import {
  createRiskAlertMock,
  createRiskExposureMock,
  createOverdueCustomerListMock,
  createCreditLimitUsageMock,
} from "../tool-ui/mocks/risk-tool-result-mock";
import {
  createForecastSummaryMock,
  createLiquidityWarningMock,
  createCashflowTrendMock as createForecastCashflowTrendMock,
  createScenarioComparisonMock,
} from "../tool-ui/mocks/forecast-tool-result-mock";

describe("tool ui registry - finance", () => {
  it("maps finance kpi to finance.kpi-list", () => {
    const model = mapToolResultToViewModel("finance.kpi.summary", createFinanceKpiMock());
    expect(model.kind).toBe("finance.kpi-list");
  });

  it("maps finance receivable aging to finance.aging-table", () => {
    const model = mapToolResultToViewModel("finance.receivable.aging", createReceivableAgingMock());
    expect(model.kind).toBe("finance.aging-table");
  });

  it("maps finance cashflow trend to finance.cashflow-trend", () => {
    const model = mapToolResultToViewModel("finance.cashflow.trend", createCashflowTrendMock());
    expect(model.kind).toBe("finance.cashflow-trend");
  });

  it("maps finance receivable status to finance.receivable-status", () => {
    const model = mapToolResultToViewModel("finance.receivable.status", createReceivableStatusMock());
    expect(model.kind).toBe("finance.receivable-status");
  });
});

describe("tool ui registry - risk", () => {
  it("maps risk alert to risk.summary", () => {
    const model = mapToolResultToViewModel("risk.alert.summary", createRiskAlertMock());
    expect(model.kind).toBe("risk.summary");
  });

  it("maps risk exposure to generic.json (conservative)", () => {
    const model = mapToolResultToViewModel("risk.exposure.table", createRiskExposureMock());
    expect(model.kind).toBe("generic.json");
  });

  it("maps risk overdue customer list to generic.json (conservative)", () => {
    const model = mapToolResultToViewModel("risk.overdue.customer-list", createOverdueCustomerListMock());
    expect(model.kind).toBe("generic.json");
  });

  it("maps risk credit limit usage to generic.json (conservative)", () => {
    const model = mapToolResultToViewModel("risk.credit.limit-usage", createCreditLimitUsageMock());
    expect(model.kind).toBe("generic.json");
  });
});

describe("tool ui registry - forecast", () => {
  it("maps forecast summary to forecast.summary", () => {
    const model = mapToolResultToViewModel("forecast.summary", createForecastSummaryMock());
    expect(model.kind).toBe("forecast.summary");
  });

  it("maps forecast liquidity warning to generic.json (conservative)", () => {
    const model = mapToolResultToViewModel("forecast.liquidity.warning", createLiquidityWarningMock());
    expect(model.kind).toBe("generic.json");
  });

  it("maps forecast cashflow trend to generic.json (conservative)", () => {
    const model = mapToolResultToViewModel("forecast.cashflow.trend", createForecastCashflowTrendMock());
    expect(model.kind).toBe("generic.json");
  });

  it("maps forecast scenario comparison to generic.json (conservative)", () => {
    const model = mapToolResultToViewModel("forecast.scenario.comparison", createScenarioComparisonMock());
    expect(model.kind).toBe("generic.json");
  });
});

describe("tool ui registry - edge cases", () => {
  it("maps unknown tool to generic.json", () => {
    const model = mapToolResultToViewModel("unknown.tool", { foo: "bar" });
    expect(model.kind).toBe("generic.json");
  });

  it("maps malformed data to generic.error", () => {
    const model = mapToolResultToViewModel("risk.alert.summary", "not-an-object");
    expect(model.kind).toBe("generic.error");
  });
});
