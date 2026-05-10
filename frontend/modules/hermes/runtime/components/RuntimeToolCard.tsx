"use client";

import type { RuntimeToolCall } from "../types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function RuntimeToolCard({ toolCall }: { toolCall: RuntimeToolCall }) {
  const status = toolCall.done ? (toolCall.is_error ? "error" : "done") : "running";

  return (
    <Card className="px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{toolCall.name}</div>
          {toolCall.preview ? (
            <div className="truncate text-xs text-muted-foreground">{toolCall.preview}</div>
          ) : null}
        </div>
        <Badge
          className={cn(
            status === "running" && "bg-muted text-foreground",
            status === "done" && "bg-emerald-600 text-white",
            status === "error" && "bg-destructive text-destructive-foreground"
          )}
        >
          {status}
        </Badge>
      </div>

      {toolCall.args && Object.keys(toolCall.args).length ? (
        <div className="mt-2 text-xs text-muted-foreground">
          <div className="font-medium text-foreground/70">args</div>
          <pre className="mt-1 max-h-32 overflow-auto rounded-md bg-muted p-2">
            {JSON.stringify(toolCall.args, null, 2)}
          </pre>
        </div>
      ) : null}
    </Card>
  );
}

