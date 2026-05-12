import type { EmailMessageResponse } from "@portal/shared";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 生成回复/转发用的引用块 HTML（正文以纯文本为主，避免注入） */
export function buildQuotedEmailHtml(mail: EmailMessageResponse): string {
  const when = mail.date ?? mail.received_at ?? mail.sent_at ?? mail.created_at ?? "";
  const fromLine = mail.from
    ? `${mail.from.name ? `${mail.from.name} ` : ""}<${mail.from.address}>`
    : "未知发件人";
  const bodyText = mail.text_body ?? mail.snippet ?? "";
  const safe = escapeHtml(bodyText);
  const whenStr = when ? new Date(when).toLocaleString() : "";
  return `<p></p><blockquote style="border-left:2px solid #ccc;margin:0.5em 0;padding-left:12px;color:#555;"><p style="margin:0 0 8px 0;font-size:12px;">${escapeHtml(fromLine)} — ${escapeHtml(whenStr)}</p><pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;margin:0;">${safe}</pre></blockquote><p></p>`;
}
