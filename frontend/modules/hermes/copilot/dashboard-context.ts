/**
 * Dashboard Context Builder
 * Assembles the dashboard context for injection into Hermes via pre_llm_call.
 * Only includes allowed short-lived context fields.
 */
import type { HermesDashboardContext } from "../types/dashboard-context";

export function buildDashboardContextForAgent(
  context: HermesDashboardContext
): Record<string, unknown> {
  return {
    source: context.source,
    activeTab: context.activeTab,
    activeAgent: context.activeAgent,
    activeSessionId: context.activeSessionId,
    pathname: context.pathname,
    selectedMetricKey: context.selectedMetricKey,
    selectedTimeRange: context.selectedTimeRange,
    selectedSessionIds: context.selectedSessionIds ?? [],
    selectedSkillNames: context.selectedSkillNames ?? [],
    toolsets: context.toolsets,
    filters: context.filters ?? {},
  };
}
