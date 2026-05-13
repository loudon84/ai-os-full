"use client";

import { useEffect, useRef } from "react";
import { Copy } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { HermesPanelMessage } from "../../client/hermes-client.types";
import { RuntimeMarkdown } from "../../runtime/components/RuntimeMarkdown";

export function HermesPanelMessageList(props: {
  messages: HermesPanelMessage[];
  className?: string;
}) {
  const { messages, className } = props;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1", className)}>
      {messages.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-6">开始与 Hermes 对话</p>
      ) : null}
      {messages.map((m, i) => (
        <div
          key={`${m.role}-${i}-${m.timestamp}`}
          className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
        >
          <div
            className={cn(
              "max-w-[95%] rounded-lg border px-3 py-2 text-sm",
              m.role === "user"
                ? "border-primary/20 bg-primary/5"
                : "border-border bg-muted/40",
            )}
          >
            {m.role === "assistant" ? (
              <div>
                {m.content ? (
                  <RuntimeMarkdown content={m.content} />
                ) : m.isStreaming ? (
                  <span className="text-muted-foreground">生成中…</span>
                ) : (
                  <span className="text-muted-foreground">_（无输出）_</span>
                )}
                {m.isStreaming && m.content ? (
                  <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-primary align-middle" />
                ) : null}
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
            )}
            {m.role === "assistant" && m.content ? (
              <div className="mt-2 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(m.content);
                      toast.success("已复制");
                    } catch {
                      toast.error("复制失败");
                    }
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
