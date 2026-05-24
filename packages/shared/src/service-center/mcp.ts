import { z } from "zod";

import { TEAM_TASK_RISK_LEVELS } from "../team-tasks/constants";

export const MCP_SERVER_TYPES = [
  "backend_builtin",
  "copilot_serve_local",
  "remote_http",
  "stdio_template",
] as const;

export const mcpServerCreateSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(128),
  server_type: z.enum(MCP_SERVER_TYPES),
  base_url: z.string().url().optional().nullable(),
  config: z.record(z.unknown()).optional().default({}),
});

export const mcpServerUpdateSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  base_url: z.string().url().optional().nullable(),
  config: z.record(z.unknown()).optional(),
  enabled: z.boolean().optional(),
});

export const mcpToolCreateSchema = z.object({
  server_id: z.string().uuid(),
  name: z.string().min(1).max(128),
  description: z.string().max(4096).optional().nullable(),
  input_schema: z.record(z.unknown()).optional().default({}),
  output_schema: z.record(z.unknown()).optional().nullable(),
  required_permissions: z.array(z.string()).optional().default([]),
  risk_level: z.enum(TEAM_TASK_RISK_LEVELS).default("low"),
  enabled: z.boolean().optional(),
});

export const mcpToolUpdateSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(4096).optional().nullable(),
  input_schema: z.record(z.unknown()).optional(),
  output_schema: z.record(z.unknown()).optional().nullable(),
  required_permissions: z.array(z.string()).optional(),
  risk_level: z.enum(TEAM_TASK_RISK_LEVELS).optional(),
  enabled: z.boolean().optional(),
});

export const mcpProfileBindSchema = z.object({
  enabled: z.boolean().optional().default(true),
});

export const mcpToolManifestSchema = z.object({
  tool_id: z.string(),
  server_id: z.string(),
  name: z.string(),
  description: z.string(),
  input_schema: z.record(z.unknown()),
  output_schema: z.record(z.unknown()).optional().nullable(),
  required_permissions: z.array(z.string()),
  risk_level: z.string(),
  enabled: z.boolean(),
});

export type McpToolManifest = z.infer<typeof mcpToolManifestSchema>;

export const mcpServerIdParamSchema = z.object({
  server_id: z.string().uuid(),
});

export const mcpToolIdParamSchema = z.object({
  tool_id: z.string().uuid(),
});
