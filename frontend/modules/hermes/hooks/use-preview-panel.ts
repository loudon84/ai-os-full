"use client";

import { useHermesPreviewStore } from "../stores/hermes-preview-store";

/** Returns panel visibility state and toggle functions */
export function usePreviewPanel() {
  const isJsonPanelOpen = useHermesPreviewStore((s) => s.panels.jsonPanel);
  const isContextPanelOpen = useHermesPreviewStore((s) => s.panels.contextPanel);
  const isSchemaPanelOpen = useHermesPreviewStore((s) => s.panels.schemaPanel);
  const isPerfPanelOpen = useHermesPreviewStore((s) => s.panels.perfPanel);
  const togglePanel = useHermesPreviewStore((s) => s.togglePanel);

  return {
    isJsonPanelOpen,
    isContextPanelOpen,
    isSchemaPanelOpen,
    isPerfPanelOpen,
    toggleJsonPanel: () => togglePanel("jsonPanel"),
    toggleContextPanel: () => togglePanel("contextPanel"),
    toggleSchemaPanel: () => togglePanel("schemaPanel"),
    togglePerfPanel: () => togglePanel("perfPanel"),
  };
}
