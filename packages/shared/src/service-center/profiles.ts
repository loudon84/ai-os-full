import { z } from "zod";

export const PROFILE_STATUSES = ["draft", "active", "archived"] as const;
export type ProfileStatus = (typeof PROFILE_STATUSES)[number];

export const profileCreateSchema = z.object({
  workspace_id: z.string().uuid(),
  role_key: z.string().min(1).max(64),
  role_name: z.string().min(1).max(128),
  display_name: z.string().min(1).max(128),
  description: z.string().max(4096).optional().nullable(),
  template_id: z.string().uuid().optional().nullable(),
});

export const profileUpdateSchema = z.object({
  role_name: z.string().min(1).max(128).optional(),
  display_name: z.string().min(1).max(128).optional(),
  description: z.string().max(4096).optional().nullable(),
  status: z.enum(PROFILE_STATUSES).optional(),
});

export const profileTemplateCreateSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(128),
  description: z.string().max(4096).optional().nullable(),
  default_model_config: z.record(z.unknown()).optional().default({}),
  default_tools: z.array(z.record(z.unknown())).optional().default([]),
  default_policy: z.record(z.unknown()).optional().default({}),
});

export const profileManifestSchema = z.object({
  profile_id: z.string(),
  workspace_id: z.string().uuid(),
  role_key: z.string(),
  role_name: z.string(),
  display_name: z.string(),
  description: z.string(),
  model_config: z.record(z.unknown()),
  tools: z.array(
    z.object({
      tool_key: z.string(),
      enabled: z.boolean(),
      permission_scope: z.array(z.string()),
    }),
  ),
  skills: z.array(
    z.object({
      skill_id: z.string(),
      version_id: z.string(),
      enabled: z.boolean(),
    }),
  ),
  mcp_servers: z.array(
    z.object({
      server_id: z.string(),
      enabled: z.boolean(),
    }),
  ),
  policy: z.object({
    allow_file_write: z.boolean(),
    allow_shell: z.boolean(),
    require_approval_risk_level: z.string(),
  }),
});

export type ProfileManifest = z.infer<typeof profileManifestSchema>;

export const profileIdParamSchema = z.object({
  profile_id: z.string().uuid(),
});

export const profileTemplateIdParamSchema = z.object({
  template_id: z.string().uuid(),
});
