"use client";

import dynamic from "next/dynamic";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHermesPreviewStore } from "../../stores/hermes-preview-store";

const JsonView = dynamic(() => import("react-json-view-lite").then((m) => m.JsonView), {
  ssr: false,
  loading: () => <div className="p-2 text-xs text-muted-foreground">Loading JSON viewer...</div>,
});

export function PreviewContextPanel() {
  const injectedContext = useHermesPreviewStore((s) => s.injectedContext);
  const isEmpty = Object.keys(injectedContext).length === 0;

  return (
    <div className="rounded-xl border">
      <div className="border-b px-3 py-2">
        <span className="text-sm font-medium">Injected Context</span>
      </div>
      <ScrollArea className="h-[200px] p-3">
        {isEmpty ? (
          <div className="text-sm text-muted-foreground">
            No context injected
          </div>
        ) : (
          <JsonView data={injectedContext} />
        )}
      </ScrollArea>
    </div>
  );
}
