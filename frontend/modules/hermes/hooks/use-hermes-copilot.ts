/**
 * useHermesCopilot - Main hook for Hermes Copilot integration
 * Phase 4: forwarded props (dashboard context + interrupt resume),
 * resumeWithPayload for interrupt-resume flow.
 */
"use client";

import { useCopilotChat } from "@copilotkit/react-core";
import { useHermesFrontendTools } from "../copilot/frontend-tools";
import { useActiveHermesAgent } from "./use-active-hermes-agent";
import { useHermesInterrupt } from "./use-hermes-interrupt";
import { useHermesDashboardContextStore } from "../stores/hermes-dashboard-context-store";

export function useHermesCopilot() {
  // Register frontend tools (navigate, open_session, refresh, filter)
  useHermesFrontendTools();

  const { activeAgent, activeSessionId, setActiveSessionId } = useActiveHermesAgent();
  const dashboardContext = useHermesDashboardContextStore((s) => s.context);
  const { interrupt, clearInterrupt } = useHermesInterrupt();

  const copilot = useCopilotChat({
    agent: activeAgent,
    context: {
      sessionId: activeSessionId,
      source: "hermes-dashboard",
    },
    forwardedProps: {
      dashboardContext,
      interrupt:
        interrupt.status === "interrupted"
          ? {
              resumeToken: interrupt.resumeToken,
            }
          : undefined,
    },
    onEvent: (event: Record<string, unknown>) => {
      // Capture sessionId from RUN_STARTED events
      if (event?.sessionId && !activeSessionId) {
        setActiveSessionId(event.sessionId as string);
      }
    },
  });

  /**
   * Resume an interrupted task with user-provided payload.
   */
  const resumeWithPayload = (resumePayload: Record<string, unknown>) => {
    copilot.append({
      role: "user",
      content: "[Resume previous interrupted task]",
    });
    clearInterrupt();
  };

  return {
    ...copilot,
    activeAgent,
    activeSessionId,
    resumeWithPayload,
  };
}
