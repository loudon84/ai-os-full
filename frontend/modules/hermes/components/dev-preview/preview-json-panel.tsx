"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePreviewToolPayload } from "../../hooks/use-preview-tool-payload";
import { usePreviewScenario } from "../../hooks/use-preview-scenario";
import { useHermesPreviewStore } from "../../stores/hermes-preview-store";

const JsonView = dynamic(() => import("react-json-view-lite").then((m) => m.JsonView), {
  ssr: false,
  loading: () => <div className="p-2 text-xs text-muted-foreground">Loading JSON viewer...</div>,
});

type EditorMode = "view" | "edit";

export function PreviewJsonPanel() {
  const scenario = usePreviewScenario();
  const { payload, source } = usePreviewToolPayload();
  const setOverriddenPayload = useHermesPreviewStore((s) => s.setOverriddenPayload);
  const clearOverriddenPayload = useHermesPreviewStore((s) => s.clearOverriddenPayload);

  const [editorMode, setEditorMode] = useState<EditorMode>("view");
  const [editorContent, setEditorContent] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleEdit = useCallback(() => {
    const content = payload != null ? JSON.stringify(payload, null, 2) : "{}";
    setEditorContent(content);
    setParseError(null);
    setEditorMode("edit");
  }, [payload]);

  const handleApply = useCallback(() => {
    try {
      const parsed = JSON.parse(editorContent);
      setOverriddenPayload(parsed);
      setParseError(null);
    } catch (e) {
      setParseError((e as Error).message);
    }
  }, [editorContent, setOverriddenPayload]);

  const handleReset = useCallback(() => {
    const original = scenario.getMockPayload();
    setEditorContent(JSON.stringify(original, null, 2));
    clearOverriddenPayload();
    setParseError(null);
  }, [scenario, clearOverriddenPayload]);

  const handleView = useCallback(() => {
    setEditorMode("view");
    setParseError(null);
  }, []);

  const handleSaveFixture = useCallback(async () => {
    if (payload == null) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/hermes/dev/fixture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolName: scenario.toolName, payload }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus(`Saved: ${data.filePath}`);
      } else {
        setSaveStatus(`Error: ${data.error}`);
      }
    } catch (e) {
      setSaveStatus(`Error: ${(e as Error).message}`);
    }
    setTimeout(() => setSaveStatus(null), 3000);
  }, [payload, scenario.toolName]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">JSON Payload</span>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-xs">
            {source}
          </Badge>
          {editorMode === "view" && (
            <Button variant="ghost" size="xs" onClick={handleEdit}>
              Edit
            </Button>
          )}
          {editorMode === "edit" && (
            <>
              <Button variant="ghost" size="xs" onClick={handleView}>
                View
              </Button>
              <Button variant="ghost" size="xs" onClick={handleApply}>
                Apply
              </Button>
              <Button variant="ghost" size="xs" onClick={handleReset}>
                Reset
              </Button>
            </>
          )}
          {isDev && editorMode === "view" && (
            <Button variant="ghost" size="xs" onClick={handleSaveFixture}>
              Save Fixture
            </Button>
          )}
        </div>
      </div>

      {editorMode === "view" ? (
        <ScrollArea className="h-[300px] p-3">
          {payload != null ? (
            <JsonView data={payload} />
          ) : (
            <div className="text-sm text-muted-foreground">
              No data (live mode)
            </div>
          )}
        </ScrollArea>
      ) : (
        <div className="p-3">
          <textarea
            className="w-full h-[280px] resize-none rounded-md border bg-background p-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            spellCheck={false}
          />
          {parseError && (
            <div className="mt-1 rounded-md bg-red-50 px-2 py-1 text-xs text-red-600 dark:bg-red-950">
              JSON parse error: {parseError}
            </div>
          )}
        </div>
      )}

      {saveStatus && (
        <div className="border-t px-3 py-1.5 text-xs text-muted-foreground">
          {saveStatus}
        </div>
      )}
    </div>
  );
}
