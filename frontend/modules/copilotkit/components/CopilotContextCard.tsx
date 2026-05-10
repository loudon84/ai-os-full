"use client";

import type { PageCopilotContext } from "@/modules/copilotkit/lib/copilot-types";

type CopilotContextCardProps = {
  context?: PageCopilotContext;
};

export function CopilotContextCard({ context }: CopilotContextCardProps) {
  if (!context) {
    return (
      <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        当前页面未配置 AI 上下文。
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
      <div className="font-medium">{context.pageTitle}</div>
      <div className="mt-1 text-muted-foreground">模块：{context.module}</div>
      <div className="text-muted-foreground">路由：{context.route}</div>
      {context.summary ? (
        <div className="mt-2 text-muted-foreground">{context.summary}</div>
      ) : null}
    </div>
  );
}
