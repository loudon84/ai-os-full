/**
 * Hermes Dashboard Context Type
 * Defines the short-lived context injected via pre_llm_call.
 * Only allowed fields are included — no system prompts, no history mutation,
 * no sensitive config.
 */
import type { HermesAgentId } from "../copilot/types";

export type HermesDashboardContext = {
  source: "hermes-dashboard";
  activeTab: "dashboard" | "sessions" | "skills" | "settings";
  activeAgent: HermesAgentId;
  activeSessionId?: string;
  pathname: string;
  selectedMetricKey?: string;
  selectedTimeRange?: "7d" | "14d" | "30d" | "custom";
  selectedSessionIds?: string[];
  selectedSkillNames?: string[];
  toolsets: string[];
  filters?: Record<string, unknown>;
};
