/**
 * Hermes API - Unified API call layer
 * Most reads use mock when USE_MOCK is true; session list always uses WebUI runtime
 * (parallel `/api/sessions` + `/api/projects` via `/api/hermes/runtime/...`), matching hermes-webui `renderSessionList`.
 */
import type {
  SessionStatus,
  SkillSource,
  HermesSession,
  HermesProject,
} from "../types/hermes.types";
import type {
  GetHealthResponse,
  GetMetricsResponse,
  GetActivityResponse,
  GetSessionsResponse,
  GetSkillsResponse,
  PostSkillsReloadResponse,
  GetModelsResponse,
  GetMemoryResponse,
  GetConfigResponse,
} from "../types/hermes.contracts";
import * as mock from "../mocks/hermes.mock";

const USE_MOCK = true;

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/hermes${path}`, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `Request failed: ${path}` }));
    throw new Error(error.message ?? `Request failed: ${path}`);
  }
  return res.json();
}

/** 与 hermes-webui `api('/api/...')` 一致：直连 runtime 代理到 WebUI */
async function fetchRuntimeJson<T>(path: string): Promise<T> {
  const res = await fetch(`/api/hermes/runtime${path}`, {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Runtime ${path}: HTTP ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

function parseWebuiSessionsPayload(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object" && "sessions" in body) {
    const s = (body as { sessions?: unknown }).sessions;
    return Array.isArray(s) ? s : [];
  }
  return [];
}

function parseWebuiProjectsPayload(body: unknown): HermesProject[] {
  if (!body || typeof body !== "object" || !("projects" in body)) return [];
  const p = (body as { projects?: unknown }).projects;
  if (!Array.isArray(p)) return [];
  return p
    .map((row): HermesProject | null => {
      if (!row || typeof row !== "object") return null;
      const o = row as Record<string, unknown>;
      const project_id = o.project_id != null ? String(o.project_id) : "";
      const name = o.name != null ? String(o.name) : "";
      if (!project_id) return null;
      const color = o.color != null ? String(o.color) : undefined;
      return { project_id, name, ...(color ? { color } : {}) };
    })
    .filter((x): x is HermesProject => x != null);
}

function webuiTimestampToIso(updatedAt: unknown, createdAt: unknown): string {
  const raw = Number(updatedAt ?? createdAt ?? 0);
  if (!Number.isFinite(raw) || raw <= 0) return new Date(0).toISOString();
  const ms = raw < 1e12 ? raw * 1000 : raw;
  return new Date(ms).toISOString();
}

function inferSessionStatus(raw: Record<string, unknown>): SessionStatus {
  if (raw.active_stream_id) return "running";
  const mc = Number(raw.message_count ?? 0);
  if (mc > 0) return "done";
  return "idle";
}

function mapWebuiSessionRowToHermes(raw: unknown): HermesSession | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = o.session_id != null ? String(o.session_id) : o.id != null ? String(o.id) : "";
  if (!id) return null;
  const title = o.title != null ? String(o.title) : undefined;
  const messageCount = Math.max(0, Number(o.message_count ?? 0) || 0);
  return {
    id,
    title,
    preview: o.preview != null ? String(o.preview) : undefined,
    status: inferSessionStatus(o),
    messageCount,
    toolCallCount: Math.max(0, Number(o.tool_call_count ?? o.tool_calls ?? 0) || 0),
    totalTokens: Math.max(0, Number(o.total_tokens ?? o.tokens ?? 0) || 0),
    updatedAt: webuiTimestampToIso(o.updated_at, o.created_at),
  };
}

async function fetchWebuiSessionsAndProjects(): Promise<{
  sessions: HermesSession[];
  projects: HermesProject[];
}> {
  const [sessBody, projBody] = await Promise.all([
    fetchRuntimeJson<unknown>("/sessions"),
    fetchRuntimeJson<unknown>("/projects"),
  ]);
  const rows = parseWebuiSessionsPayload(sessBody);
  const projects = parseWebuiProjectsPayload(projBody);
  const sessions = rows
    .map(mapWebuiSessionRowToHermes)
    .filter((x): x is HermesSession => x != null);
  return { sessions, projects };
}

// ===== Health =====
export async function getHealth(): Promise<GetHealthResponse> {
  if (USE_MOCK) return mock.mockGetHealth();
  return fetchApi("/health");
}

// ===== Metrics =====
export async function getMetrics(): Promise<GetMetricsResponse> {
  if (USE_MOCK) return mock.mockGetMetrics();
  return fetchApi("/metrics");
}

// ===== Activity =====
export async function getActivity(days?: number): Promise<GetActivityResponse> {
  if (USE_MOCK) return mock.mockGetActivity(days);
  const params = days ? `?days=${days}` : "";
  return fetchApi(`/activity${params}`);
}

// ===== Sessions =====
export async function getSessions(params?: {
  status?: SessionStatus;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<GetSessionsResponse> {
  // 与 hermes-webui `renderSessionList` 一致：默认并行 runtime `/api/sessions` + `/api/projects`，再在客户端筛选/排序/分页
  const { sessions: all, projects } = await fetchWebuiSessionsAndProjects();
  let data = [...all];

  if (params?.status) {
    data = data.filter((s) => s.status === params.status);
  }

  if (params?.sortBy) {
    const key = params.sortBy as keyof HermesSession;
    const order = params.sortOrder ?? "desc";
    data.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        const cmp = av - bv;
        return order === "asc" ? cmp : -cmp;
      }
      const as = String(av);
      const bs = String(bv);
      const cmp = as < bs ? -1 : as > bs ? 1 : 0;
      return order === "asc" ? cmp : -cmp;
    });
  }

  const total = data.length;
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const start = (page - 1) * pageSize;
  data = data.slice(start, start + pageSize);

  return { data, total, projects };
}

// ===== Skills =====
export async function getSkills(params?: {
  source?: SkillSource;
  enabled?: boolean;
}): Promise<GetSkillsResponse> {
  if (USE_MOCK) return mock.mockGetSkills(params);
  const searchParams = new URLSearchParams();
  if (params?.source) searchParams.set("source", params.source);
  if (params?.enabled != null) searchParams.set("enabled", String(params.enabled));
  const qs = searchParams.toString();
  return fetchApi(`/skills${qs ? `?${qs}` : ""}`);
}

export async function reloadSkills(): Promise<PostSkillsReloadResponse> {
  if (USE_MOCK) return mock.mockReloadSkills();
  return fetchApi("/skills/reload", { method: "POST" });
}

// ===== Models =====
export async function getModels(): Promise<GetModelsResponse> {
  if (USE_MOCK) return mock.mockGetModels();
  return fetchApi("/models");
}

// ===== Memory =====
export async function getMemory(): Promise<GetMemoryResponse> {
  if (USE_MOCK) return mock.mockGetMemory();
  return fetchApi("/memory");
}

// ===== Config =====
export async function getConfig(): Promise<GetConfigResponse> {
  if (USE_MOCK) return mock.mockGetConfig();
  return fetchApi("/config");
}
