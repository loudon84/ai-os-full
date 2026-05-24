import { z } from "zod";

export const CONNECTOR_TYPES = ["feishu", "slack", "oa", "webhook", "custom"] as const;

export const connectorCreateSchema = z.object({
  workspace_id: z.string().uuid(),
  connector_key: z.string().min(1).max(64),
  connector_type: z.enum(CONNECTOR_TYPES),
  name: z.string().min(1).max(128),
  webhook_secret_ref: z.string().max(256).optional().nullable(),
  config: z.record(z.unknown()).optional().default({}),
});

export const connectorUpdateSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  webhook_secret_ref: z.string().max(256).optional().nullable(),
  config: z.record(z.unknown()).optional(),
  enabled: z.boolean().optional(),
});

export const connectorWebhookPayloadSchema = z.object({
  title: z.string().min(1).max(512),
  description: z.string().max(4096).optional().nullable(),
  task_type: z.string().optional(),
  risk_level: z.string().optional(),
  assignee_user_id: z.string().uuid().optional().nullable(),
  target_profile_id: z.string().optional().nullable(),
  workspace_path: z.string().optional().nullable(),
  input: z.record(z.unknown()).optional().default({}),
});

export const connectorIdParamSchema = z.object({
  connector_id: z.string().uuid(),
});

export const connectorKeyParamSchema = z.object({
  connector_key: z.string().min(1).max(64),
});
