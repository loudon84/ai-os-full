/**
 * Hermes Mock - Mock data functions for development
 * All functions return data conforming to the contract types.
 */
import type {
  SessionStatus,
  SkillSource,
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
import {
  seedHealth,
  seedMetrics,
  seedActivityPoints,
  seedSessions,
  seedSkills,
  seedModels,
  seedMemory,
  seedConfig,
} from "./hermes.seed";

// Simulate network delay
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// ===== Health =====
export async function mockGetHealth(): Promise<GetHealthResponse> {
  await delay(100);
  return seedHealth;
}

// ===== Metrics =====
export async function mockGetMetrics(): Promise<GetMetricsResponse> {
  await delay();
  return seedMetrics;
}

// ===== Activity =====
export async function mockGetActivity(days?: number): Promise<GetActivityResponse> {
  await delay();
  const d = days ?? 14;
  return seedActivityPoints.slice(-d);
}

// ===== Sessions =====
export async function mockGetSessions(params?: {
  status?: SessionStatus;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<GetSessionsResponse> {
  await delay();
  let data = [...seedSessions];

  if (params?.status) {
    data = data.filter((s) => s.status === params.status);
  }

  if (params?.sortBy) {
    const key = params.sortBy as keyof (typeof data)[0];
    const order = params.sortOrder ?? "desc";
    data.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av == null || bv == null) return 0;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return order === "asc" ? cmp : -cmp;
    });
  }

  const total = data.length;
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const start = (page - 1) * pageSize;
  data = data.slice(start, start + pageSize);

  return { data, total, projects: [] };
}

// ===== Skills =====
export async function mockGetSkills(params?: {
  source?: SkillSource;
  enabled?: boolean;
}): Promise<GetSkillsResponse> {
  await delay();
  let data = [...seedSkills];

  if (params?.source) {
    data = data.filter((s) => s.source === params.source);
  }
  if (params?.enabled != null) {
    data = data.filter((s) => s.enabled === params.enabled);
  }

  return data;
}

export async function mockReloadSkills(): Promise<PostSkillsReloadResponse> {
  await delay(500);
  return { success: true, message: "Skills reloaded successfully" };
}

// ===== Models =====
export async function mockGetModels(): Promise<GetModelsResponse> {
  await delay();
  return seedModels;
}

// ===== Memory =====
export async function mockGetMemory(): Promise<GetMemoryResponse> {
  await delay();
  return seedMemory;
}

// ===== Config =====
export async function mockGetConfig(): Promise<GetConfigResponse> {
  await delay();
  return seedConfig;
}
