import type { SkillManifest } from "@portal/shared";
import { skillManifestSchema } from "@portal/shared";

import type { SkillTemplate, skillTemplateVersions } from "@portal/db";

type SkillTemplateVersion = typeof skillTemplateVersions.$inferSelect;
import type { Db } from "@portal/db";

import { notFound } from "../../../errors.js";
import type { RequestContext } from "../../../middleware/auth.js";
import type { AuditService } from "../../audit/audit-service.js";
import { SkillRepository } from "./skill.repository.js";

export function buildSkillManifest(input: {
  template: Pick<
    SkillTemplate,
    "id" | "name" | "description" | "category" | "skillType"
  >;
  version: Pick<
    SkillTemplateVersion,
    "id" | "entryFile" | "variablesSchema" | "requiredPermissions" | "compatibleProfiles" | "createdAt"
  >;
  files: Array<{ path: string; checksum: string; content_type: string }>;
}): SkillManifest {
  const manifest = {
    skill_id: input.template.id,
    version_id: input.version.id,
    name: input.template.name,
    description: input.template.description ?? "",
    category: input.template.category ?? "",
    skill_type: input.template.skillType,
    entry_file: input.version.entryFile,
    files: input.files,
    required_permissions: input.version.requiredPermissions,
    compatible_profiles: input.version.compatibleProfiles,
    variables_schema: input.version.variablesSchema,
    created_at: input.version.createdAt.toISOString(),
  };
  return skillManifestSchema.parse({
    skill_id: manifest.skill_id,
    version_id: manifest.version_id,
    name: manifest.name,
    description: manifest.description,
    category: manifest.category,
    skill_type: manifest.skill_type,
    entry_file: manifest.entry_file,
    files: manifest.files,
    required_permissions: manifest.required_permissions,
    compatible_profiles: manifest.compatible_profiles,
    variables_schema: manifest.variables_schema,
    created_at: manifest.created_at,
  });
}

function toTemplateDto(template: SkillTemplate) {
  return {
    skill_id: template.id,
    workspace_id: template.workspaceId,
    name: template.name,
    description: template.description,
    category: template.category,
    skill_type: template.skillType,
    status: template.status,
    created_by_user_id: template.createdByUserId,
    created_at: template.createdAt.toISOString(),
    updated_at: template.updatedAt.toISOString(),
  };
}

function toVersionDto(version: SkillTemplateVersion) {
  return {
    version_id: version.id,
    skill_id: version.skillId,
    workspace_id: version.workspaceId,
    version_no: version.versionNo,
    entry_file: version.entryFile,
    variables_schema: version.variablesSchema,
    required_permissions: version.requiredPermissions,
    compatible_profiles: version.compatibleProfiles,
    status: version.status,
    published_at: version.publishedAt?.toISOString() ?? null,
    created_at: version.createdAt.toISOString(),
  };
}

export class SkillTemplateService {
  private readonly repo = new SkillRepository();

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
      targetType: "skill_template",
      targetId,
      result: "success",
      metadata,
    });
  }

  async listTemplates(ctx: RequestContext, workspaceId: string) {
    const items = await this.repo.listTemplates(this.db, workspaceId);
    return { items: items.map(toTemplateDto) };
  }

  async getTemplate(ctx: RequestContext, skillId: string, workspaceId: string) {
    const template = await this.repo.getTemplate(this.db, skillId, workspaceId);
    if (!template) notFound("Skill template not found");
    return toTemplateDto(template);
  }

  async createTemplate(
    ctx: RequestContext,
    input: {
      workspace_id: string;
      name: string;
      description?: string | null;
      category?: string | null;
      skill_type: string;
    },
  ) {
    const template = await this.repo.createTemplate(this.db, {
      workspaceId: input.workspace_id,
      name: input.name,
      description: input.description ?? null,
      category: input.category ?? null,
      skillType: input.skill_type,
      status: "draft",
      createdByUserId: ctx.userId,
    });
    this.audit(ctx, "skill_template.created", template.id);
    return toTemplateDto(template);
  }

  async updateTemplate(
    ctx: RequestContext,
    skillId: string,
    workspaceId: string,
    input: {
      name?: string;
      description?: string | null;
      category?: string | null;
    },
  ) {
    const template = await this.repo.updateTemplate(
      this.db,
      skillId,
      workspaceId,
      {
        name: input.name,
        description: input.description,
        category: input.category,
      },
    );
    if (!template) notFound("Skill template not found");
    this.audit(ctx, "skill_template.updated", skillId, input);
    return toTemplateDto(template);
  }

  async deleteTemplate(
    ctx: RequestContext,
    skillId: string,
    workspaceId: string,
  ) {
    const template = await this.repo.deleteTemplate(this.db, skillId, workspaceId);
    if (!template) notFound("Skill template not found");
    this.audit(ctx, "skill_template.deleted", skillId);
    return toTemplateDto(template);
  }

  async listVersions(ctx: RequestContext, skillId: string, workspaceId: string) {
    const template = await this.repo.getTemplate(this.db, skillId, workspaceId);
    if (!template) notFound("Skill template not found");
    const items = await this.repo.listVersions(this.db, skillId, workspaceId);
    return { items: items.map(toVersionDto) };
  }

  async createVersion(
    ctx: RequestContext,
    skillId: string,
    workspaceId: string,
    input: {
      entry_file: string;
      files?: Array<{ path: string; checksum: string; content_type: string }>;
      variables_schema?: Record<string, unknown>;
      required_permissions?: string[];
      compatible_profiles?: string[];
    },
  ) {
    const template = await this.repo.getTemplate(this.db, skillId, workspaceId);
    if (!template) notFound("Skill template not found");

    const count = await this.repo.countVersions(this.db, skillId, workspaceId);
    const version = await this.repo.createVersion(
      this.db,
      {
        skillId,
        workspaceId,
        versionNo: `v${count + 1}`,
        entryFile: input.entry_file,
        variablesSchema: input.variables_schema ?? {},
        requiredPermissions: input.required_permissions ?? [],
        compatibleProfiles: input.compatible_profiles ?? [],
        status: "draft",
      },
      input.files ?? [],
    );

    this.audit(ctx, "skill_version.created", version.id, { skill_id: skillId });
    return toVersionDto(version);
  }

  async publishVersion(
    ctx: RequestContext,
    skillId: string,
    versionId: string,
    workspaceId: string,
  ) {
    const version = await this.repo.publishVersion(
      this.db,
      versionId,
      skillId,
      workspaceId,
    );
    if (!version) notFound("Skill version not found");

    await this.repo.insertPublishRecord(this.db, {
      skillId,
      versionId,
      workspaceId,
      publishedByUserId: ctx.userId,
    });

    this.audit(ctx, "skill_version.published", versionId, { skill_id: skillId });
    return toVersionDto(version);
  }

  async installSkill(
    ctx: RequestContext,
    skillId: string,
    workspaceId: string,
    input: { profile_id: string; version_id?: string },
  ) {
    const template = await this.repo.getTemplate(this.db, skillId, workspaceId);
    if (!template) notFound("Skill template not found");

    let versionId = input.version_id;
    if (!versionId) {
      const latest = await this.repo.getLatestPublishedVersion(
        this.db,
        skillId,
        workspaceId,
      );
      if (!latest) notFound("No published skill version found");
      versionId = latest.id;
    }

    const version = await this.repo.getVersion(this.db, versionId, workspaceId);
    if (!version || version.skillId !== skillId) {
      notFound("Skill version not found");
    }

    const record = await this.repo.insertInstallRecord(this.db, {
      skillId,
      versionId,
      profileId: input.profile_id,
      workspaceId,
      installedByUserId: ctx.userId,
    });

    await this.repo.upsertProfileBinding(this.db, {
      skillId,
      profileId: input.profile_id,
      workspaceId,
      enabled: true,
    });

    this.audit(ctx, "skill.installed", skillId, {
      profile_id: input.profile_id,
      version_id: versionId,
    });

    return {
      install_id: record.id,
      skill_id: skillId,
      version_id: versionId,
      profile_id: input.profile_id,
      installed_at: record.createdAt.toISOString(),
    };
  }

  async listInstallRecords(ctx: RequestContext, workspaceId: string) {
    const items = await this.repo.listInstallRecords(this.db, workspaceId);
    return {
      items: items.map((r) => ({
        install_id: r.id,
        skill_id: r.skillId,
        version_id: r.versionId,
        profile_id: r.profileId,
        workspace_id: r.workspaceId,
        installed_by_user_id: r.installedByUserId,
        installed_at: r.createdAt.toISOString(),
      })),
    };
  }

  async buildManifest(
    skillId: string,
    versionId: string,
    workspaceId: string,
  ): Promise<SkillManifest> {
    const template = await this.repo.getTemplate(this.db, skillId, workspaceId);
    if (!template) notFound("Skill template not found");

    const version = await this.repo.getVersion(this.db, versionId, workspaceId);
    if (!version || version.skillId !== skillId) {
      notFound("Skill version not found");
    }

    const fileRows = await this.repo.listVersionFiles(
      this.db,
      versionId,
      workspaceId,
    );

    return buildSkillManifest({
      template,
      version,
      files: fileRows.map((f) => ({
        path: f.path,
        checksum: f.checksum,
        content_type: f.contentType,
      })),
    });
  }
}
