/**
 * Hermes Forwarded Props
 * The payload sent from frontend to /ai/copilot via CopilotKit's
 * forwardedProps channel. Carries dashboard context and interrupt resume data.
 */
import type { HermesDashboardContext } from "../types/dashboard-context";

export type HermesForwardedProps = {
  dashboardContext: HermesDashboardContext;
  interrupt?: {
    resumeToken?: string;
    resumePayload?: Record<string, unknown>;
  };
};
