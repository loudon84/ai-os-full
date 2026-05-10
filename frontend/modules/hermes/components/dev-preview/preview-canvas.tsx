"use client";

import React from "react";
import { usePreviewScenario } from "../../hooks/use-preview-scenario";
import { usePreviewToolPayload } from "../../hooks/use-preview-tool-payload";
import { useHermesPreviewStore } from "../../stores/hermes-preview-store";
import { usePreviewPerf } from "../../hooks/use-preview-perf";
import { PreviewRenderShell } from "./preview-render-shell";
import { HermesToolRenderer } from "../copilot/hermes-tool-renderer";

const isDev = process.env.NODE_ENV === "development";

export function PreviewCanvas() {
  const scenario = usePreviewScenario();
  const { payload } = usePreviewToolPayload();
  const injectContext = useHermesPreviewStore((s) => s.injectContext);
  const { onRenderCallback } = usePreviewPerf();

  const content =
    payload != null ? (
      <HermesToolRenderer toolName={scenario.toolName} data={payload} />
    ) : undefined;

  const wrappedContent = isDev ? (
    <React.Profiler id="preview-canvas" onRender={onRenderCallback}>
      {content}
    </React.Profiler>
  ) : (
    content
  );

  return (
    <div className="min-h-[620px] rounded-xl border p-4">
      <PreviewRenderShell title={scenario.title} toolName={scenario.toolName}>
        {wrappedContent}
      </PreviewRenderShell>
    </div>
  );
}
