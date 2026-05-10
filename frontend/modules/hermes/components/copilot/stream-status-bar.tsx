/**
 * StreamStatusBar - Displays current agent, session, and streaming status.
 */
"use client";

import { Loader2 } from "lucide-react";

type StreamStatusBarProps = {
  activeAgent: string;
  sessionId: string;
  isLoading: boolean;
};

export function StreamStatusBar({ activeAgent, sessionId, isLoading }: StreamStatusBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span>agent: <span className="font-medium text-foreground">{activeAgent}</span></span>
      <span>session: <span className="font-mono text-foreground">{sessionId ? sessionId.slice(0, 8) + "..." : "new"}</span></span>
      <span className="flex items-center gap-1">
        status:{" "}
        {isLoading ? (
          <span className="flex items-center gap-1 text-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            running
          </span>
        ) : (
          <span className="text-foreground">idle</span>
        )}
      </span>
    </div>
  );
}
