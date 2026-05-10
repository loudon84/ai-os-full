/**
 * Hermes Interrupt State Type
 * Supports "need user input / confirm / continue" interrupt-resume flow.
 */
import type { HermesAgentId } from "../copilot/types";

export type HermesInterruptState =
  | {
      status: "idle";
    }
  | {
      status: "interrupted";
      interruptId: string;
      agentId: HermesAgentId;
      sessionId: string;
      title: string;
      reason: string;
      missingFields?: Array<{
        key: string;
        label: string;
        type: "text" | "number" | "select";
        options?: string[];
        required?: boolean;
      }>;
      resumeToken: string;
    };
