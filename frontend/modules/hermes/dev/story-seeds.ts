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

/** Storybook / 开发调试用的 Mock 数据集合 */
export const storySeeds = {
  finance: {
    kpi: createFinanceKpiMock(),
    receivableAging: createReceivableAgingMock(),
    cashflowTrend: createCashflowTrendMock(),
    receivableStatus: createReceivableStatusMock(),
  },
  risk: {
    alert: createRiskAlertMock(),
    exposure: createRiskExposureMock(),
    overdueCustomerList: createOverdueCustomerListMock(),
    creditLimitUsage: createCreditLimitUsageMock(),
  },
  forecast: {
    summary: createForecastSummaryMock(),
    liquidityWarning: createLiquidityWarningMock(),
    cashflowTrend: createForecastCashflowTrendMock(),
    scenarioComparison: createScenarioComparisonMock(),
  },
} as const;
