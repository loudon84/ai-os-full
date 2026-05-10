"use client";

import { useState } from "react";
import type { RuntimeMessage } from "../types";
import { cn } from "@/lib/utils";
import { Paperclip, Copy, Check } from "lucide-react";
import { formatMessageTime, formatMessageTimeFull } from "../utils/message-format";

export function RuntimeUserBubble({ message }: { message: RuntimeMessage }) {
  const [copied, setCopied] = useState(false);

  const content = typeof message.content === "string" ? message.content : String(message.content ?? "");
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

  return (
    <div className="flex flex-col items-end gap-1">
      {message.attachments && message.attachments.length > 0 ? (
        <div className="flex max-w-[80%] flex-wrap gap-1">
          {message.attachments.map((f, i) => (
            <span
              key={`${f}-${i}`}
              className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-0.5 text-[11px] text-muted-foreground"
            >
              <Paperclip className="h-3 w-3" />
              <span className="max-w-[180px] truncate">{f}</span>
            </span>
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          "max-w-[80%] rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground",
          "whitespace-pre-wrap break-words"
        )}
      >
        {content}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {shortTime ? <span title={fullTime}>{shortTime}</span> : null}
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded-md hover:bg-muted"
          onClick={copy}
          title="复制"
          aria-label="复制消息"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}
