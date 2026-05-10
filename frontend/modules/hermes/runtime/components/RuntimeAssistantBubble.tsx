"use client";

import { useState } from "react";
import type { RuntimeMessage } from "../types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Brain, ChevronDown, Copy, Check, RotateCcw } from "lucide-react";
import { RuntimeMarkdown } from "./RuntimeMarkdown";
import {
  extractMessageParts,
  formatMessageTime,
  formatMessageTimeFull,
} from "../utils/message-format";

export function RuntimeAssistantBubble({
  message,
  isLast,
  onRegenerate,
}: {
  message: RuntimeMessage;
  isLast?: boolean;
  onRegenerate?: () => void;
}) {
  const { content, thinking } = extractMessageParts(message);
  const [thinkOpen, setThinkOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shortTime = formatMessageTime(message);
  const fullTime = formatMessageTimeFull(message);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const isError = message._error;

  return (
    <div className="flex flex-col items-start gap-1">
      <Card
        className={cn(
          "max-w-[85%] border-transparent bg-transparent px-3 py-2 text-sm shadow-none",
          isError && "border-destructive/30 bg-destructive/5"
        )}
      >
        {thinking ? (
          <div className="mb-2 rounded-md border bg-muted/40">
            <button
              type="button"
              className="flex w-full items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setThinkOpen((v) => !v)}
            >
              <Brain className="h-3 w-3" />
              <span>思考过程</span>
              <ChevronDown
                className={cn(
                  "ml-auto h-3 w-3 transition-transform",
                  thinkOpen && "rotate-180"
                )}
              />
            </button>
            {thinkOpen ? (
              <div className="border-t px-2 py-1.5 text-xs italic text-muted-foreground">
                <div className="whitespace-pre-wrap">{thinking}</div>
              </div>
            ) : null}
          </div>
        ) : null}

        {content ? <RuntimeMarkdown content={content} /> : null}
      </Card>

      <div className="flex items-center gap-1.5 pl-3 text-[11px] text-muted-foreground">
        {shortTime ? <span title={fullTime}>{shortTime}</span> : null}
        {content ? (
          <button
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center rounded-md hover:bg-muted"
            onClick={copy}
            title="复制"
            aria-label="复制消息"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </button>
        ) : null}
        {isLast && onRegenerate ? (
          <button
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center rounded-md hover:bg-muted"
            onClick={onRegenerate}
            title="重新生成"
            aria-label="重新生成"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
