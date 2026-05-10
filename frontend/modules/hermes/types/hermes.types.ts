// ===== 枚举类型 =====

export type SessionStatus = "idle" | "running" | "error" | "done";

export type SkillSource = "builtin" | "workspace" | "user";

export type ModelHealth = "healthy" | "degraded" | "offline";

export type HermesHealthStatus = "healthy" | "degraded" | "offline";

// ===== DTO =====

export type HermesMetrics = {
  sessions: number;
  messages: number;
  toolCalls: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCostUsd?: number;
  activeModel?: string;
  updatedAt: string;
};

export type HermesActivityPoint = {
  date: string;
  messages: number;
  toolCalls: number;
  sessions?: number;
};

export type HermesSession = {
  id: string;
  title?: string;
  preview?: string;
  status: SessionStatus;
  messageCount: number;
  toolCallCount: number;
  totalTokens: number;
  updatedAt: string;
};

/** WebUI `/api/projects` 列表项（与 hermes-webui 一致） */
export type HermesProject = {
  project_id: string;
  name: string;
  color?: string;
};

export type HermesSkill = {
  name: string;
  description?: string;
  path?: string;
  enabled: boolean;
  source: SkillSource;
  updatedAt?: string;
};

export type HermesModel = {
  provider: string;
  model: string;
  endpoint?: string;
  isDefault: boolean;
  supportsTools: boolean;
  supportsThinking: boolean;
  supportsVision: boolean;
  health: ModelHealth;
};

export type HermesHealth = {
  status: HermesHealthStatus;
  gateway: {
    reachable: boolean;
    latencyMs: number;
    version: string;
  };
  model: {
    reachable: boolean;
    provider: string;
    model: string;
  };
  memory: {
    enabled: boolean;
    provider: string;
  };
  updatedAt: string;
};

export type HermesMemory = {
  enabled: boolean;
  provider: string;
  entryCount?: number;
  updatedAt?: string;
};

export type HermesConfig = {
  activeModel: string;
  provider: string;
  skillsEnabled: number;
  skillsTotal: number;
  memoryEnabled: boolean;
};

// ===== 错误码 =====

export type HermesErrorCode =
  | "HERMES_GATEWAY_UNREACHABLE"
  | "HERMES_SESSION_NOT_FOUND"
  | "HERMES_MODEL_UNHEALTHY"
  | "HERMES_SKILL_RELOAD_FAILED"
  | "HERMES_STREAM_ABORTED"
  | "HERMES_RESPONSE_DRIFT";

export type HermesError = {
  code: HermesErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

// ===== 页面状态 =====

export type HermesPageState = "loading" | "success" | "error" | "empty";
