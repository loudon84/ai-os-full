import type { EmailAddress, EmailMessageResponse } from "@portal/shared";

import { tokenManager } from "@/modules/auth/services/token-manager";

const EMAIL_CTX = "email-context";
const ATTACHMENTS_REL = "email-context/attachments";

export type EmailWorkspaceInjectResult = {
  ok: boolean;
  /** 已存在 body.md，未覆盖写入 */
  skipped?: boolean;
  error?: string;
};

async function apiJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...options, cache: "no-store", credentials: "same-origin" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

type ListDirResponse = {
  entries: Array<{ name: string; path: string; type: "dir" | "file" }>;
  path: string;
};

async function listDir(sessionId: string, relPath: string): Promise<ListDirResponse> {
  const url = `/api/hermes/runtime/list?session_id=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(relPath)}`;
  const data = await apiJson<ListDirResponse>(url);
  return {
    ...data,
    entries: Array.isArray(data.entries) ? data.entries : [],
  };
}

async function createDir(sessionId: string, path: string): Promise<void> {
  await apiJson<{ ok?: boolean }>("/api/hermes/runtime/file/create-dir", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, path }),
  });
}

async function createTextFile(sessionId: string, path: string, content: string): Promise<void> {
  await apiJson<{ ok?: boolean }>("/api/hermes/runtime/file/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      path,
      content,
    }),
  });
}

function sanitizeRelFilename(name: string): string {
  const n = name.replace(/[/\\]/g, "_").replace(/\.\./g, "_").trim();
  return n.length ? n.slice(0, 200) : "attachment";
}

function formatAddress(a: EmailAddress | null | undefined): string {
  if (!a) return "";
  return a.name ? `${a.name} <${a.address}>` : a.address;
}

function formatAddressList(list: EmailAddress[]): string {
  return list.map((a) => formatAddress(a)).filter(Boolean).join(", ");
}

export function isTextLikeContentType(ct: string | null | undefined): boolean {
  if (!ct) return false;
  const lower = ct.toLowerCase();
  if (lower.startsWith("text/")) return true;
  if (lower.includes("json")) return true;
  if (lower.includes("xml")) return true;
  if (lower.includes("csv")) return true;
  if (lower === "application/javascript" || lower === "application/x-javascript") return true;
  return false;
}

const MAX_TEXT_ATTACHMENT_CHARS = 512_000;

async function downloadAttachmentBlob(attachmentId: string): Promise<{ ok: true; blob: Blob } | { ok: false }> {
  const token = tokenManager.getAccessToken();
  const res = await fetch(`/api/email/attachments/${encodeURIComponent(attachmentId)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "same-origin",
  });
  if (!res.ok) return { ok: false };
  const blob = await res.blob();
  return { ok: true, blob };
}

async function uploadBinaryToWorkspacePath(sessionId: string, relativePath: string, blob: Blob): Promise<boolean> {
  const basename = relativePath.split("/").pop() ?? "file";
  const file = new File([blob], basename, {
    type: blob.type || "application/octet-stream",
  });
  const fd = new FormData();
  fd.append("session_id", sessionId);
  fd.append("file", file, relativePath);
  const res = await fetch("/api/hermes/runtime/upload", {
    method: "POST",
    body: fd,
    credentials: "same-origin",
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { filename?: string; error?: string };
  if (data.error) return false;
  return !!data.filename;
}

function buildBodyMarkdown(email: EmailMessageResponse, plainBody: string): string {
  const when = email.date ?? email.received_at ?? email.sent_at ?? email.created_at;
  const lines = [
    "# 邮件正文",
    "",
    `- 主题: ${email.subject ?? "（无主题）"}`,
    `- 发件人: ${formatAddress(email.from)}`,
    `- 收件人: ${formatAddressList(email.to)}`,
    email.cc.length ? `- 抄送: ${formatAddressList(email.cc)}` : null,
    when ? `- 日期: ${new Date(when).toLocaleString()}` : null,
    "",
    "---",
    "",
    plainBody || "（无正文）",
  ];
  return lines.filter((x) => x !== null).join("\n");
}

/**
 * 在当前 Hermes runtime 会话 workspace 下写入 `email-context/`（正文、附件索引、附件文件）。
 */
export async function injectEmailToWorkspace(params: {
  sessionId: string;
  email: EmailMessageResponse;
  plainBody: string;
}): Promise<EmailWorkspaceInjectResult> {
  const { sessionId, email, plainBody } = params;
  try {
    let hasBody = false;
    try {
      const ctxList = await listDir(sessionId, EMAIL_CTX);
      hasBody = ctxList.entries.some((e) => e.type === "file" && e.name === "body.md");
    } catch {
      hasBody = false;
    }
    if (hasBody) return { ok: true, skipped: true };

    const root = await listDir(sessionId, ".");
    if (!root.entries.some((e) => e.name === EMAIL_CTX && e.type === "dir")) {
      await createDir(sessionId, EMAIL_CTX);
    }
    const inner = await listDir(sessionId, EMAIL_CTX);
    if (!inner.entries.some((e) => e.name === "attachments" && e.type === "dir")) {
      await createDir(sessionId, ATTACHMENTS_REL);
    }

    await createTextFile(sessionId, `${EMAIL_CTX}/body.md`, buildBodyMarkdown(email, plainBody));

    const att = email.attachments ?? [];
    const indexLines = [
      "# 附件清单",
      "",
      "| 文件名 | 类型 | 大小 | Workspace 路径 | 状态 |",
      "| --- | --- | --- | --- | --- |",
    ];

    for (const a of att) {
      const baseName = sanitizeRelFilename(a.filename ?? "attachment");
      const relFile = `${ATTACHMENTS_REL}/${baseName}`;
      const down = await downloadAttachmentBlob(a.id);
      if (!down.ok) {
        indexLines.push(
          `| ${baseName} | ${a.content_type ?? ""} | ${a.size_bytes ?? ""} | — | 下载失败（可能未入库） |`,
        );
        continue;
      }

      if (isTextLikeContentType(a.content_type)) {
        let text = await down.blob.text();
        if (text.length > MAX_TEXT_ATTACHMENT_CHARS) {
          text = text.slice(0, MAX_TEXT_ATTACHMENT_CHARS) + "\n…（已截断）";
        }
        try {
          await createTextFile(sessionId, relFile, text);
          indexLines.push(
            `| ${baseName} | ${a.content_type ?? ""} | ${a.size_bytes ?? ""} | ${relFile} | 已写入文本 |`,
          );
        } catch {
          indexLines.push(
            `| ${baseName} | ${a.content_type ?? ""} | ${a.size_bytes ?? ""} | — | 写入失败 |`,
          );
        }
        continue;
      }

      const ok = await uploadBinaryToWorkspacePath(sessionId, relFile, down.blob);
      indexLines.push(
        `| ${baseName} | ${a.content_type ?? ""} | ${a.size_bytes ?? ""} | ${relFile} | ${ok ? "已上传" : "上传失败"} |`,
      );
    }

    if (att.length) {
      await createTextFile(sessionId, `${EMAIL_CTX}/attachments-index.md`, indexLines.join("\n"));
    }

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
