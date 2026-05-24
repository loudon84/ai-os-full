import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";

import type { BootstrapResponse } from "@portal/shared";

import type { Db } from "@portal/db";
import { policyRuleBindings, policyRules, workspaces } from "@portal/db";

import type { AppConfig } from "../../../config.js";
import { forbidden, notFound } from "../../../errors.js";
import type { RequestContext } from "../../../middleware/auth.js";
import type { AuditService } from "../../audit/audit-service.js";
import type { McpServerService } from "../mcp/mcp-server.service.js";
import type { PluginService } from "../plugins/plugin.service.js";
import type { ProfileService } from "../profiles/profile.service.js";
import type { SkillTemplateService } from "../skills/skill-template.service.js";
import { DesktopClientRepository } from "./desktop-client.repository.js";
import type { DesktopClientService } from "./desktop-client.service.js";
import {
  buildWorkspacePolicyFromMergedRules,
  mergePolicyRules,
} from "../policy-rules.js";

export function buildBootstrapResponse(input: {
  workspaceId: string;
  workspaceName: string;
  backendBaseUrl: string;
  teamTaskPollIntervalSec: number;
  profiles: Record<string, unknown>[];
  skills: Record<string, unknown>[];
  plugins: Record<string, unknown>[];
  mcpServers: Record<string, unknown>[];
  workspacePolicy: {
    allowed_workspace_roots: string[];
    require_approval_risk_level: string;
    bound_rules: Array<{
      rule_key: string;
      rule_type: string;
      source: "workspace" | "desktop_client";
    }>;
  };
  syncCursor: string;
}): BootstrapResponse {
  return {
    workspace: {
      workspace_id: input.workspaceId,
      name: input.workspaceName,
    },
    api: {
      backend_base_url: input.backendBaseUrl,
      team_task_poll_interval_seconds: input.teamTaskPollIntervalSec,
    },
    profiles: input.profiles,
    skills: input.skills,
    plugins: input.plugins,
    mcp_servers: input.mcpServers,
    workspace_policy: input.workspacePolicy,
    sync_cursor: input.syncCursor,
  };
}

export class BootstrapService {
  private readonly repo = new DesktopClientRepository();

  constructor(
    private readonly db: Db,
    private readonly config: AppConfig,
    private readonly auditService: AuditService,
    private readonly desktopClientService: DesktopClientService,
    private readonly profileService: ProfileService,
    private readonly skillService: SkillTemplateService,
    private readonly pluginService: PluginService,
    private readonly mcpServerService: McpServerService,
  ) {}

  async bootstrap(
    ctx: RequestContext,
    input: {
      client_id: string;
      workspace_id: string;
      user_id: string;
      desktop_version?: string | null;
      copilot_serve_version?: string | null;
      platform?: string | null;
      arch?: string | null;
    },
  ): Promise<BootstrapResponse> {
    await this.desktopClientService.assertClientActive(
      input.client_id,
      input.workspace_id,
    );

    if (input.user_id !== ctx.userId) {
      forbidden("Bootstrap user mismatch");
    }

    const [workspace] = await this.db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, input.workspace_id))
      .limit(1);
    if (!workspace) notFound("Workspace not found");

    await this.repo.updateClient(this.db, input.client_id, input.workspace_id, {
      desktopVersion: input.desktop_version ?? null,
      copilotServeVersion: input.copilot_serve_version ?? null,
      platform: input.platform ?? null,
      arch: input.arch ?? null,
      lastSeenAt: new Date(),
    });

    const profilesResult = await this.profileService.listProfiles(
      ctx,
      input.workspace_id,
    );
    const skillsResult = await this.skillService.listTemplates(
      ctx,
      input.workspace_id,
    );
    const pluginsResult = await this.pluginService.listPlugins(
      ctx,
      input.workspace_id,
    );
    const mcpResult = await this.mcpServerService.listServers(
      ctx,
      input.workspace_id,
    );

    const rules = await this.db
      .select()
      .from(policyRules)
      .where(eq(policyRules.workspaceId, input.workspace_id));

    const bindings = await this.db
      .select()
      .from(policyRuleBindings)
      .where(eq(policyRuleBindings.workspaceId, input.workspace_id));

    const mergedRules = mergePolicyRules({
      rules,
      bindings,
      workspaceId: input.workspace_id,
      clientId: input.client_id,
    });
    const workspacePolicy = buildWorkspacePolicyFromMergedRules(mergedRules);

    const syncCursor = `bootstrap_${randomBytes(8).toString("hex")}`;
    await this.repo.upsertSyncCursor(
      this.db,
      input.client_id,
      input.workspace_id,
      syncCursor,
    );

    await this.repo.insertBootstrapEvent(this.db, {
      clientId: input.client_id,
      workspaceId: input.workspace_id,
      userId: input.user_id,
      metadata: {
        desktop_version: input.desktop_version,
        copilot_serve_version: input.copilot_serve_version,
        platform: input.platform,
        arch: input.arch,
      },
    });

    this.auditService.emit({
      workspaceId: input.workspace_id,
      actorUserId: ctx.userId,
      action: "desktop.bootstrap",
      targetType: "desktop_client",
      targetId: input.client_id,
      result: "success",
      metadata: null,
    });

    return buildBootstrapResponse({
      workspaceId: input.workspace_id,
      workspaceName: workspace.name,
      backendBaseUrl: this.config.serviceCenterBaseUrl,
      teamTaskPollIntervalSec: this.config.teamTaskPollIntervalSec,
      profiles: profilesResult.items as Record<string, unknown>[],
      skills: skillsResult.items as Record<string, unknown>[],
      plugins: pluginsResult.items as Record<string, unknown>[],
      mcpServers: mcpResult.items as Record<string, unknown>[],
      workspacePolicy,
      syncCursor,
    });
  }
}
