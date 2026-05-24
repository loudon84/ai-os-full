import type { PluginManifest } from "@portal/shared";
import { pluginManifestSchema } from "@portal/shared";

import type { PluginManifest as PluginRow, pluginVersions } from "@portal/db";

type PluginVersion = typeof pluginVersions.$inferSelect;
import type { Db } from "@portal/db";

import { notFound } from "../../../errors.js";
import type { RequestContext } from "../../../middleware/auth.js";
import type { AuditService } from "../../audit/audit-service.js";
import { PluginRepository } from "./plugin.repository.js";

export function buildPluginManifest(input: {
  plugin: Pick<
    PluginRow,
    | "id"
    | "name"
    | "pluginType"
    | "runtime"
    | "entrypoint"
    | "requiredPermissions"
    | "configSchema"
    | "compatibleProfiles"
  >;
  version: Pick<PluginVersion, "version" | "checksum">;
}): PluginManifest {
  return pluginManifestSchema.parse({
    plugin_id: input.plugin.id,
    name: input.plugin.name,
    version: input.version.version,
    plugin_type: input.plugin.pluginType,
    runtime: input.plugin.runtime,
    entrypoint: input.plugin.entrypoint,
    required_permissions: input.plugin.requiredPermissions,
    config_schema: input.plugin.configSchema,
    compatible_profiles: input.plugin.compatibleProfiles,
    checksum: input.version.checksum,
  });
}

function toPluginDto(plugin: PluginRow) {
  return {
    plugin_id: plugin.id,
    workspace_id: plugin.workspaceId,
    name: plugin.name,
    plugin_type: plugin.pluginType,
    runtime: plugin.runtime,
    entrypoint: plugin.entrypoint,
    required_permissions: plugin.requiredPermissions,
    config_schema: plugin.configSchema,
    compatible_profiles: plugin.compatibleProfiles,
    enabled: plugin.enabled,
    created_by_user_id: plugin.createdByUserId,
    created_at: plugin.createdAt.toISOString(),
    updated_at: plugin.updatedAt.toISOString(),
  };
}

function toVersionDto(version: PluginVersion) {
  return {
    version_id: version.id,
    plugin_id: version.pluginId,
    workspace_id: version.workspaceId,
    version: version.version,
    checksum: version.checksum,
    manifest: version.manifest,
    created_at: version.createdAt.toISOString(),
  };
}

export class PluginService {
  private readonly repo = new PluginRepository();

  constructor(
    private readonly db: Db,
    private readonly auditService: AuditService,
  ) {}

  private audit(
    ctx: RequestContext,
    action: string,
    targetId: string,
    metadata: Record<string, unknown> = {},
  ) {
    this.auditService.emit({
      workspaceId: ctx.workspaceId,
      actorUserId: ctx.userId,
      action,
      targetType: "plugin",
      targetId,
      result: "success",
      metadata,
    });
  }

  async listPlugins(ctx: RequestContext, workspaceId: string) {
    const items = await this.repo.listPlugins(this.db, workspaceId);
    return { items: items.map(toPluginDto) };
  }

  async getPlugin(ctx: RequestContext, pluginId: string, workspaceId: string) {
    const plugin = await this.repo.getPlugin(this.db, pluginId, workspaceId);
    if (!plugin) notFound("Plugin not found");
    return toPluginDto(plugin);
  }

  async createPlugin(
    ctx: RequestContext,
    input: {
      workspace_id: string;
      name: string;
      plugin_type: string;
      runtime: string;
      entrypoint: string;
      required_permissions?: string[];
      config_schema?: Record<string, unknown>;
      compatible_profiles?: string[];
    },
  ) {
    const plugin = await this.repo.createPlugin(this.db, {
      workspaceId: input.workspace_id,
      name: input.name,
      pluginType: input.plugin_type,
      runtime: input.runtime,
      entrypoint: input.entrypoint,
      requiredPermissions: input.required_permissions ?? [],
      configSchema: input.config_schema ?? {},
      compatibleProfiles: input.compatible_profiles ?? [],
      enabled: true,
      createdByUserId: ctx.userId,
    });

    if (input.required_permissions?.length) {
      await this.repo.syncPermissionDeclarations(
        this.db,
        plugin.id,
        input.workspace_id,
        input.required_permissions,
      );
    }

    this.audit(ctx, "plugin.created", plugin.id);
    return toPluginDto(plugin);
  }

  async updatePlugin(
    ctx: RequestContext,
    pluginId: string,
    workspaceId: string,
    input: {
      name?: string;
      entrypoint?: string;
      required_permissions?: string[];
      config_schema?: Record<string, unknown>;
      compatible_profiles?: string[];
    },
  ) {
    const plugin = await this.repo.updatePlugin(this.db, pluginId, workspaceId, {
      name: input.name,
      entrypoint: input.entrypoint,
      requiredPermissions: input.required_permissions,
      configSchema: input.config_schema,
      compatibleProfiles: input.compatible_profiles,
    });
    if (!plugin) notFound("Plugin not found");

    if (input.required_permissions) {
      await this.repo.syncPermissionDeclarations(
        this.db,
        pluginId,
        workspaceId,
        input.required_permissions,
      );
    }

    this.audit(ctx, "plugin.updated", pluginId, input);
    return toPluginDto(plugin);
  }

  async deletePlugin(
    ctx: RequestContext,
    pluginId: string,
    workspaceId: string,
  ) {
    const plugin = await this.repo.deletePlugin(this.db, pluginId, workspaceId);
    if (!plugin) notFound("Plugin not found");
    this.audit(ctx, "plugin.deleted", pluginId);
    return toPluginDto(plugin);
  }

  async listVersions(ctx: RequestContext, pluginId: string, workspaceId: string) {
    const plugin = await this.repo.getPlugin(this.db, pluginId, workspaceId);
    if (!plugin) notFound("Plugin not found");
    const items = await this.repo.listVersions(this.db, pluginId, workspaceId);
    return { items: items.map(toVersionDto) };
  }

  async createVersion(
    ctx: RequestContext,
    pluginId: string,
    workspaceId: string,
    input: {
      version: string;
      checksum: string;
      manifest?: Record<string, unknown>;
    },
  ) {
    const plugin = await this.repo.getPlugin(this.db, pluginId, workspaceId);
    if (!plugin) notFound("Plugin not found");

    const version = await this.repo.createVersion(this.db, {
      pluginId,
      workspaceId,
      version: input.version,
      checksum: input.checksum,
      manifest: input.manifest ?? {},
    });

    this.audit(ctx, "plugin.version.created", version.id, { plugin_id: pluginId });
    return toVersionDto(version);
  }

  async installPlugin(
    ctx: RequestContext,
    pluginId: string,
    workspaceId: string,
    input: { profile_id?: string | null; version_id?: string | null },
  ) {
    const plugin = await this.repo.getPlugin(this.db, pluginId, workspaceId);
    if (!plugin) notFound("Plugin not found");

    let versionId = input.version_id ?? null;
    if (!versionId) {
      const latest = await this.repo.getLatestVersion(this.db, pluginId, workspaceId);
      versionId = latest?.id ?? null;
    }

    const record = await this.repo.insertInstallRecord(this.db, {
      pluginId,
      versionId,
      profileId: input.profile_id ?? null,
      workspaceId,
      installedByUserId: ctx.userId,
    });

    this.audit(ctx, "plugin.installed", pluginId, {
      profile_id: input.profile_id,
      version_id: versionId,
    });

    return {
      install_id: record.id,
      plugin_id: pluginId,
      version_id: versionId,
      profile_id: input.profile_id ?? null,
      installed_at: record.createdAt.toISOString(),
    };
  }

  async setEnabled(
    ctx: RequestContext,
    pluginId: string,
    workspaceId: string,
    enabled: boolean,
  ) {
    const plugin = await this.repo.updatePlugin(this.db, pluginId, workspaceId, {
      enabled,
    });
    if (!plugin) notFound("Plugin not found");
    this.audit(ctx, enabled ? "plugin.enabled" : "plugin.disabled", pluginId);
    return toPluginDto(plugin);
  }

  async buildManifest(
    pluginId: string,
    workspaceId: string,
    versionId?: string,
  ): Promise<PluginManifest> {
    const plugin = await this.repo.getPlugin(this.db, pluginId, workspaceId);
    if (!plugin) notFound("Plugin not found");

    let version: PluginVersion | null = null;
    if (versionId) {
      const versions = await this.repo.listVersions(this.db, pluginId, workspaceId);
      version = versions.find((v) => v.id === versionId) ?? null;
    } else {
      version = await this.repo.getLatestVersion(this.db, pluginId, workspaceId);
    }

    if (!version) notFound("Plugin version not found");

    return buildPluginManifest({ plugin, version });
  }
}
