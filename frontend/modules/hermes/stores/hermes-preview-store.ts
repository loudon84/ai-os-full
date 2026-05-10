import { create } from "zustand";
import type { HermesAgentId } from "../copilot/types";
import { PREVIEW_CONFIG } from "../dev/preview-config";
import { getFirstScenarioKey } from "../dev/preview-registry";

/** Preview data mode */
export type PreviewMode = "mock" | "fixture" | "live";

/** Panel visibility */
export type PanelVisibility = {
  jsonPanel: boolean;
  contextPanel: boolean;
  schemaPanel: boolean;
  perfPanel: boolean;
};

type HermesPreviewState = {
  domain: HermesAgentId;
  scenarioKey: string;
  mode: PreviewMode;
  injectedContext: Record<string, unknown>;
  panels: PanelVisibility;
  overriddenPayload: unknown | null;
};

type HermesPreviewActions = {
  setDomain: (domain: HermesAgentId) => void;
  setScenarioKey: (key: string) => void;
  setMode: (mode: PreviewMode) => void;
  injectContext: (ctx: Record<string, unknown>) => void;
  togglePanel: (panel: keyof PanelVisibility) => void;
  setOverriddenPayload: (payload: unknown | null) => void;
  clearOverriddenPayload: () => void;
  reset: () => void;
};

type HermesPreviewStore = HermesPreviewState & HermesPreviewActions;

const INITIAL_STATE: HermesPreviewState = {
  domain: PREVIEW_CONFIG.defaultDomain,
  scenarioKey: getFirstScenarioKey(PREVIEW_CONFIG.defaultDomain),
  mode: PREVIEW_CONFIG.defaultMode,
  injectedContext: {},
  panels: { ...PREVIEW_CONFIG.defaultPanels },
  overriddenPayload: null,
};

export const useHermesPreviewStore = create<HermesPreviewStore>((set) => ({
  ...INITIAL_STATE,

  setDomain: (domain) =>
    set({
      domain,
      scenarioKey: getFirstScenarioKey(domain),
      injectedContext: {},
      overriddenPayload: null,
    }),

  setScenarioKey: (scenarioKey) =>
    set({
      scenarioKey,
      injectedContext: {},
      overriddenPayload: null,
    }),

  setMode: (mode) => set({ mode }),

  injectContext: (ctx) =>
    set((state) => ({
      injectedContext: { ...state.injectedContext, ...ctx },
    })),

  togglePanel: (panel) =>
    set((state) => ({
      panels: { ...state.panels, [panel]: !state.panels[panel] },
    })),

  setOverriddenPayload: (overriddenPayload) => set({ overriddenPayload }),

  clearOverriddenPayload: () => set({ overriddenPayload: null }),

  reset: () => set(INITIAL_STATE),
}));
