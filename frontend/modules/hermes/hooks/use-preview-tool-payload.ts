"use client";

import { useMemo } from "react";
import { usePreviewScenario } from "./use-preview-scenario";
import { useHermesPreviewStore } from "../stores/hermes-preview-store";

type PreviewPayloadResult = {
  payload: unknown;
  source: "mock" | "fixture" | "live" | "override";
};

/** Returns the resolved tool payload based on current mode */
export function usePreviewToolPayload(): PreviewPayloadResult {
  const scenario = usePreviewScenario();
  const mode = useHermesPreviewStore((s) => s.mode);
  const overriddenPayload = useHermesPreviewStore((s) => s.overriddenPayload);

  return useMemo(() => {
    // Priority: editor override > mode-based payload
    if (overriddenPayload !== null) {
      return { payload: overriddenPayload, source: "override" };
    }

    if (mode === "live") {
      return { payload: null, source: "live" };
    }

    if (mode === "fixture" && scenario.fixtureFile) {
      // Fixture mode: return a marker that the component can use
      // Dynamic import of JSON fixtures is handled at the component level
      // to avoid bundling all fixtures in the client
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fixture = require(`../tool-ui/fixtures/${scenario.fixtureFile}.json`);
        return { payload: fixture, source: "fixture" };
      } catch {
        // Fallback to mock if fixture not found
        return { payload: scenario.getMockPayload(), source: "mock" };
      }
    }

    // Mock mode (default) or fixture fallback
    return { payload: scenario.getMockPayload(), source: "mock" };
  }, [mode, scenario, overriddenPayload]);
}
