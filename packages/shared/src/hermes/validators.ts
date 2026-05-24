import { z } from "zod";

import {
  HERMES_CONTEXT_REF_TYPES,
  HERMES_GATEWAY_AUTH_MODES,
  HERMES_GATEWAY_TYPES,
  HERMES_RUN_EVENT_TYPES,
  HERMES_RUN_TYPES,
  PROMPT_TEMPLATE_SCENES,
} from "./constants";

const contextRefSchema = z.object({
  type: z.enum(HERMES_CONTEXT_REF_TYPES).or(z.string().min(1)),
  id: z.string().min(1),
});

export const hermesChatSchema = z.object({
  workspace_id: z.string().uuid().optional(),
  user_message: z.string().min(1),
  session_id: z.string().optional().nullable(),
  template_id: z.string().uuid().optional().nullable(),
  context_refs: z.array(contextRefSchema).optional().default([]),
  token_budget: z.number().int().positive().optional().default(12000),
  input: z.record(z.unknown()).optional().default({}),
});

export const hermesRunListQuerySchema = z.object({
  workspace_id: z.string().uuid().optional(),
  status: z.string().optional(),
  run_type: z.enum(HERMES_RUN_TYPES).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().optional(),
});

export const hermesRunEventsQuerySchema = z.object({
  after_seq: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
});

export const hermesGatewayCreateSchema = z.object({
  workspace_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(128),
  gateway_type: z.enum(HERMES_GATEWAY_TYPES),
  base_url: z.string().url(),
  auth_mode: z.enum(HERMES_GATEWAY_AUTH_MODES).optional().default("none"),
  auth_token: z.string().optional().nullable(),
  model_capabilities: z.record(z.unknown()).optional().default({}),
  tool_capabilities: z.record(z.unknown()).optional().default({}),
});

export const hermesGatewayUpdateSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  base_url: z.string().url().optional(),
  auth_mode: z.enum(HERMES_GATEWAY_AUTH_MODES).optional(),
  auth_token: z.string().optional().nullable(),
  status: z.enum(["unknown", "healthy", "unhealthy", "disabled"]).optional(),
  model_capabilities: z.record(z.unknown()).optional(),
  tool_capabilities: z.record(z.unknown()).optional(),
});

export const promptTemplateCreateSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(128),
  scene: z.enum(PROMPT_TEMPLATE_SCENES).or(z.string().min(1)),
  description: z.string().max(4096).optional().nullable(),
  body: z.string().min(1),
  variables: z.array(z.string()).optional().default([]),
});

export const promptTemplateUpdateSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  scene: z.enum(PROMPT_TEMPLATE_SCENES).or(z.string().min(1)).optional(),
  description: z.string().max(4096).optional().nullable(),
  enabled: z.boolean().optional(),
});

export const promptTemplateRenderSchema = z.object({
  variables: z.record(z.union([z.string(), z.number(), z.boolean()])).optional().default({}),
});

export const hermesToolCallApproveSchema = z.object({
  reason: z.string().max(4096).optional(),
});

export const hermesToolCallRejectSchema = z.object({
  reason: z.string().min(1).max(4096),
});

export const hermesToolDispatchSchema = z.object({
  run_id: z.string().uuid(),
  workspace_id: z.string().uuid().optional(),
  tool_name: z.string().min(1).max(128),
  tool_action: z.string().min(1).max(128),
  payload: z.record(z.unknown()).optional().default({}),
});

export const taskReplayQuerySchema = z.object({
  workspace_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(200),
});

export const hermesRunEventTypeSchema = z.enum(HERMES_RUN_EVENT_TYPES);
