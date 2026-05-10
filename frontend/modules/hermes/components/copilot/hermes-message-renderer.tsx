/**
 * HermesMessageRenderer - Renders a single Copilot message
 * with role-based styling and structured tool UI rendering.
 *
 * Phase 3: Tool messages now render through HermesToolRenderer
 * which routes to specialized card components.
 */
"use client";

import { cn } from "@/lib/utils";
import { HermesToolRenderer } from "./hermes-tool-renderer";

type HermesMessageRendererProps = {
  message: {
    id?: string;
    role: string;
    content: string;
    toolName?: string;
    data?: unknown;
  };
};

export function HermesMessageRenderer({ message }: HermesMessageRendererProps) {
  const isUser = message.role === "user";
  const isTool = message.role === "tool";
  const isAssistant = message.role === "assistant";

  // Tool messages get structured rendering
  if (isTool) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">
          tool &middot; {message.toolName ?? "unknown"}
        </div>
        <HermesToolRenderer
          toolName={message.toolName}
          data={message.data ?? message.content}
        />
      </div>
    );
  }

  // User and assistant messages get text rendering
  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2 text-sm",
        isUser && "bg-primary/10 ml-8",
        isAssistant && "bg-muted mr-4"
      )}
    >
      <div className="mb-1">
        <span
          className={cn(
            "text-xs font-medium",
            isUser && "text-primary",
            isAssistant && "text-muted-foreground"
          )}
        >
          {isUser ? "You" : "Hermes"}
        </span>
      </div>
      <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
    </div>
  );
}
