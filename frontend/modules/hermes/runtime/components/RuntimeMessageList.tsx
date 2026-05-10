"use client";

import { Fragment, useEffect, useMemo, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RuntimeMessage, RuntimeToolCall } from "../types";
import { RuntimeUserBubble } from "./RuntimeUserBubble";
import { RuntimeAssistantBubble } from "./RuntimeAssistantBubble";
import { RuntimeToolCard } from "./RuntimeToolCard";
import {
  formatDateSeparator,
  isMessageVisible,
  shouldShowDateSeparator,
} from "../utils/message-format";

type Props = {
  messages: RuntimeMessage[];
  toolCalls: RuntimeToolCall[];
  isStreaming?: boolean;
  onRegenerate?: () => void;
};

/** 当前会话空态 */
function EmptyState() {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
      <div className="text-sm font-medium">开始对话吧</div>
      <div className="text-xs">在下方输入消息，或拖放文件到输入框附件。</div>
    </div>
  );
}

export function RuntimeMessageList({ messages, toolCalls, isStreaming, onRegenerate }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const pinnedRef = useRef(true);

  /** 仅筛出应展示的消息 + 原始 index（用于工具卡片定位） */
  const visible = useMemo(() => {
    const out: Array<{ m: RuntimeMessage; rawIdx: number }> = [];
    messages.forEach((m, rawIdx) => {
      if (isMessageVisible(m)) out.push({ m, rawIdx });
    });
    return out;
  }, [messages]);

  const lastAssistantRawIdx = useMemo(() => {
    for (let i = visible.length - 1; i >= 0; i--) {
      if (visible[i].m.role === "assistant") return visible[i].rawIdx;
    }
    return -1;
  }, [visible]);

  /** 按 assistant_msg_idx 分组工具卡片，未携带时挂到最后一条 assistant 后 */
  const toolCallsByAssistant = useMemo(() => {
    const map = new Map<number, RuntimeToolCall[]>();
    for (const tc of toolCalls ?? []) {
      const key =
        typeof tc.assistant_msg_idx === "number" ? tc.assistant_msg_idx : lastAssistantRawIdx;
      if (key < 0) continue;
      const arr = map.get(key) ?? [];
      arr.push(tc);
      map.set(key, arr);
    }
    return map;
  }, [toolCalls, lastAssistantRawIdx]);

  /** 未绑定到任何 assistant（例如 streaming 中还没第一条 assistant）时直接展示 */
  const orphanToolCalls = useMemo(() => {
    if (!toolCalls?.length) return [];
    if (lastAssistantRawIdx >= 0) return [];
    return toolCalls;
  }, [toolCalls, lastAssistantRawIdx]);

  /** 监听滚动位置：若用户上滑离开底部 → 不自动跟随 */
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    // shadcn ScrollArea viewport 带 data-radix-scroll-area-viewport
    const viewport = root.querySelector<HTMLDivElement>(
      "[data-radix-scroll-area-viewport]"
    );
    if (!viewport) return;
    const onScroll = () => {
      const dist = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      pinnedRef.current = dist < 48;
    };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => viewport.removeEventListener("scroll", onScroll);
  }, []);

  /** streaming 时只在"贴底"才继续跟随；非 streaming（切换会话、收到最终消息）则强制滚到底 */
  useEffect(() => {
    if (isStreaming && !pinnedRef.current) return;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [visible.length, isStreaming, toolCalls?.length]);

  if (visible.length === 0 && !orphanToolCalls.length) {
    return (
      <ScrollArea className="h-full" ref={scrollRef}>
        <EmptyState />
      </ScrollArea>
    );
  }

  let prevMessage: RuntimeMessage | null = null;

  return (
    <ScrollArea className="h-full" ref={scrollRef}>
      <div className="mx-auto flex w-full max-w-[860px] flex-col gap-3 px-4 py-4 pb-[220px]">
        {visible.map(({ m, rawIdx }) => {
          const sep = shouldShowDateSeparator(prevMessage, m);
          prevMessage = m;
          const isLastAssistant = m.role === "assistant" && rawIdx === lastAssistantRawIdx;
          const groupedTools = toolCallsByAssistant.get(rawIdx);

          return (
            <Fragment key={rawIdx}>
              {sep.show && sep.date ? (
                <div className="my-1 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {formatDateSeparator(sep.date)}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              ) : null}

              {m.role === "user" ? (
                <RuntimeUserBubble message={m} />
              ) : (
                <RuntimeAssistantBubble
                  message={m}
                  isLast={isLastAssistant}
                  onRegenerate={isLastAssistant ? onRegenerate : undefined}
                />
              )}

              {groupedTools?.length ? (
                <ToolCallGroup toolCalls={groupedTools} />
              ) : null}
            </Fragment>
          );
        })}

        {/* 流式中尚未绑定到某条 assistant 的工具调用（首次 token 前触发） */}
        {orphanToolCalls.length ? <ToolCallGroup toolCalls={orphanToolCalls} /> : null}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

function ToolCallGroup({ toolCalls }: { toolCalls: RuntimeToolCall[] }) {
  if (!toolCalls.length) return null;
  return (
    <div className="space-y-2 pl-3">
      {toolCalls.map((tc) => (
        <RuntimeToolCard key={tc.tid} toolCall={tc} />
      ))}
    </div>
  );
}
