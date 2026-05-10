"use client";

import { useMemo } from "react";
import { PREVIEW_REGISTRY } from "../dev/preview-registry";
import type { PreviewScenarioEntry } from "../dev/preview-registry";
import { useHermesPreviewStore } from "../stores/hermes-preview-store";

/** Returns the current scenario entry derived from store state and registry */
export function usePreviewScenario(): PreviewScenarioEntry {
  const scenarioKey = useHermesPreviewStore((s) => s.scenarioKey);

  return useMemo(() => {
    const found = PREVIEW_REGISTRY.find((s) => s.key === scenarioKey);
    return found ?? PREVIEW_REGISTRY[0];
  }, [scenarioKey]);
}
