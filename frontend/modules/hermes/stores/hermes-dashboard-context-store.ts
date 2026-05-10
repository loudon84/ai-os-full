/**
 * Hermes Dashboard Context Store
 * Zustand store for managing the short-lived dashboard context
 * that gets injected via pre_llm_call.
 */
import { create } from "zustand";
import type { HermesDashboardContext } from "../types/dashboard-context";

type DashboardContextState = {
  context: HermesDashboardContext;
  patchContext: (patch: Partial<HermesDashboardContext>) => void;
  resetContext: () => void;
};

const DEFAULT_CONTEXT: HermesDashboardContext = {
  source: "hermes-dashboard",
  activeTab: "dashboard",
  activeAgent: "finance",
  pathname: "/hermes",
  toolsets: [],
};

export const useHermesDashboardContextStore = create<DashboardContextState>((set) => ({
  context: DEFAULT_CONTEXT,
  patchContext: (patch) =>
    set((state) => ({
      context: {
        ...state.context,
        ...patch,
      },
    })),
  resetContext: () => set({ context: DEFAULT_CONTEXT }),
}));
