import type { EmailAddress } from "@portal/shared";

/** 将逗号/分号分隔的收件人字符串解析为 EmailAddress[]（仅 address，无 display name） */
export function parseAddressList(raw: string): EmailAddress[] {
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((address) => ({ address }));
}

export function formatAttachmentSize(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
