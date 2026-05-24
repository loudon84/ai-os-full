import { z } from "zod";

export const SKILL_TYPES = [
  "prompt_skill",
  "tool_skill",
  "workflow_skill",
  "role_source_skill",
  "document_skill",
  "email_skill",
  "code_skill",
  "mcp_tool_skill",
] as const;
export type SkillType = (typeof SKILL_TYPES)[number];

export const SKILL_STATUSES = ["draft", "published", "archived"] as const;

export const skillTemplateCreateSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(128),
  description: z.string().max(4096).optional().nullable(),
  category: z.string().max(64).optional().nullable(),
  skill_type: z.enum(SKILL_TYPES),
});

export const skillTemplateUpdateSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(4096).optional().nullable(),
  category: z.string().max(64).optional().nullable(),
});

export const skillVersionCreateSchema = z.object({
  entry_file: z.string().min(1).max(512),
  files: z
    .array(
      z.object({
        path: z.string(),
        checksum: z.string(),
        content_type: z.string(),
      }),
    )
    .optional()
    .default([]),
  variables_schema: z.record(z.unknown()).optional().default({}),
  required_permissions: z.array(z.string()).optional().default([]),
  compatible_profiles: z.array(z.string()).optional().default([]),
});

export const skillInstallSchema = z.object({
  profile_id: z.string().uuid(),
  version_id: z.string().uuid().optional(),
});

export const skillManifestSchema = z.object({
  skill_id: z.string(),
  version_id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  skill_type: z.string(),
  entry_file: z.string(),
  files: z.array(
    z.object({
      path: z.string(),
      checksum: z.string(),
      content_type: z.string(),
    }),
  ),
  required_permissions: z.array(z.string()),
  compatible_profiles: z.array(z.string()),
  variables_schema: z.record(z.unknown()),
  created_at: z.string(),
});

export type SkillManifest = z.infer<typeof skillManifestSchema>;

export const skillIdParamSchema = z.object({
  skill_id: z.string().uuid(),
});

export const skillVersionIdParamSchema = z.object({
  skill_id: z.string().uuid(),
  version_id: z.string().uuid(),
});
