/**
 * Hermes Copilot Types
 * Defines the type contracts for the Hermes Copilot integration layer.
 * Phase 3: SSE streaming, multi-agent routing, tool UI rendering.
 */

// ===== Agent Identity =====

export type HermesAgentId = "finance" | "risk" | "forecast";

// ===== Copilot Request/Response =====

export type HermesCopilotRequest = {
  agentId: HermesAgentId;
  sessionId: string;
  message: string;
  context?: Record<string, unknown>;
};

export type HermesCopilotMessage = {
  role: "assistant" | "tool" | "user";
  content: string;
  toolName?: string;
  data?: unknown;
  latencyMs?: number;
};

export type HermesCopilotResponse = {
  messages: HermesCopilotMessage[];
  sessionId: string;
};

// ===== Tool Payload =====

export type HermesToolPayload = {
  toolName: string;
  callId: string;
  status: "started" | "finished" | "error";
  result?: unknown;
  latencyMs?: number;
};

// ===== SSE Event Types =====

export type HermesSseEvent =
  | { type: "RUN_STARTED"; runId: string; sessionId: string; agentId: string }
  | { type: "TEXT_DELTA"; delta: string }
  | { type: "TOOL_CALL_STARTED"; payload: HermesToolPayload }
  | { type: "TOOL_CALL_FINISHED"; payload: HermesToolPayload }
  | { type: "TOOL_CALL_ERROR"; payload: HermesToolPayload }
  | {
      type: "MESSAGE";
      role: "assistant" | "tool";
      content: string;
      toolName?: string;
      data?: unknown;
    }
  | {
      type: "USAGE";
      promptTokens?: number;
      completionTokens?: number;
    }
  | { type: "RUN_FINISHED"; sessionId: string; runId: string }
  | { type: "RUN_ERROR"; error: string };

// ===== AG-UI Event Types (legacy, kept for backward compat) =====

export type AgUiEventType =
  | "RUN_STARTED"
  | "TEXT_MESSAGE_START"
  | "TEXT_MESSAGE_CONTENT"
  | "TEXT_MESSAGE_END"
  | "TOOL_CALL_START"
  | "TOOL_CALL_END"
  | "RUN_FINISHED"
  | "RUN_ERROR";

export type AgUiEvent =
  | { type: "RUN_STARTED" }
  | { type: "TEXT_MESSAGE_START"; role: string }
  | { type: "TEXT_MESSAGE_CONTENT"; content: string }
  | { type: "TEXT_MESSAGE_END" }
  | { type: "TOOL_CALL_START"; toolName: string; callId: string }
  | { type: "TOOL_CALL_END"; callId: string; resultPreview?: string }
  | { type: "RUN_FINISHED" }
  | { type: "RUN_ERROR"; error: string };

// ===== Frontend Tool Types =====

export type NavigateToolParams = {
  path: string;
};

export type OpenSessionToolParams = {
  sessionId: string;
};

export type RefreshDataToolParams = {
  queryKey?: string[];
};

// ===== Copilot Context =====

export type HermesCopilotContext = {
  activeTab?: string;
  sessionId?: string;
  selectedSkills?: string[];
  dashboardTimeRange?: string;
  agentId?: HermesAgentId;
};
