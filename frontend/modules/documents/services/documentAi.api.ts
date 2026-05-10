"use client";

import * as mock from "../mocks/documentAi.mock";
import { DocumentApiError } from "./document.api";
import type {
  CreateDocumentAiInteractionRequest,
  CreateDocumentAiInteractionResponse,
  DocumentAiInteraction,
  DocumentAiPatchWire,
  PatchDecisionRequest,
  PatchDecisionResponse,
  PatchValidateRequest,
  PatchValidateResponse,
} from "../types/documentAi.types";

const USE_MOCK = (process.env.NEXT_PUBLIC_DOCUMENT_AI_USE_MOCK ?? "true") !== "false";
const API_BASE = "/ai";

export function resolveDocumentAiStreamUrl(streamPath: string): string {
  if (!streamPath.startsWith("/")) return streamPath;
  return streamPath;
}

function nextIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `idem_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function request<T>(path: string, init?: RequestInit & { idempotent?: boolean }): Promise<T> {
  const { idempotent: doIdempotent, ...restInit } = init ?? {};
  const headers = new Headers(restInit.headers);
  headers.set("Content-Type", "application/json");
  if (doIdempotent) headers.set("Idempotency-Key", headers.get("Idempotency-Key") ?? nextIdempotencyKey());

  const res = await fetch(`${API_BASE}${path}`, {
    ...restInit,
    headers,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => undefined);
    const message = payload?.detail?.message ?? payload?.message ?? payload?.detail ?? `HTTP ${res.status}`;
    throw new DocumentApiError(typeof message === "string" ? message : `HTTP ${res.status}`, {
      status: res.status,
      detail: payload,
    });
  }

  return (await res.json()) as T;
}

export const documentAiApi = {
  async createInteraction(body: CreateDocumentAiInteractionRequest): Promise<CreateDocumentAiInteractionResponse> {
    if (USE_MOCK) return mock.mockCreateDocumentAiInteraction(body);
    return request<CreateDocumentAiInteractionResponse>("/document-ai/interactions", {
      method: "POST",
      body: JSON.stringify(body),
      idempotent: true,
    });
  },

  async getInteraction(interactionId: string): Promise<DocumentAiInteraction> {
    if (USE_MOCK) return mock.mockGetDocumentAiInteraction(interactionId);
    return request<DocumentAiInteraction>(`/document-ai/interactions/${encodeURIComponent(interactionId)}`);
  },

  async validatePatch(body: PatchValidateRequest): Promise<PatchValidateResponse> {
    if (USE_MOCK) return mock.mockValidatePatch(body);
    return request<PatchValidateResponse>("/document-ai/patches/validate", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async getPatch(patchId: string): Promise<DocumentAiPatchWire> {
    if (USE_MOCK) return mock.mockGetDocumentAiPatch(patchId);
    return request<DocumentAiPatchWire>(`/document-ai/patches/${encodeURIComponent(patchId)}`);
  },

  async submitPatchDecision(patchId: string, body: PatchDecisionRequest): Promise<PatchDecisionResponse> {
    if (USE_MOCK) return mock.mockSubmitPatchDecision(patchId, body);
    return request<PatchDecisionResponse>(`/document-ai/patches/${encodeURIComponent(patchId)}/decision`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};
