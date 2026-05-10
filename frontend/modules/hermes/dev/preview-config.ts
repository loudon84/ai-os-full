import type { HermesAgentId } from "../copilot/types";

/** Preview configuration */
export type PreviewConfig = {
  defaultDomain: HermesAgentId;
  defaultMode: "mock" | "fixture" | "live";
  defaultPanels: {
    jsonPanel: boolean;
    contextPanel: boolean;
    schemaPanel: boolean;
    perfPanel: boolean;
  };
  /** JSON panel virtualization threshold (lines) */
  jsonVirtualizeThreshold: number;
};

export const PREVIEW_CONFIG: PreviewConfig = {
  defaultDomain: "finance",
  defaultMode: "mock",
  defaultPanels: { jsonPanel: true, contextPanel: false, schemaPanel: true, perfPanel: false },
  jsonVirtualizeThreshold: 500,
};
