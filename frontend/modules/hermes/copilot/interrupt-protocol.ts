/**
 * Interrupt Protocol
 * Parses INTERRUPT events from Hermes Gateway into HermesInterruptState.
 */
import type { HermesInterruptState } from "../types/interrupt";

export function parseInterruptFromEvent(event: Record<string, unknown>): HermesInterruptState | null {
  if (event?.type !== "INTERRUPT") return null;

  return {
    status: "interrupted",
    interruptId: event.interruptId as string,
    agentId: event.agentId as "finance" | "risk" | "forecast",
    sessionId: event.sessionId as string,
    title: (event.title as string) ?? "Need more input",
    reason: (event.reason as string) ?? "Missing required input",
    missingFields: (event.missingFields as HermesInterruptState[]) ?? [],
    resumeToken: event.resumeToken as string,
  };
}
