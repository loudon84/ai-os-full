import {
  createFinanceKpiMock,
  createReceivableAgingMock,
  createCashflowTrendMock,
  createReceivableStatusMock,
} from "./finance-tool-result-mock";
import {
  createRiskAlertMock,
  createRiskExposureMock,
  createOverdueCustomerListMock,
  createCreditLimitUsageMock,
} from "./risk-tool-result-mock";
import {
  createForecastSummaryMock,
  createLiquidityWarningMock,
  createCashflowTrendMock as createForecastCashflowTrendMock,
  createScenarioComparisonMock,
} from "./forecast-tool-result-mock";

export function createToolMockByName(toolName: string) {
  switch (toolName) {
    case "finance.kpi.summary":
      return createFinanceKpiMock();
    case "finance.receivable.aging":
      return createReceivableAgingMock();
    case "finance.cashflow.trend":
      return createCashflowTrendMock();
    case "finance.receivable.status":
      return createReceivableStatusMock();
    case "risk.alert.summary":
      return createRiskAlertMock();
    case "risk.exposure.table":
      return createRiskExposureMock();
    case "risk.overdue.customer-list":
      return createOverdueCustomerListMock();
    case "risk.credit.limit-usage":
      return createCreditLimitUsageMock();
    case "forecast.summary":
      return createForecastSummaryMock();
    case "forecast.liquidity.warning":
      return createLiquidityWarningMock();
    case "forecast.cashflow.trend":
      return createForecastCashflowTrendMock();
    case "forecast.scenario.comparison":
      return createScenarioComparisonMock();
    default:
      return {
        kind: "unknown.mock",
        payload: {
          toolName,
          note: "No mock configured",
        },
      };
  }
}
