import { create } from "zustand";
import type { RuntimeApproval, RuntimeClarify } from "../types";

type RuntimeApprovalState = {
  approval: RuntimeApproval | null;
  approvalSessionId: string | null;
  clarify: RuntimeClarify | null;
  clarifySessionId: string | null;

  showApproval: (approval: RuntimeApproval, sessionId: string) => void;
  hideApproval: () => void;
  showClarify: (clarify: RuntimeClarify, sessionId: string) => void;
  hideClarify: () => void;
};

export const useRuntimeApprovalStore = create<RuntimeApprovalState>((set) => ({
  approval: null,
  approvalSessionId: null,
  clarify: null,
  clarifySessionId: null,

  showApproval: (approval, sessionId) =>
    set({ approval, approvalSessionId: sessionId }),
  hideApproval: () => set({ approval: null, approvalSessionId: null }),

  showClarify: (clarify, sessionId) =>
    set({ clarify, clarifySessionId: sessionId }),
  hideClarify: () => set({ clarify: null, clarifySessionId: null }),
}));

