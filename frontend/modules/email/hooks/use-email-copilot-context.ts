"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { useMemo } from "react";

import type { EmailFolderType, EmailMessageResponse } from "@portal/shared";

export type EmailCopilotFolderContext = {
  folder_type?: EmailFolderType;
  folder_path?: string;
};

/**
 * 将当前选中邮件、文件夹与账号上下文注册到 CopilotKit（供侧栏对话使用）。
 */
export function useEmailCopilotContext(input: {
  selectedMail: EmailMessageResponse | null;
  folder: EmailCopilotFolderContext | null;
  accountEmail: string | null;
}) {
  const value = useMemo(() => {
    const m = input.selectedMail;
    if (!m) {
      return {
        hasSelection: false as const,
        folder: input.folder,
        accountEmail: input.accountEmail,
      };
    }
    const bodyPreview = (m.text_body ?? m.snippet ?? "").slice(0, 8000);
    return {
      hasSelection: true as const,
      folder: input.folder,
      accountEmail: input.accountEmail,
      subject: m.subject,
      from: m.from,
      to: m.to,
      cc: m.cc,
      date: m.date ?? m.received_at ?? m.sent_at,
      bodyPreview,
      message_id: m.message_id,
      in_reply_to: m.in_reply_to,
      references: m.references,
    };
  }, [input.selectedMail, input.folder, input.accountEmail]);

  useCopilotReadable(
    {
      description:
        "当前邮箱工作区上下文：选中邮件的主题/收发件人/日期/正文摘要、文件夹、绑定账号地址。",
      value,
    },
    [value],
  );
}
