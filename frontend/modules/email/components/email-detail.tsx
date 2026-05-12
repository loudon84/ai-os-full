"use client";

import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { EmailAddress, EmailMessageResponse } from "@portal/shared";

import { updateEmailMessage } from "../services/email-api";
import { EmailAttachmentList } from "./email-attachment-list";

function formatAddresses(list: EmailAddress[]): string {
  return list.map((a) => (a.name ? `${a.name} <${a.address}>` : a.address)).join(", ");
}

interface EmailDetailProps {
  mail: EmailMessageResponse;
  onMailUpdated?: () => void;
}

export function EmailDetail({ mail, onMailUpdated }: EmailDetailProps) {
  const markReadRequested = useRef<string | null>(null);

  useEffect(() => {
    markReadRequested.current = null;
  }, [mail.id]);

  useEffect(() => {
    if (mail.is_read) return;
    if (markReadRequested.current === mail.id) return;
    markReadRequested.current = mail.id;
    void (async () => {
      const res = await updateEmailMessage(mail.id, { is_read: true });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      onMailUpdated?.();
    })();
  }, [mail.id, mail.is_read, onMailUpdated]);

  const fromLine = mail.from
    ? mail.from.name
      ? `${mail.from.name} <${mail.from.address}>`
      : mail.from.address
    : "未知发件人";

  const when = mail.date ?? mail.received_at ?? mail.sent_at ?? mail.created_at;

  return (
    <div className="mt-2 flex h-full flex-col px-6 pb-8">
      <div>
        <div className="text-lg font-medium text-default-900">
          {mail.subject ?? "（无主题）"}
        </div>
        <div className="mt-6 flex items-center gap-2">
          <Avatar className="h-11 w-11">
            <AvatarFallback>
              {(mail.from?.name ?? mail.from?.address ?? "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-default-900">{fromLine}</div>
            <div className="text-xs text-default-500">
              {when ? new Date(when).toLocaleString() : ""}
            </div>
          </div>
        </div>

        {(mail.to.length > 0 || mail.cc.length > 0) && (
          <div className="mt-4 space-y-1 text-xs text-default-600">
            {mail.to.length > 0 && (
              <div>
                <span className="font-medium">收件人：</span>
                {formatAddresses(mail.to)}
              </div>
            )}
            {mail.cc.length > 0 && (
              <div>
                <span className="font-medium">抄送：</span>
                {formatAddresses(mail.cc)}
              </div>
            )}
          </div>
        )}

        <div className="my-5 border border-dashed border-default-300" />

        {mail.html_body ? (
          <iframe
            title="email-html"
            sandbox=""
            srcDoc={mail.html_body}
            className="min-h-[360px] w-full rounded-md border border-default-200 bg-background"
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm text-default-700">
            {mail.text_body ?? mail.snippet ?? "（无正文）"}
          </pre>
        )}

        <EmailAttachmentList attachments={mail.attachments} />
      </div>
    </div>
  );
}
