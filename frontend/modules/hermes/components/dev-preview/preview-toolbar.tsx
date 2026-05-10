"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useHermesPreviewStore } from "../../stores/hermes-preview-store";
import type { PreviewMode } from "../../stores/hermes-preview-store";
import { usePreviewPanel } from "../../hooks/use-preview-panel";

export function PreviewToolbar() {
  const mode = useHermesPreviewStore((s) => s.mode);
  const setMode = useHermesPreviewStore((s) => s.setMode);
  const reset = useHermesPreviewStore((s) => s.reset);
  const {
    isJsonPanelOpen,
    isContextPanelOpen,
    isSchemaPanelOpen,
    isPerfPanelOpen,
    toggleJsonPanel,
    toggleContextPanel,
    toggleSchemaPanel,
    togglePerfPanel,
  } = usePreviewPanel();

  return (
    <div className="flex items-center justify-between gap-2">
      {/* Mode toggle */}
      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as PreviewMode)}
      >
        <TabsList>
          <TabsTrigger value="mock">Mock</TabsTrigger>
          <TabsTrigger value="fixture">Fixture</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        {/* Panel toggles */}
        <Button
          variant={isJsonPanelOpen ? "soft" : "outline"}
          size="sm"
          onClick={toggleJsonPanel}
        >
          JSON
        </Button>
        <Button
          variant={isContextPanelOpen ? "soft" : "outline"}
          size="sm"
          onClick={toggleContextPanel}
        >
          Context
        </Button>
        <Button
          variant={isSchemaPanelOpen ? "soft" : "outline"}
          size="sm"
          onClick={toggleSchemaPanel}
        >
          Schema
        </Button>
        <Button
          variant={isPerfPanelOpen ? "soft" : "outline"}
          size="sm"
          onClick={togglePerfPanel}
        >
          Perf
        </Button>

        {/* Reset */}
        <Button variant="outline" size="sm" onClick={reset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
