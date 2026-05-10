import { z } from "zod";

export const HermesMetricsSchema = z.object({
  sessions: z.number().nonnegative(),
  messages: z.number().nonnegative(),
  toolCalls: z.number().nonnegative(),
  totalPromptTokens: z.number().nonnegative(),
  totalCompletionTokens: z.number().nonnegative(),
  totalCostUsd: z.number().nonnegative().optional(),
  activeModel: z.string().optional(),
  updatedAt: z.string(),
});

export const HermesActivityPointSchema = z.object({
  date: z.string(),
  messages: z.number().nonnegative(),
  toolCalls: z.number().nonnegative(),
  sessions: z.number().nonnegative().optional(),
});

export const HermesSessionSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  preview: z.string().optional(),
  status: z.enum(["idle", "running", "error", "done"]),
  messageCount: z.number().nonnegative(),
  toolCallCount: z.number().nonnegative(),
  totalTokens: z.number().nonnegative(),
  updatedAt: z.string(),
});

export const HermesSkillSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  path: z.string().optional(),
  enabled: z.boolean(),
  source: z.enum(["builtin", "workspace", "user"]),
  updatedAt: z.string().optional(),
});

export const HermesModelSchema = z.object({
  provider: z.string(),
  model: z.string(),
  endpoint: z.string().optional(),
  isDefault: z.boolean(),
  supportsTools: z.boolean(),
  supportsThinking: z.boolean(),
  supportsVision: z.boolean(),
  health: z.enum(["healthy", "degraded", "offline"]),
});

export const HermesHealthSchema = z.object({
  status: z.enum(["healthy", "degraded", "offline"]),
  gateway: z.object({
    reachable: z.boolean(),
    latencyMs: z.number().nonnegative(),
    version: z.string(),
  }),
  model: z.object({
    reachable: z.boolean(),
    provider: z.string(),
    model: z.string(),
  }),
  memory: z.object({
    enabled: z.boolean(),
    provider: z.string(),
  }),
  updatedAt: z.string(),
});

export const HermesMemorySchema = z.object({
  enabled: z.boolean(),
  provider: z.string(),
  entryCount: z.number().nonnegative().optional(),
  updatedAt: z.string().optional(),
});

export const HermesConfigSchema = z.object({
  activeModel: z.string(),
  provider: z.string(),
  skillsEnabled: z.number().nonnegative(),
  skillsTotal: z.number().nonnegative(),
  memoryEnabled: z.boolean(),
});
