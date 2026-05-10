"use client";

import type {
  CreateDocumentRequest,
  DocumentListResponse,
  DocumentMeta,
  SnapshotEnvelope,
  SnapshotSaveRequest,
  SnapshotSaveResponse,
} from "../types/document.types";
import * as mock from "../mocks/document.mock";

// 默认走真实接口；需要 mock 时显式设置 NEXT_PUBLIC_DOCUMENT_USE_MOCK=true
const USE_MOCK = (process.env.NEXT_PUBLIC_DOCUMENT_USE_MOCK ?? "false") === "true";

const API_BASE = "/api/documents";

export class DocumentApiError extends Error {
  status: number;
  detail?: unknown;

  constructor(message: string, opts: { status: number; detail?: unknown }) {
    super(message);
    this.status = opts.status;
    this.detail = opts.detail;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => undefined);
    const message = payload?.message ?? payload?.detail?.message ?? `HTTP ${res.status}`;
    throw new DocumentApiError(message, { status: res.status, detail: payload });
  }

  return (await res.json()) as T;
}

export const documentApi = {
  async listDocuments(params?: { keyword?: string; page?: number; pageSize?: number }): Promise<DocumentListResponse> {
    if (USE_MOCK) return mock.mockListDocuments(params);
    const query = new URLSearchParams();
    if (params?.keyword) query.set("keyword", params.keyword);
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("page_size", String(params.pageSize));
    return request<DocumentListResponse>(`?${query.toString()}`);
  },

  async createDocument(input: CreateDocumentRequest): Promise<DocumentMeta> {
    if (USE_MOCK) return mock.mockCreateDocument({ title: input.title });
    return request<DocumentMeta>("", { method: "POST", body: JSON.stringify(input) });
  },

  async getDocument(documentId: string): Promise<DocumentMeta> {
    if (USE_MOCK) return mock.mockGetDocument(documentId);
    return request<DocumentMeta>(`/${documentId}`);
  },

  async getSnapshot(documentId: string): Promise<SnapshotEnvelope> {
    if (USE_MOCK) return mock.mockGetSnapshot(documentId);
    return request<SnapshotEnvelope>(`/${documentId}/snapshot`);
  },

  async saveSnapshot(documentId: string, payload: SnapshotSaveRequest): Promise<SnapshotSaveResponse> {
    if (USE_MOCK) {
      return {
        document_id: documentId,
        version_no: payload.base_version_no + 1,
        snapshot_size_bytes: JSON.stringify(payload).length,
        snapshot_checksum_sha256: "mock",
        saved_at: new Date().toISOString(),
      };
    }
    return request<SnapshotSaveResponse>(`/${documentId}/snapshot`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};

