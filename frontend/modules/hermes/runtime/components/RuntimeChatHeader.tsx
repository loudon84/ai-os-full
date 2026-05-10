"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function RuntimeChatHeader({
  title,
  sessionId,
  model,
  isLoading,
  actions,
}: {
  title: string;
  sessionId: string | null;
  model?: string | null;
  isLoading: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b p-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {sessionId ? `session: ${sessionId}` : "未选择会话"}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {model ? <Badge variant="secondary">{model}</Badge> : null}
        <Badge className={cn(isLoading ? "bg-muted text-foreground" : "bg-emerald-600 text-white")}>
          {isLoading ? "streaming" : "idle"}
        </Badge>
      </div>
    </div>
  );
}

