/**
 * Hermes Agent Store
 * Zustand store for tracking the active agent and session.
 */
import { create } from "zustand";
import type { HermesAgentId } from "../copilot/types";

type HermesAgentState = {
  activeAgent: HermesAgentId;
  activeSessionId: string;
  setActiveAgent: (agent: HermesAgentId) => void;
  setActiveSessionId: (sessionId: string) => void;
};

export const useHermesAgentStore = create<HermesAgentState>((set) => ({
  activeAgent: "finance",
  activeSessionId: "",
  setActiveAgent: (activeAgent) => set({ activeAgent }),
  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),
}));
