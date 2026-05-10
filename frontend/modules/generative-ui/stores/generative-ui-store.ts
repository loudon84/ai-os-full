import { create } from "zustand";
import type { AGUIEvent, SandboxRuntimeState } from "../types";
import type { RegistryEntry } from "../services/registry";
import * as registryService from "../services/registry";
import { createEvent } from "../services/event-protocol";

function snapshotComponents(): Map<string, RegistryEntry> {
  const m = new Map<string, RegistryEntry>();
  for (const { name, entry } of registryService.listComponents()) {
    m.set(name, entry);
  }
  return m;
}

type GenerativeUiStore = {
  sandboxState: SandboxRuntimeState;
  components: Map<string, RegistryEntry>;
  eventLog: AGUIEvent[];
  selectedComponent: string | null;
  registryRevision: number;
  register: (
    name: string,
    schema: import("zod").ZodTypeAny,
    component: import("react").ComponentType<any>,
    sandboxSource?: string,
  ) => void;
  renderSandbox: (state: SandboxRuntimeState) => void;
  clearLog: () => void;
  setSelectedComponent: (name: string | null) => void;
  appendEvent: (event: AGUIEvent) => void;
  refreshFromRegistry: () => void;
};

export const useGenerativeUiStore = create<GenerativeUiStore>((set, get) => ({
  sandboxState: "idle",
  components: snapshotComponents(),
  eventLog: [],
  selectedComponent: null,
  registryRevision: 0,

  register: (name, schema, component, sandboxSource) => {
    registryService.registerComponent(name, schema, component, sandboxSource);
    const evt = createEvent(
      "registry.register",
      { name, hasSandboxSource: Boolean(sandboxSource) },
      {},
    );
    set({
      components: snapshotComponents(),
      registryRevision: get().registryRevision + 1,
      eventLog: [...get().eventLog, evt],
    });
  },

  renderSandbox: (sandboxState) => set({ sandboxState }),

  clearLog: () => set({ eventLog: [] }),

  setSelectedComponent: (selectedComponent) => set({ selectedComponent }),

  appendEvent: (event) =>
    set((s) => ({
      eventLog: [...s.eventLog, event],
    })),

  refreshFromRegistry: () =>
    set({
      components: snapshotComponents(),
      registryRevision: get().registryRevision + 1,
    }),
}));
