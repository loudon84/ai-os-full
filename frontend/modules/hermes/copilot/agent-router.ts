/**
 * Hermes Agent Router
 * Multi-agent routing configuration for finance / risk / forecast agents.
 * All agent routing logic lives here — the frontend never decides
 * which Gateway path to call; it only selects an agentId.
 */
import type { HermesAgentId } from "./types";

export type HermesAgentRouteConfig = {
  agentId: HermesAgentId;
  gatewayPath: string;
  defaultSessionPrefix: string;
  systemContextTag: string;
};

export const HERMES_AGENT_ROUTES: Record<HermesAgentId, HermesAgentRouteConfig> = {
  finance: {
    agentId: "finance",
    gatewayPath: "/agents/finance",
    defaultSessionPrefix: "finance",
    systemContextTag: "finance-dashboard",
  },
  risk: {
    agentId: "risk",
    gatewayPath: "/agents/risk",
    defaultSessionPrefix: "risk",
    systemContextTag: "risk-dashboard",
  },
  forecast: {
    agentId: "forecast",
    gatewayPath: "/agents/forecast",
    defaultSessionPrefix: "forecast",
    systemContextTag: "forecast-dashboard",
  },
};

/**
 * Resolve an agent ID to its route configuration.
 * Defaults to "finance" if no match.
 */
export function resolveHermesAgent(agentId?: string): HermesAgentRouteConfig {
  if (agentId === "risk") return HERMES_AGENT_ROUTES.risk;
  if (agentId === "forecast") return HERMES_AGENT_ROUTES.forecast;
  return HERMES_AGENT_ROUTES.finance;
}

/**
 * All available agent IDs for UI rendering
 */
export const HERMES_AGENT_LIST: Array<{ id: HermesAgentId; label: string; description: string }> = [
  { id: "finance", label: "Finance", description: "财务概览、经营分析、指标解读" },
  { id: "risk", label: "Risk", description: "风险识别、异常解释、预警" },
  { id: "forecast", label: "Forecast", description: "预测、趋势推演、预算测算" },
];
