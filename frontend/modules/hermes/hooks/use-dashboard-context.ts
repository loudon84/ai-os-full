/**
 * useDashboardContext - Hook for building and syncing the dashboard context
 * that gets injected into Hermes via pre_llm_call.
 * Call this in each Hermes page with the appropriate activeTab.
 */
"use client";

import { useHermesDashboardContextStore } from "../stores/hermes-dashboard-context-store";
import { useActiveHermesAgent } from "./use-active-hermes-agent";
import { useAgentToolset } from "./use-agent-toolset";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function useDashboardContext(activeTab: "dashboard" | "sessions" | "skills" | "settings") {
  const pathname = usePathname();
  const { activeAgent, activeSessionId } = useActiveHermesAgent();
  const toolsets = useAgentToolset();
  const context = useHermesDashboardContextStore((s) => s.context);
  const patchContext = useHermesDashboardContextStore((s) => s.patchContext);

  useEffect(() => {
    patchContext({
      activeTab,
      activeAgent,
      activeSessionId,
      pathname,
      toolsets,
    });
  }, [activeTab, activeAgent, activeSessionId, pathname, toolsets, patchContext]);

  return {
    context,
    patchContext,
  };
}
