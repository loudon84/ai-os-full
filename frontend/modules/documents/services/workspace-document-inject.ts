import type { DocumentMeta } from "../types/document.types";

const DOCUMENT_CTX = "document-context";

export type DocumentWorkspaceInjectResult = {
  ok: boolean;
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

const MAX_SNAPSHOT_JSON_CHARS = 24_000;

function buildOverviewMarkdown(
  doc: DocumentMeta,
  snapshotExcerpt: string | undefined,
): string {
  const lines = [
    "# 文档上下文",
    "",
    `- 文档 ID: ${doc.id}`,
    `- 标题: ${doc.title}`,
    `- 类型: ${doc.document_type}`,
    `- 引擎: ${doc.engine}`,
    `- 当前版本号: ${doc.current_version_no}`,
    "",
    "---",
    "",
    "## 快照摘录（JSON，可能截断）",
    "",
    snapshotExcerpt && snapshotExcerpt.trim().length > 0
      ? "```json\n" + snapshotExcerpt + "\n```"
      : "（无快照数据；可在保存后重新打开以注入最新快照）",
    "",
  ];
  return lines.join("\n");
}

/**
 * 在当前 Hermes runtime 会话 workspace 下写入 `document-context/overview.md`。
 */
export async function injectDocumentToWorkspace(params: {
  sessionId: string;
  document: DocumentMeta;
  snapshot?: Record<string, unknown> | null;
}): Promise<DocumentWorkspaceInjectResult> {
  const { sessionId, document: doc, snapshot } = params;
  try {
    let hasOverview = false;
    try {
      const ctxList = await listDir(sessionId, DOCUMENT_CTX);
      hasOverview = ctxList.entries.some((e) => e.type === "file" && e.name === "overview.md");
    } catch {
      hasOverview = false;
    }
    if (hasOverview) return { ok: true, skipped: true };

    const root = await listDir(sessionId, ".");
    if (!root.entries.some((e) => e.name === DOCUMENT_CTX && e.type === "dir")) {
      await createDir(sessionId, DOCUMENT_CTX);
    }

    let excerpt = "";
    if (snapshot && typeof snapshot === "object") {
      try {
        excerpt = JSON.stringify(snapshot, null, 2);
        if (excerpt.length > MAX_SNAPSHOT_JSON_CHARS) {
          excerpt = excerpt.slice(0, MAX_SNAPSHOT_JSON_CHARS) + "\n…（已截断）";
        }
      } catch {
        excerpt = String(snapshot);
      }
    }

    await createTextFile(sessionId, `${DOCUMENT_CTX}/overview.md`, buildOverviewMarkdown(doc, excerpt));

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
