"use client";

import { useRef, useCallback, useEffect } from "react";
import { useHermesPreviewStore } from "../stores/hermes-preview-store";

export type PerfMetrics = {
  renderDurationMs: number | null;
  reRenderCount: number;
};

/** Collect rendering performance metrics for the preview canvas */
export function usePreviewPerf(): {
  metrics: PerfMetrics;
  onRenderCallback: (
    id: string,
    phase: "mount" | "update" | "nested-update",
    actualDuration: number
  ) => void;
} {
  const scenarioKey = useHermesPreviewStore((s) => s.scenarioKey);

  const metricsRef = useRef<PerfMetrics>({
    renderDurationMs: null,
    reRenderCount: 0,
  });
  const prevScenarioKeyRef = useRef(scenarioKey);

  // Reset metrics when scenario changes
  useEffect(() => {
    if (scenarioKey !== prevScenarioKeyRef.current) {
      metricsRef.current = { renderDurationMs: null, reRenderCount: 0 };
      prevScenarioKeyRef.current = scenarioKey;
    }
  }, [scenarioKey]);

  const onRenderCallback = useCallback(
    (
      _id: string,
      phase: "mount" | "update" | "nested-update",
      actualDuration: number
    ) => {
      if (phase === "mount") {
        metricsRef.current.renderDurationMs = actualDuration;
      }
      if (phase === "update" || phase === "nested-update") {
        metricsRef.current.reRenderCount += 1;
      }
    },
    []
  );

  return {
    metrics: metricsRef.current,
    onRenderCallback,
  };
}
