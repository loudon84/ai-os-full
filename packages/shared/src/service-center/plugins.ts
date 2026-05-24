import { z } from "zod";

export const PLUGIN_TYPES = [
  "hermes_plugin",
  "memory_provider",
  "model_provider",
  "tool_provider",
  "connector",
  "desktop_extension",
] as const;

export const PLUGIN_RUNTIMES = ["hermes", "copilot-serve", "backend", "desktop"] as const;

export const pluginCreateSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(128),
  plugin_type: z.enum(PLUGIN_TYPES),
  runtime: z.enum(PLUGIN_RUNTIMES),
  entrypoint: z.string().min(1).max(512),
  required_permissions: z.array(z.string()).optional().default([]),
  config_schema: z.record(z.unknown()).optional().default({}),
  compatible_profiles: z.array(z.string()).optional().default([]),
});

export const pluginUpdateSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  entrypoint: z.string().min(1).max(512).optional(),
  required_permissions: z.array(z.string()).optional(),
  config_schema: z.record(z.unknown()).optional(),
  compatible_profiles: z.array(z.string()).optional(),
});

export const pluginVersionCreateSchema = z.object({
  version: z.string().min(1).max(64),
  checksum: z.string().min(1).max(128),
  manifest: z.record(z.unknown()).optional().default({}),
});

export const pluginInstallSchema = z.object({
  profile_id: z.string().uuid().optional().nullable(),
  version_id: z.string().uuid().optional().nullable(),
});

export const pluginManifestSchema = z.object({
  plugin_id: z.string(),
  name: z.string(),
  version: z.string(),
  plugin_type: z.string(),
  runtime: z.string(),
  entrypoint: z.string(),
  required_permissions: z.array(z.string()),
  config_schema: z.record(z.unknown()),
  compatible_profiles: z.array(z.string()),
  checksum: z.string(),
});

export type PluginManifest = z.infer<typeof pluginManifestSchema>;

export const pluginIdParamSchema = z.object({
  plugin_id: z.string().uuid(),
});
