"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { ListTodo } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EmailMessageResponse } from "@portal/shared";

import { useEmailAccountStore } from "../stores/email-account-store";
import { useEmailStore } from "../stores/email-store";
import { EmailAiActionButton } from "./email-ai-action-button";

export function EmailActionBar(props: {
  mail: EmailMessageResponse;
  runSummarizeEmail: () => Promise<string>;
  runDraftReply: () => Promise<string>;
  /** 从当前邮件提取待办/任务清单（与 AI Panel「提取待办」同源） */
  runExtractTasks: () => Promise<string>;
}) {
  const { mail, runSummarizeEmail, runDraftReply, runExtractTasks } = props;
  const setComposeMode = useEmailStore((s) => s.setComposeMode);
  const selfEmail = useEmailAccountStore((s) => s.cachedAccount?.email_address ?? null);
  const [busy, setBusy] = useState<string | null>(null);

  const wrap = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-default-200 px-4 py-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setComposeMode("reply", mail, { selfEmail })}
      >
        <Icon icon="heroicons:arrow-uturn-left" className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
        回复
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setComposeMode("replyAll", mail, { selfEmail })}
      >
        全部回复
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setComposeMode("forward", mail)}>
        <Icon icon="heroicons:arrow-uturn-right" className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
        转发
      </Button>
      <EmailAiActionButton
        label="AI 摘要"
        loading={busy === "sum"}
        onClick={() => wrap("sum", runSummarizeEmail)}
      />
      <EmailAiActionButton
        label="AI 回复"
        loading={busy === "dr"}
        onClick={() => wrap("dr", runDraftReply)}
      />
      <EmailAiActionButton
        label="创建任务"
        icon={<ListTodo className="h-3.5 w-3.5" />}
        loading={busy === "task"}
        onClick={() => wrap("task", runExtractTasks)}
      />
    </div>
  );
}
