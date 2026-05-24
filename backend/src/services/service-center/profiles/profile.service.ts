import type { ProfileManifest } from "@portal/shared";
import { profileManifestSchema } from "@portal/shared";

import type { AgentProfile, agentProfileTemplates } from "@portal/db";

type AgentProfileTemplate = typeof agentProfileTemplates.$inferSelect;
import type { Db } from "@portal/db";

import { notFound } from "../../../errors.js";
import { publishDomainEvent } from "../../../events/publish-domain-event.js";
import type { RequestContext } from "../../../middleware/auth.js";
import type { AuditService } from "../../audit/audit-service.js";
import { ProfileRepository } from "./profile.repository.js";

const RUNTIME_KEYS = new Set([
  "pid",
  "port",
  "gateway_port",
  "local_port",
  "process_id",
  "gateway_pid",
]);

function stripRuntimeFields(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (RUNTIME_KEYS.has(key)) continue;
    result[key] = value;
  }
  return result;
}

export function buildProfileManifest(input: {
  profile: Pick<
    AgentProfile,
  "id" | "workspaceId" | "roleKey" | "roleName" | "displayName" | "description"
  >;
  modelConfig: Record<string, unknown>;
  tools: Array<{
    tool_key: string;
    enabled: boolean;
    permission_scope: string[];
  }>;
  skills: Array<{
    skill_id: string;
    version_id: string;
    enabled: boolean;
  }>;
  mcpServers: Array<{
    server_id: string;
    enabled: boolean;
  }>;
  policy: {
    allow_file_write: boolean;
    allow_shell: boolean;
    require_approval_risk_level: string;
  };
}): ProfileManifest {
  const manifest = {
    profile_id: input.profile.id,
    workspace_id: input.profile.workspaceId,
    role_key: input.profile.roleKey,
    role_name: input.profile.roleName,
    display_name: input.profile.displayName,
    description: input.profile.description ?? "",
    model_config: stripRuntimeFields(input.modelConfig),
    tools: input.tools,
    skills: input.skills,
    mcp_servers: input.mcpServers,
    policy: input.policy,
  };
  return profileManifestSchema.parse(manifest);
}

function toProfileDto(profile: AgentProfile) {
  return {
    profile_id: profile.id,
    workspace_id: profile.workspaceId,
    role_key: profile.roleKey,
    role_name: profile.roleName,
    display_name: profile.displayName,
    description: profile.description,
    template_id: profile.templateId,
    status: profile.status,
    created_by_user_id: profile.createdByUserId,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString(),
  };
}

function toTemplateDto(template: AgentProfileTemplate) {
  return {
    template_id: template.id,
    workspace_id: template.workspaceId,
    name: template.name,
    description: template.description,
    default_model_config: template.defaultModelConfig,
    default_tools: template.defaultTools,
    default_policy: template.defaultPolicy,
    status: template.status,
    published_at: template.publishedAt?.toISOString() ?? null,
    created_by_user_id: template.createdByUserId,
    created_at: template.createdAt.toISOString(),
    updated_at: template.updatedAt.toISOString(),
  };
}

function defaultifiablePolicy(input: Record<string, unknown>) {
  return {
    allow_file_write: Boolean(input.allow_file_write ?? false),
    allow_shell: Boolean(input.allow_shell ?? false),
    require_approval_risk_level: String(
      input.require_approval_risk_level ?? "high",
    ),
  };
}

export class ProfileService {
  private readonly repo = new ProfileRepository();

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
      targetType: "agent_profile",
      targetId,
      result: "success",
      metadata,
    });
  }

  async listProfiles(ctx: RequestContext, workspaceId: string) {
    const items = await this.repo.listProfiles(this.db, workspaceId);
    return { items: items.map(toProfileDto) };
  }

  async getProfile(ctx: RequestContext, profileId: string, workspaceId: string) {
    const profile = await this.repo.getProfile(this.db, profileId, workspaceId);
    if (!profile) notFound("Profile not found");
    return toProfileDto(profile);
  }

  async createProfile(
    ctx: RequestContext,
    input: {
      workspace_id: string;
      role_key: string;
      role_name: string;
      display_name: string;
      description?: string | null;
      template_id?: string | null;
    },
  ) {
    let modelConfig: Record<string, unknown> = {};
    let defaultTools: unknown[] = [];
    let defaultPolicy: Record<string, unknown> = {};

    if (input.template_id) {
      const template = await this.repo.getTemplate(
        this.db,
        input.template_id,
        input.workspace_id,
      );
      if (!template) notFound("Profile template not found");
      modelConfig = template.defaultModelConfig;
      defaultTools = template.defaultTools;
      defaultPolicy = template.defaultPolicy;
    }

    const profile = await this.repo.createProfile(this.db, {
      workspaceId: input.workspace_id,
      roleKey: input.role_key,
      roleName: input.role_name,
      displayName: input.display_name,
      description: input.description ?? null,
      templateId: input.template_id ?? null,
      status: "active",
      createdByUserId: ctx.userId,
    });

    if (Object.keys(modelConfig).length > 0) {
      await this.repo.upsertConfig(this.db, {
        profileId: profile.id,
        workspaceId: input.workspace_id,
        configKey: "model_config",
        configValue: modelConfig,
      });
    }

    if (defaultTools.length > 0) {
      await this.repo.upsertConfig(this.db, {
        profileId: profile.id,
        workspaceId: input.workspace_id,
        configKey: "tools",
        configValue: { tools: defaultTools },
      });
    }

    if (Object.keys(defaultPolicy).length > 0) {
      await this.repo.upsertConfig(this.db, {
        profileId: profile.id,
        workspaceId: input.workspace_id,
        configKey: "policy",
        configValue: defaultPolicy,
      });
    }

    this.audit(ctx, "profile.created", profile.id);
    await publishDomainEvent("profile.created", input.workspace_id, {
      profile_id: profile.id,
    });
    return toProfileDto(profile);
  }

  async updateProfile(
    ctx: RequestContext,
    profileId: string,
    workspaceId: string,
    input: {
      role_name?: string;
      display_name?: string;
      description?: string | null;
      status?: string;
    },
  ) {
    const profile = await this.repo.updateProfile(
      this.db,
      profileId,
      workspaceId,
      {
        roleName: input.role_name,
        displayName: input.display_name,
        description: input.description,
        status: input.status,
      },
    );
    if (!profile) notFound("Profile not found");
    this.audit(ctx, "profile.updated", profileId, input);
    await publishDomainEvent("profile.updated", workspaceId, {
      profile_id: profileId,
    });
    return toProfileDto(profile);
  }

  async deleteProfile(
    ctx: RequestContext,
    profileId: string,
    workspaceId: string,
  ) {
    const profile = await this.repo.deleteProfile(
      this.db,
      profileId,
      workspaceId,
    );
    if (!profile) notFound("Profile not found");
    this.audit(ctx, "profile.deleted", profileId);
    return toProfileDto(profile);
  }

  async listTemplates(ctx: RequestContext, workspaceId: string) {
    const items = await this.repo.listTemplates(this.db, workspaceId);
    return { items: items.map(toTemplateDto) };
  }

  async getTemplate(
    ctx: RequestContext,
    templateId: string,
    workspaceId: string,
  ) {
    const template = await this.repo.getTemplate(
      this.db,
      templateId,
      workspaceId,
    );
    if (!template) notFound("Profile template not found");
    return toTemplateDto(template);
  }

  async createTemplate(
    ctx: RequestContext,
    input: {
      workspace_id: string;
      name: string;
      description?: string | null;
      default_model_config?: Record<string, unknown>;
      default_tools?: unknown[];
      default_policy?: Record<string, unknown>;
    },
  ) {
    const template = await this.repo.createTemplate(this.db, {
      workspaceId: input.workspace_id,
      name: input.name,
      description: input.description ?? null,
      defaultModelConfig: input.default_model_config ?? {},
      defaultTools: input.default_tools ?? [],
      defaultPolicy: input.default_policy ?? {},
      status: "draft",
      createdByUserId: ctx.userId,
    });
    this.audit(ctx, "profile_template.created", template.id);
    return toTemplateDto(template);
  }

  async publishTemplate(
    ctx: RequestContext,
    templateId: string,
    workspaceId: string,
  ) {
    const template = await this.repo.publishTemplate(
      this.db,
      templateId,
      workspaceId,
    );
    if (!template) notFound("Profile template not found");
    this.audit(ctx, "profile_template.published", templateId);
    return toTemplateDto(template);
  }

  async assembleManifest(profileId: string, workspaceId: string) {
    const profile = await this.repo.getProfile(this.db, profileId, workspaceId);
    if (!profile) notFound("Profile not found");

    const configs = await this.repo.listConfigs(this.db, profileId, workspaceId);
    const skills = await this.repo.listProfileSkills(
      this.db,
      profileId,
      workspaceId,
    );
    const mcpServers = await this.repo.listProfileMcpServers(
      this.db,
      profileId,
      workspaceId,
    );
    const policyRules = await this.repo.listProfilePolicyRules(
      this.db,
      profileId,
      workspaceId,
    );

    let modelConfig: Record<string, unknown> = {};
    let tools: Array<{
      tool_key: string;
      enabled: boolean;
      permission_scope: string[];
    }> = [];
    let policy: Record<string, unknown> = {};

    for (const cfg of configs) {
      if (cfg.configKey === "model_config") {
        modelConfig = cfg.configValue;
      } else if (cfg.configKey === "tools") {
        const raw = cfg.configValue.tools;
        if (Array.isArray(raw)) {
          tools = raw.map((t) => {
            const item = t as Record<string, unknown>;
            return {
              tool_key: String(item.tool_key ?? ""),
              enabled: Boolean(item.enabled ?? true),
              permission_scope: Array.isArray(item.permission_scope)
                ? (item.permission_scope as string[])
                : [],
            };
          });
        }
      } else if (cfg.configKey === "policy") {
        policy = cfg.configValue;
      }
    }

    for (const rule of policyRules) {
      policy[rule.ruleKey] = rule.ruleValue;
    }

    return buildProfileManifest({
      profile,
      modelConfig,
      tools,
      skills: skills.map((s) => ({
        skill_id: s.skillId,
        version_id: s.versionId ?? "",
        enabled: s.enabled,
      })),
      mcpServers: mcpServers.map((s) => ({
        server_id: s.serverId,
        enabled: s.enabled,
      })),
      policy: defaultifiablePolicy(policy),
    });
  }

  async getManifest(
    ctx: RequestContext,
    profileId: string,
    workspaceId: string,
  ) {
    const stored = await this.repo.getLatestManifest(
      this.db,
      profileId,
      workspaceId,
    );
    if (stored) {
      return {
        manifest: stored.manifest,
        version: stored.version,
        updated_at: stored.updatedAt.toISOString(),
      };
    }
    const manifest = await this.assembleManifest(profileId, workspaceId);
    return { manifest, version: 0, updated_at: null };
  }

  async regenerateManifest(
    ctx: RequestContext,
    profileId: string,
    workspaceId: string,
  ) {
    const manifest = await this.assembleManifest(profileId, workspaceId);
    const latest = await this.repo.getLatestManifest(
      this.db,
      profileId,
      workspaceId,
    );
    const version = (latest?.version ?? 0) + 1;
    const saved = await this.repo.saveManifest(this.db, {
      profileId,
      workspaceId,
      manifest: manifest as unknown as Record<string, unknown>,
      version,
    });
    this.audit(ctx, "profile.manifest.regenerated", profileId, { version });
    return {
      manifest,
      version: saved.version,
      updated_at: saved.updatedAt.toISOString(),
    };
  }
}
