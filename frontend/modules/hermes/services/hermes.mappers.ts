/**
 * Hermes Mappers - Gateway response → DTO mapping
 * Phase 1: Gateway response assumed to match DTO structure.
 * Mappers primarily do pass-through + default value filling.
 * Adaptation points reserved for Phase 2 when Gateway format may diverge.
 */
import type {
  HermesMetrics,
  HermesActivityPoint,
  HermesSession,
  HermesSkill,
  HermesModel,
  HermesHealth,
  HermesMemory,
  HermesConfig,
} from "../types/hermes.types";

export function mapMetrics(raw: Record<string, unknown>): HermesMetrics {
  return {
    sessions: (raw.sessions as number) ?? 0,
    messages: (raw.messages as number) ?? 0,
    toolCalls: (raw.toolCalls as number) ?? 0,
    totalPromptTokens: (raw.totalPromptTokens as number) ?? 0,
    totalCompletionTokens: (raw.totalCompletionTokens as number) ?? 0,
    totalCostUsd: raw.totalCostUsd as number | undefined,
    activeModel: raw.activeModel as string | undefined,
    updatedAt: (raw.updatedAt as string) ?? new Date().toISOString(),
  };
}

export function mapActivityPoint(raw: Record<string, unknown>): HermesActivityPoint {
  return {
    date: (raw.date as string) ?? "",
    messages: (raw.messages as number) ?? 0,
    toolCalls: (raw.toolCalls as number) ?? 0,
    sessions: raw.sessions as number | undefined,
  };
}

export function mapSession(raw: Record<string, unknown>): HermesSession {
  return {
    id: (raw.id as string) ?? "",
    title: raw.title as string | undefined,
    preview: raw.preview as string | undefined,
    status: (raw.status as HermesSession["status"]) ?? "idle",
    messageCount: (raw.messageCount as number) ?? 0,
    toolCallCount: (raw.toolCallCount as number) ?? 0,
    totalTokens: (raw.totalTokens as number) ?? 0,
    updatedAt: (raw.updatedAt as string) ?? new Date().toISOString(),
  };
}

export function mapSkill(raw: Record<string, unknown>): HermesSkill {
  return {
    name: (raw.name as string) ?? "",
    description: raw.description as string | undefined,
    path: raw.path as string | undefined,
    enabled: (raw.enabled as boolean) ?? true,
    source: (raw.source as HermesSkill["source"]) ?? "builtin",
    updatedAt: raw.updatedAt as string | undefined,
  };
}

export function mapModel(raw: Record<string, unknown>): HermesModel {
  return {
    provider: (raw.provider as string) ?? "",
    model: (raw.model as string) ?? "",
    endpoint: raw.endpoint as string | undefined,
    isDefault: (raw.isDefault as boolean) ?? false,
    supportsTools: (raw.supportsTools as boolean) ?? true,
    supportsThinking: (raw.supportsThinking as boolean) ?? false,
    supportsVision: (raw.supportsVision as boolean) ?? false,
    health: (raw.health as HermesModel["health"]) ?? "healthy",
  };
}

export function mapHealth(raw: Record<string, unknown>): HermesHealth {
  return {
    status: (raw.status as HermesHealth["status"]) ?? "offline",
    gateway: {
      reachable: ((raw.gateway as Record<string, unknown>)?.reachable as boolean) ?? false,
      latencyMs: ((raw.gateway as Record<string, unknown>)?.latencyMs as number) ?? 0,
      version: ((raw.gateway as Record<string, unknown>)?.version as string) ?? "unknown",
    },
    model: {
      reachable: ((raw.model as Record<string, unknown>)?.reachable as boolean) ?? false,
      provider: ((raw.model as Record<string, unknown>)?.provider as string) ?? "",
      model: ((raw.model as Record<string, unknown>)?.model as string) ?? "",
    },
    memory: {
      enabled: ((raw.memory as Record<string, unknown>)?.enabled as boolean) ?? false,
      provider: ((raw.memory as Record<string, unknown>)?.provider as string) ?? "",
    },
    updatedAt: (raw.updatedAt as string) ?? new Date().toISOString(),
  };
}

export function mapMemory(raw: Record<string, unknown>): HermesMemory {
  return {
    enabled: (raw.enabled as boolean) ?? false,
    provider: (raw.provider as string) ?? "",
    entryCount: raw.entryCount as number | undefined,
    updatedAt: raw.updatedAt as string | undefined,
  };
}

export function mapConfig(raw: Record<string, unknown>): HermesConfig {
  return {
    activeModel: (raw.activeModel as string) ?? "",
    provider: (raw.provider as string) ?? "",
    skillsEnabled: (raw.skillsEnabled as number) ?? 0,
    skillsTotal: (raw.skillsTotal as number) ?? 0,
    memoryEnabled: (raw.memoryEnabled as boolean) ?? false,
  };
}
