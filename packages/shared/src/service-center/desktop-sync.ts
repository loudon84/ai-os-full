import { z } from "zod";

export const desktopRegisterSchema = z.object({
  workspace_id: z.string().uuid(),
  client_name: z.string().min(1).max(128).optional().nullable(),
  desktop_version: z.string().max(64).optional().nullable(),
  copilot_serve_version: z.string().max(64).optional().nullable(),
  platform: z.string().max(32).optional().nullable(),
  arch: z.string().max(32).optional().nullable(),
});

export const desktopBootstrapSchema = z.object({
  client_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  user_id: z.string().uuid(),
  desktop_version: z.string().max(64).optional().nullable(),
  copilot_serve_version: z.string().max(64).optional().nullable(),
  platform: z.string().max(32).optional().nullable(),
  arch: z.string().max(32).optional().nullable(),
});

export const desktopSyncSchema = z.object({
  client_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  sync_cursor: z.string().optional().nullable(),
});

export const desktopHeartbeatSchema = z.object({
  client_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  status_summary: z.record(z.unknown()).optional().default({}),
});

export const desktopClientIdParamSchema = z.object({
  client_id: z.string().uuid(),
});

export const bootstrapResponseSchema = z.object({
  workspace: z.object({
    workspace_id: z.string(),
    name: z.string(),
  }),
  api: z.object({
    backend_base_url: z.string(),
    team_task_poll_interval_seconds: z.number(),
  }),
  profiles: z.array(z.record(z.unknown())),
  skills: z.array(z.record(z.unknown())),
  plugins: z.array(z.record(z.unknown())),
  mcp_servers: z.array(z.record(z.unknown())),
  workspace_policy: z.object({
    allowed_workspace_roots: z.array(z.string()),
    require_approval_risk_level: z.string(),
    bound_rules: z
      .array(
        z.object({
          rule_key: z.string(),
          rule_type: z.string(),
          source: z.enum(["workspace", "desktop_client"]),
        }),
      )
      .optional()
      .default([]),
  }),
  sync_cursor: z.string(),
});

export type BootstrapResponse = z.infer<typeof bootstrapResponseSchema>;
