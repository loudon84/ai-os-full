/**
 * Agent-specific Toolset Configuration
 * Maps each agent to its available toolset tags.
 * Toolsets are display labels + request identifiers — not a permission system.
 */
import type { HermesAgentId } from "./types";

export type HermesToolsetTag =
  | "finance-core"
  | "finance-reporting"
  | "risk-detection"
  | "risk-credit"
  | "forecast-cashflow"
  | "forecast-scenario";

export const AGENT_TOOLSET_MAP: Record<HermesAgentId, HermesToolsetTag[]> = {
  finance: ["finance-core", "finance-reporting"],
  risk: ["risk-detection", "risk-credit"],
  forecast: ["forecast-cashflow", "forecast-scenario"],
};

export function getToolsetsByAgent(agentId: HermesAgentId): HermesToolsetTag[] {
  return AGENT_TOOLSET_MAP[agentId] ?? [];
}
