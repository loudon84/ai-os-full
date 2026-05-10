"use client";

import { Badge } from "@/components/ui/badge";
import { usePreviewPerf } from "../../hooks/use-preview-perf";

export function PreviewPerfPanel() {
  const { metrics } = usePreviewPerf();

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">Render Performance</span>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">First render</span>
          <Badge variant="outline" className="text-xs">
            {metrics.renderDurationMs != null
              ? `${metrics.renderDurationMs.toFixed(1)}ms`
              : "\u2014"}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Re-renders</span>
          <Badge variant="outline" className="text-xs">
            {metrics.reRenderCount}
          </Badge>
        </div>
      </div>
    </div>
  );
}
