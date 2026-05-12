"use client";

import { formatDistanceToNow } from "date-fns";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { EmailMessageResponse } from "@portal/shared";

function messageTime(m: EmailMessageResponse): number {
  const s = m.date ?? m.received_at ?? m.sent_at ?? m.created_at;
  return s ? new Date(s).getTime() : 0;
}

/** 基于 thread_id / references / message_id 在前端已加载列表中聚合线程 */
export function buildThreadMessages(
  all: EmailMessageResponse[],
  current: EmailMessageResponse,
): EmailMessageResponse[] {
  const idSet = new Set<string>();
  if (current.message_id) idSet.add(current.message_id);
  for (const r of current.references ?? []) {
    if (r) idSet.add(r);
  }

  const list = all.filter((m) => {
    if (m.id === current.id) return true;
    if (current.thread_id && m.thread_id && m.thread_id === current.thread_id) return true;
    if (m.message_id && idSet.has(m.message_id)) return true;
    for (const r of m.references ?? []) {
      if (r && idSet.has(r)) return true;
    }
    if (current.message_id && (m.references ?? []).includes(current.message_id)) return true;
    return false;
  });

  const uniq = [...new Map(list.map((m) => [m.id, m])).values()];
  uniq.sort((a, b) => messageTime(a) - messageTime(b));
  return uniq;
}

export function EmailThreadView(props: {
  messages: EmailMessageResponse[];
  current: EmailMessageResponse;
  className?: string;
}) {
  const { messages, current, className } = props;
  const thread = buildThreadMessages(messages, current);
  if (thread.length <= 1) return null;

  return (
    <div className={cn("border-b border-default-200 px-6 pb-4", className)}>
      <div className="mb-2 text-xs font-medium uppercase text-default-500">会话线程</div>
      <Accordion type="single" collapsible className="w-full">
        {thread.map((m) => {
          const label = m.from?.name ?? m.from?.address ?? "未知";
          const when = m.date ?? m.received_at ?? m.sent_at ?? m.created_at;
          const active = m.id === current.id;
          return (
            <AccordionItem value={m.id} key={m.id} className="border-default-200">
              <AccordionTrigger
                className={cn("py-2 text-sm hover:no-underline", active && "text-primary")}
              >
                <span className="truncate text-left">
                  {label}
                  {when ? (
                    <span className="ms-2 text-xs font-normal text-muted-foreground">
                      {formatDistanceToNow(new Date(when), { addSuffix: true })}
                    </span>
                  ) : null}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="rounded-md border border-default-100 bg-muted/30 p-2 text-xs text-default-700">
                  <div className="font-medium">{m.subject ?? "（无主题）"}</div>
                  <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
                    {m.snippet ?? m.text_body ?? "（无摘要）"}
                  </pre>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
