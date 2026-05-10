import type {
  HermesMetrics,
  HermesActivityPoint,
  HermesSession,
  HermesProject,
  HermesSkill,
  HermesModel,
  HermesHealth,
  HermesMemory,
  HermesConfig,
} from "./hermes.types";

// ===== 请求 =====

export type GetActivityRequest = { days?: number };

export type GetSessionsRequest = {
  status?: "idle" | "running" | "error" | "done";
  page?: number;
  pageSize?: number;
  sortBy?: keyof HermesSession;
  sortOrder?: "asc" | "desc";
};

export type GetSkillsRequest = {
  source?: "builtin" | "workspace" | "user";
  enabled?: boolean;
};

// ===== 响应 =====

export type GetHealthResponse = HermesHealth;

export type GetMetricsResponse = HermesMetrics;

export type GetActivityResponse = HermesActivityPoint[];

export type GetSessionsResponse = {
  data: HermesSession[];
  total: number;
  /** 与 WebUI `renderSessionList` 相同：与 sessions 并行拉取 */
  projects?: HermesProject[];
};

export type GetSkillsResponse = HermesSkill[];

export type PostSkillsReloadResponse = { success: boolean; message?: string };

export type GetModelsResponse = HermesModel[];

export type GetMemoryResponse = HermesMemory;

export type GetConfigResponse = HermesConfig;
