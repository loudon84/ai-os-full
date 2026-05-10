"use client";

import { useEffect, Suspense } from "react";
import type { HermesAgentId } from "../../copilot/types";
import { useHermesPreviewStore } from "../../stores/hermes-preview-store";
import { usePreviewPanel } from "../../hooks/use-preview-panel";
import { usePreviewShortcuts } from "../../hooks/use-preview-shortcuts";
import { usePreviewUrlSync } from "../../hooks/use-preview-url-sync";
import { PreviewSidebar } from "./preview-sidebar";
import { PreviewToolbar } from "./preview-toolbar";
import { PreviewCanvas } from "./preview-canvas";
import { PreviewJsonPanel } from "./preview-json-panel";
import { PreviewContextPanel } from "./preview-context-panel";
import { PreviewSchemaPanel } from "./preview-schema-panel";
import { PreviewPerfPanel } from "./preview-perf-panel";
import { PreviewShortcutCheatsheet } from "./preview-shortcut-cheatsheet";

/** Inner component that uses useSearchParams (requires Suspense) */
function PreviewPageInner() {
  usePreviewUrlSync();
  return null;
}

type HermesToolUiPreviewPageProps = {
  initialDomain?: HermesAgentId;
};

export function HermesToolUiPreviewPage({
  initialDomain,
}: HermesToolUiPreviewPageProps) {
  const setDomain = useHermesPreviewStore((s) => s.setDomain);
  const {
    isJsonPanelOpen,
    isContextPanelOpen,
    isSchemaPanelOpen,
    isPerfPanelOpen,
  } = usePreviewPanel();
  const { cheatsheetOpen, setCheatsheetOpen } = usePreviewShortcuts();

  useEffect(() => {
    if (initialDomain) {
      setDomain(initialDomain);
    }
  }, [initialDomain, setDomain]);

  const showRightPanel =
    isJsonPanelOpen || isContextPanelOpen || isSchemaPanelOpen || isPerfPanelOpen;

  return (
    <div className="flex h-full gap-0 overflow-hidden rounded-xl border">
      {/* URL sync (wrapped in Suspense for useSearchParams) */}
      <Suspense fallback={null}>
        <PreviewPageInner />
      </Suspense>

      {/* Left sidebar */}
      <div className="w-64 shrink-0 border-r">
        <PreviewSidebar />
      </div>

      {/* Center: toolbar + canvas */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b px-4 py-2">
          <PreviewToolbar />
        </div>
        <div className="flex-1 overflow-auto p-4">
          <PreviewCanvas />
        </div>
      </div>

      {/* Right panel (conditional) */}
      {showRightPanel && (
        <div className="w-80 shrink-0 space-y-3 overflow-auto border-l p-3">
          {isJsonPanelOpen && <PreviewJsonPanel />}
          {isContextPanelOpen && <PreviewContextPanel />}
          {isSchemaPanelOpen && <PreviewSchemaPanel />}
          {isPerfPanelOpen && <PreviewPerfPanel />}
        </div>
      )}

      {/* Keyboard shortcut cheatsheet */}
      <PreviewShortcutCheatsheet
        open={cheatsheetOpen}
        onClose={() => setCheatsheetOpen(false)}
      />
    </div>
  );
}
