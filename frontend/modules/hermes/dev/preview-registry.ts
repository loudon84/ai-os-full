import type { HermesAgentId } from "../copilot/types";
import { createToolMockByName } from "../tool-ui/mocks/mock-factory";

/** Scenario registry entry */
export type PreviewScenarioEntry = {
  /** Unique key, matches toolName */
  key: string;
  /** Display title */
  title: string;
  /** Business domain */
  domain: HermesAgentId;
  /** Corresponding toolName for HermesToolRenderer */
  toolName: string;
  /** Lazy mock payload getter (avoids execution at module init) */
  getMockPayload: () => unknown;
  /** Fixture file name (optional, for fixture mode) */
  fixtureFile?: string;
};

/** Full scenario registry (12 entries) */
export const PREVIEW_REGISTRY: PreviewScenarioEntry[] = [
  // Finance
  {
    key: "finance.kpi.summary",
    title: "Finance KPI Summary",
    domain: "finance",
    toolName: "finance.kpi.summary",
    getMockPayload: () => createToolMockByName("finance.kpi.summary"),
    fixtureFile: "finance-kpi",
  },
  {
    key: "finance.receivable.aging",
    title: "Receivable Aging",
    domain: "finance",
    toolName: "finance.receivable.aging",
    getMockPayload: () => createToolMockByName("finance.receivable.aging"),
    fixtureFile: "receivable-aging",
  },
  {
    key: "finance.cashflow.trend",
    title: "Cashflow Trend",
    domain: "finance",
    toolName: "finance.cashflow.trend",
    getMockPayload: () => createToolMockByName("finance.cashflow.trend"),
    fixtureFile: "finance-cashflow-trend",
  },
  {
    key: "finance.receivable.status",
    title: "Receivable Status",
    domain: "finance",
    toolName: "finance.receivable.status",
    getMockPayload: () => createToolMockByName("finance.receivable.status"),
    fixtureFile: "finance-receivable-status",
  },
  // Risk
  {
    key: "risk.alert.summary",
    title: "Risk Alert Summary",
    domain: "risk",
    toolName: "risk.alert.summary",
    getMockPayload: () => createToolMockByName("risk.alert.summary"),
    fixtureFile: "risk-alert",
  },
  {
    key: "risk.exposure.table",
    title: "Risk Exposure Table",
    domain: "risk",
    toolName: "risk.exposure.table",
    getMockPayload: () => createToolMockByName("risk.exposure.table"),
    fixtureFile: "risk-exposure",
  },
  {
    key: "risk.overdue.customer-list",
    title: "Overdue Customer List",
    domain: "risk",
    toolName: "risk.overdue.customer-list",
    getMockPayload: () => createToolMockByName("risk.overdue.customer-list"),
    fixtureFile: "risk-overdue-customer-list",
  },
  {
    key: "risk.credit.limit-usage",
    title: "Credit Limit Usage",
    domain: "risk",
    toolName: "risk.credit.limit-usage",
    getMockPayload: () => createToolMockByName("risk.credit.limit-usage"),
    fixtureFile: "risk-credit-limit-usage",
  },
  // Forecast
  {
    key: "forecast.summary",
    title: "Forecast Summary",
    domain: "forecast",
    toolName: "forecast.summary",
    getMockPayload: () => createToolMockByName("forecast.summary"),
    fixtureFile: "forecast-summary",
  },
  {
    key: "forecast.liquidity.warning",
    title: "Liquidity Warning",
    domain: "forecast",
    toolName: "forecast.liquidity.warning",
    getMockPayload: () => createToolMockByName("forecast.liquidity.warning"),
    fixtureFile: "forecast-liquidity-warning",
  },
  {
    key: "forecast.cashflow.trend",
    title: "Forecast Cashflow Trend",
    domain: "forecast",
    toolName: "forecast.cashflow.trend",
    getMockPayload: () => createToolMockByName("forecast.cashflow.trend"),
    fixtureFile: "forecast-cashflow-trend",
  },
  {
    key: "forecast.scenario.comparison",
    title: "Scenario Comparison",
    domain: "forecast",
    toolName: "forecast.scenario.comparison",
    getMockPayload: () => createToolMockByName("forecast.scenario.comparison"),
    fixtureFile: "forecast-scenario-comparison",
  },
];

/** Filter scenarios by domain */
export function getScenariosByDomain(domain: HermesAgentId): PreviewScenarioEntry[] {
  return PREVIEW_REGISTRY.filter((s) => s.domain === domain);
}

/** Get a single scenario by key */
export function getScenarioByKey(key: string): PreviewScenarioEntry | undefined {
  return PREVIEW_REGISTRY.find((s) => s.key === key);
}

/** Get the first scenario key for a domain */
export function getFirstScenarioKey(domain: HermesAgentId): string {
  const first = PREVIEW_REGISTRY.find((s) => s.domain === domain);
  return first?.key ?? PREVIEW_REGISTRY[0].key;
}
