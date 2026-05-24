import type { PromptTemplateDto } from "@portal/shared";

import type { Db } from "@portal/db";

import { notFound } from "../../errors.js";
import type { RequestContext } from "../../middleware/auth.js";
import { HermesRepository } from "./hermes.repository.js";

function renderTemplateBody(body: string, variables: Record<string, string | number | boolean>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = variables[key];
    return value === undefined ? "" : String(value);
  });
}

function toTemplateDto(row: {
  id: string;
  workspaceId: string;
  name: string;
  scene: string;
  description: string | null;
  latestVersionId: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}): PromptTemplateDto {
  return {
    template_id: row.id,
    workspace_id: row.workspaceId,
    name: row.name,
    scene: row.scene,
    description: row.description,
    latest_version_id: row.latestVersionId,
    enabled: row.enabled,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export class PromptTemplateService {
  private readonly repo = new HermesRepository();

  async createTemplate(
    db: Db,
    ctx: RequestContext,
    input: {
      workspace_id: string;
      name: string;
      scene: string;
      description?: string | null;
      body: string;
      variables?: string[];
    },
  ) {
    const template = await this.repo.createPromptTemplate(db, {
      workspaceId: input.workspace_id,
      name: input.name,
      scene: input.scene,
      description: input.description ?? null,
      enabled: true,
      createdByUserId: ctx.userId,
    });

    const version = await this.repo.createPromptTemplateVersion(db, {
      templateId: template.id,
      version: 1,
      body: input.body,
      variables: input.variables ?? [],
      createdByUserId: ctx.userId,
    });

    await this.repo.updatePromptTemplate(db, template.id, input.workspace_id, {
      latestVersionId: version.id,
    });

    return { template: toTemplateDto({ ...template, latestVersionId: version.id }), version };
  }

  async listTemplates(db: Db, workspaceId: string) {
    const rows = await this.repo.listPromptTemplates(db, workspaceId);
    return rows.map(toTemplateDto);
  }

  async getTemplate(db: Db, templateId: string, workspaceId: string) {
    const row = await this.repo.getPromptTemplate(db, templateId, workspaceId);
    if (!row) notFound("Prompt template not found");
    return toTemplateDto(row);
  }

  async updateTemplate(
    db: Db,
    templateId: string,
    workspaceId: string,
    patch: {
      name?: string;
      scene?: string;
      description?: string | null;
      enabled?: boolean;
    },
  ) {
    const row = await this.repo.updatePromptTemplate(db, templateId, workspaceId, {
      name: patch.name,
      scene: patch.scene,
      description: patch.description,
      enabled: patch.enabled,
    });
    if (!row) notFound("Prompt template not found");
    return toTemplateDto(row);
  }

  async renderTemplate(
    db: Db,
    templateId: string,
    workspaceId: string,
    variables: Record<string, string | number | boolean>,
  ) {
    const template = await this.repo.getPromptTemplate(db, templateId, workspaceId);
    if (!template?.latestVersionId) notFound("Prompt template not found");

    const version = await this.repo.getPromptTemplateVersion(db, template.latestVersionId);
    if (!version) notFound("Prompt template version not found");

    return {
      template_id: templateId,
      version_id: version.id,
      rendered: renderTemplateBody(version.body, variables),
    };
  }
}

export { renderTemplateBody };
