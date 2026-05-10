/**
 * useActiveHermesAgent - Hook for accessing and controlling
 * the active Hermes agent and session from the Zustand store.
 */
"use client";

import { useHermesAgentStore } from "../stores/hermes-agent-store";

export function useActiveHermesAgent() {
  const activeAgent = useHermesAgentStore((s) => s.activeAgent);
  const activeSessionId = useHermesAgentStore((s) => s.activeSessionId);
  const setActiveAgent = useHermesAgentStore((s) => s.setActiveAgent);
  const setActiveSessionId = useHermesAgentStore((s) => s.setActiveSessionId);

  return {
    activeAgent,
    activeSessionId,
    setActiveAgent,
    setActiveSessionId,
  };
}
