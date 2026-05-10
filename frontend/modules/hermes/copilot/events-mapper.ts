/**
 * Hermes Copilot Events Mapper
 * Maps Hermes Gateway SSE events to AG-UI event format
 * for CopilotKit consumption.
 *
 * Phase 3: Full SSE event lifecycle mapping.
 */
import type { HermesSseEvent, AgUiEvent, HermesCopilotMessage } from "./types";

/**
 * Map a single Hermes Gateway SSE event to the unified HermesSseEvent type.
 * Returns null for unrecognized events.
 */
export function mapHermesGatewayEventToAgUi(
  eventName: string,
  payload: Record<string, unknown>
): HermesSseEvent | null {
  switch (eventName) {
    case "run_started":
      return {
        type: "RUN_STARTED",
        runId: payload.runId as string,
        sessionId: payload.sessionId as string,
        agentId: payload.agentId as string,
      };

    case "message_delta":
      return {
        type: "TEXT_DELTA",
        delta: (payload.delta as string) ?? "",
      };

    case "tool_call_started":
      return {
        type: "TOOL_CALL_STARTED",
        payload: {
          toolName: payload.toolName as string,
          callId: payload.callId as string,
          status: "started",
        },
      };

    case "tool_call_finished":
      return {
        type: "TOOL_CALL_FINISHED",
        payload: {
          toolName: payload.toolName as string,
          callId: payload.callId as string,
          status: "finished",
          result: payload.result,
          latencyMs: payload.latencyMs as number | undefined,
        },
      };

    case "tool_call_error":
      return {
        type: "TOOL_CALL_ERROR",
        payload: {
          toolName: payload.toolName as string,
          callId: payload.callId as string,
          status: "error",
          result: payload.error,
        },
      };

    case "message":
      return {
        type: "MESSAGE",
        role: (payload.role as "assistant" | "tool") ?? "assistant",
        content: (payload.content as string) ?? "",
        toolName: payload.toolName as string | undefined,
        data: payload.data,
      };

    case "usage":
      return {
        type: "USAGE",
        promptTokens: payload.promptTokens as number | undefined,
        completionTokens: payload.completionTokens as number | undefined,
      };

    case "run_finished":
      return {
        type: "RUN_FINISHED",
        sessionId: payload.sessionId as string,
        runId: payload.runId as string,
      };

    case "run_error":
      return {
        type: "RUN_ERROR",
        error: (payload.error as string) ?? "Unknown error",
      };

    default:
      return null;
  }
}

/**
 * Convert Hermes response messages to AG-UI events sequence (legacy blocking mode).
 * Follows the AG-UI lifecycle: RUN_STARTED → messages → RUN_FINISHED
 */
export function mapMessagesToEvents(messages: HermesCopilotMessage[]): AgUiEvent[] {
  const events: AgUiEvent[] = [];

  events.push({ type: "RUN_STARTED" });

  for (const msg of messages) {
    if (msg.role === "assistant") {
      events.push({ type: "TEXT_MESSAGE_START", role: "assistant" });
      events.push({ type: "TEXT_MESSAGE_CONTENT", content: msg.content });
      events.push({ type: "TEXT_MESSAGE_END" });
    } else if (msg.role === "tool") {
      const callId = `tool_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      events.push({
        type: "TOOL_CALL_START",
        toolName: msg.toolName ?? "unknown",
        callId,
      });
      events.push({
        type: "TOOL_CALL_END",
        callId,
        resultPreview: msg.content.slice(0, 200),
      });
    }
  }

  events.push({ type: "RUN_FINISHED" });

  return events;
}

/**
 * Create an error event sequence
 */
export function createErrorEvents(error: string): AgUiEvent[] {
  return [
    { type: "RUN_STARTED" },
    { type: "RUN_ERROR", error },
  ];
}
