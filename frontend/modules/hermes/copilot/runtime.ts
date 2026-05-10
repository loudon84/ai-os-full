/**
 * Hermes Copilot Runtime Configuration
 * Phase 3: Multi-agent runtime with SSE streaming.
 *
 * Creates a CopilotRuntime with finance/risk/forecast agents,
 * each backed by a HermesStreamingAgent that connects to
 * /ai/copilot SSE endpoint.
 */
import { CopilotRuntime } from "@copilotkit/runtime";
import { HermesStreamingAgent } from "./streaming-agent";

/**
 * Create a Hermes CopilotRuntime with all three agents registered.
 */
export function createHermesRuntime() {
  return new CopilotRuntime({
    agents: {
      finance: new HermesStreamingAgent("finance"),
      risk: new HermesStreamingAgent("risk"),
      forecast: new HermesStreamingAgent("forecast"),
    },
  });
}

/**
 * Runtime configuration constants
 */
export const HERMES_COPILOT_RUNTIME_CONFIG = {
  /** Default agent ID */
  defaultAgentId: "finance" as const,
  /** Default session context for Hermes conversations */
  defaultContext: {
    source: "hermes-dashboard",
    activeTab: "dashboard",
  },
  /** Max retries for agent calls */
  maxRetries: 1,
  /** Timeout for agent calls in ms */
  timeoutMs: 30_000,
} as const;
