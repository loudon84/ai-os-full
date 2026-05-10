import { describe, expect, it } from "vitest";
import { FinanceToolResultSchema } from "../tool-ui/schemas/finance-tool-result-schema";
import { RiskToolResultSchema } from "../tool-ui/schemas/risk-tool-result-schema";
import { ForecastToolResultSchema } from "../tool-ui/schemas/forecast-tool-result-schema";
import { ToolResultUnionSchema } from "../tool-ui/schemas/tool-result-union-schema";
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

describe("tool ui schemas - finance", () => {
  it("validates finance kpi mock", () => {
    expect(() => FinanceToolResultSchema.parse(createFinanceKpiMock())).not.toThrow();
  });

  it("validates finance receivable aging mock", () => {
    expect(() => FinanceToolResultSchema.parse(createReceivableAgingMock())).not.toThrow();
  });

  it("validates finance cashflow trend mock", () => {
    expect(() => FinanceToolResultSchema.parse(createCashflowTrendMock())).not.toThrow();
  });

  it("validates finance receivable status mock", () => {
    expect(() => FinanceToolResultSchema.parse(createReceivableStatusMock())).not.toThrow();
  });
});

describe("tool ui schemas - risk", () => {
  it("validates risk alert mock", () => {
    expect(() => RiskToolResultSchema.parse(createRiskAlertMock())).not.toThrow();
  });

  it("validates risk exposure mock", () => {
    expect(() => RiskToolResultSchema.parse(createRiskExposureMock())).not.toThrow();
  });

  it("validates risk overdue customer list mock", () => {
    expect(() => RiskToolResultSchema.parse(createOverdueCustomerListMock())).not.toThrow();
  });

  it("validates risk credit limit usage mock", () => {
    expect(() => RiskToolResultSchema.parse(createCreditLimitUsageMock())).not.toThrow();
  });
});

describe("tool ui schemas - forecast", () => {
  it("validates forecast summary mock", () => {
    expect(() => ForecastToolResultSchema.parse(createForecastSummaryMock())).not.toThrow();
  });

  it("validates forecast liquidity warning mock", () => {
    expect(() => ForecastToolResultSchema.parse(createLiquidityWarningMock())).not.toThrow();
  });

  it("validates forecast cashflow trend mock", () => {
    expect(() => ForecastToolResultSchema.parse(createForecastCashflowTrendMock())).not.toThrow();
  });

  it("validates forecast scenario comparison mock", () => {
    expect(() => ForecastToolResultSchema.parse(createScenarioComparisonMock())).not.toThrow();
  });
});

describe("tool ui schemas - edge cases", () => {
  it("rejects malformed payload", () => {
    const result = FinanceToolResultSchema.safeParse({ kind: "finance.kpi.summary", payload: {} });
    expect(result.success).toBe(false);
  });

  it("union schema validates all domain mocks", () => {
    expect(() => ToolResultUnionSchema.parse(createFinanceKpiMock())).not.toThrow();
    expect(() => ToolResultUnionSchema.parse(createRiskAlertMock())).not.toThrow();
    expect(() => ToolResultUnionSchema.parse(createForecastSummaryMock())).not.toThrow();
  });
});
