"use client";

import type { CopilotMessage } from "@/modules/copilotkit/lib/copilot-types";
import { cn } from "@/lib/utils";

type CopilotMessageListProps = {
  messages: CopilotMessage[];
};

export function CopilotMessageList({
  messages,
}: CopilotMessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        暂无会话内容。可以先让 AI 总结当前页面。
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "rounded-xl border p-3 text-sm",
            message.role === "user" ? "bg-primary/5" : "bg-background"
          )}
        >
          <div className="mb-1 text-xs text-muted-foreground">
            {message.role}
          </div>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      ))}
    </div>
  );
}
