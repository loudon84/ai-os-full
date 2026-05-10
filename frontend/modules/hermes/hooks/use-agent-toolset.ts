/**
 * useAgentToolset - Returns the toolset tags for the active agent.
 */
"use client";

import { useMemo } from "react";
import { useActiveHermesAgent } from "./use-active-hermes-agent";
import { getToolsetsByAgent } from "../copilot/agent-toolsets";

export function useAgentToolset() {
  const { activeAgent } = useActiveHermesAgent();

  return useMemo(() => {
    return getToolsetsByAgent(activeAgent);
  }, [activeAgent]);
}
