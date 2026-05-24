import type { McpToolManifest } from "@portal/shared";
import { mcpToolManifestSchema } from "@portal/shared";

import type { mcpTools } from "@portal/db";

type McpTool = typeof mcpTools.$inferSelect;
import type { Db } from "@portal/db";

import { notFound } from "../../../errors.js";
import type { RequestContext } from "../../../middleware/auth.js";
import type { AuditService } from "../../audit/audit-service.js";
import { McpRepository } from "./mcp.repository.js";

const HIGH_RISK_LEVELS = new Set(["high", "critical"]);

export function resolveMcpToolEnabled(
  riskLevel: string,
  enabled?: boolean,
): boolean {
  if (enabled !== undefined) return enabled;
  return !HIGH_RISK_LEVELS.has(riskLevel);
}

export function buildMcpToolManifest(tool: McpTool): McpToolManifest {
  return mcpToolManifestSchema.parse({
    tool_id: tool.id,
    server_id: tool.serverId,
    name: tool.name,
    description: tool.description ?? "",
    input_schema: tool.inputSchema,
    output_schema: tool.outputSchema,
    required_permissions: tool.requiredPermissions,
    risk_level: tool.riskLevel,
    enabled: tool.enabled,
  });
}

function toToolDto(tool: McpTool) {
  return {
    tool_id: tool.id,
    server_id: tool.serverId,
    workspace_id: tool.workspaceId,
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
    output_schema: tool.outputSchema,
    required_permissions: tool.requiredPermissions,
    risk_level: tool.riskLevel,
    enabled: tool.enabled,
    created_at: tool.createdAt.toISOString(),
    updated_at: tool.updatedAt.toISOString(),
  };
}

export class McpToolService {
  private readonly repo = new McpRepository();

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
      targetType: "mcp_tool",
      targetId,
      result: "success",
      metadata,
    });
  }

  async listTools(
    ctx: RequestContext,
    workspaceId: string,
    serverId?: string,
  ) {
    const items = await this.repo.listTools(this.db, workspaceId, serverId);
    return { items: items.map(toToolDto) };
  }

  async getTool(ctx: RequestContext, toolId: string, workspaceId: string) {
    const tool = await this.repo.getTool(this.db, toolId, workspaceId);
    if (!tool) notFound("MCP tool not found");
    return toToolDto(tool);
  }

  async createTool(
    ctx: RequestContext,
    input: {
      server_id: string;
      name: string;
      description?: string | null;
      input_schema?: Record<string, unknown>;
      output_schema?: Record<string, unknown> | null;
      required_permissions?: string[];
      risk_level?: string;
      enabled?: boolean;
    },
  ) {
    const server = await this.repo.getServerById(this.db, input.server_id);
    if (!server) notFound("MCP server not found");

    const riskLevel = input.risk_level ?? "low";
    const enabled = resolveMcpToolEnabled(riskLevel, input.enabled);

    const tool = await this.repo.createTool(this.db, {
      serverId: input.server_id,
      workspaceId: server.workspaceId,
      name: input.name,
      description: input.description ?? null,
      inputSchema: input.input_schema ?? {},
      outputSchema: input.output_schema ?? null,
      requiredPermissions: input.required_permissions ?? [],
      riskLevel,
      enabled,
    });

    if (input.required_permissions?.length) {
      await this.repo.syncToolPermissions(
        this.db,
        tool.id,
        server.workspaceId,
        input.required_permissions,
      );
    }

    this.audit(ctx, "mcp_tool.created", tool.id, { risk_level: riskLevel, enabled });
    return toToolDto(tool);
  }

  async updateTool(
    ctx: RequestContext,
    toolId: string,
    workspaceId: string,
    input: {
      name?: string;
      description?: string | null;
      input_schema?: Record<string, unknown>;
      output_schema?: Record<string, unknown> | null;
      required_permissions?: string[];
      risk_level?: string;
      enabled?: boolean;
    },
  ) {
    const existing = await this.repo.getTool(this.db, toolId, workspaceId);
    if (!existing) notFound("MCP tool not found");

    const riskLevel = input.risk_level ?? existing.riskLevel;
    const enabled =
      input.enabled !== undefined
        ? input.enabled
        : input.risk_level !== undefined
          ? resolveMcpToolEnabled(riskLevel)
          : undefined;

    const tool = await this.repo.updateTool(this.db, toolId, workspaceId, {
      name: input.name,
      description: input.description,
      inputSchema: input.input_schema,
      outputSchema: input.output_schema,
      requiredPermissions: input.required_permissions,
      riskLevel: input.risk_level,
      enabled,
    });
    if (!tool) notFound("MCP tool not found");

    if (input.required_permissions) {
      await this.repo.syncToolPermissions(
        this.db,
        toolId,
        workspaceId,
        input.required_permissions,
      );
    }

    this.audit(ctx, "mcp_tool.updated", toolId, input);
    return toToolDto(tool);
  }

  async setToolEnabled(
    ctx: RequestContext,
    toolId: string,
    workspaceId: string,
    enabled: boolean,
  ) {
    const tool = await this.repo.updateTool(this.db, toolId, workspaceId, {
      enabled,
    });
    if (!tool) notFound("MCP tool not found");
    this.audit(ctx, enabled ? "mcp_tool.enabled" : "mcp_tool.disabled", toolId);
    return toToolDto(tool);
  }

  async listProfileTools(
    ctx: RequestContext,
    profileId: string,
    workspaceId: string,
  ) {
    const rows = await this.repo.listProfileBindings(
      this.db,
      profileId,
      workspaceId,
    );
    return {
      items: rows.map((r) => ({
        binding_id: r.binding.id,
        profile_id: r.binding.profileId,
        tool_id: r.binding.toolId,
        enabled: r.binding.enabled,
        tool: toToolDto(r.tool),
      })),
    };
  }

  async bindToolToProfile(
    ctx: RequestContext,
    profileId: string,
    toolId: string,
    workspaceId: string,
    input: { enabled?: boolean },
  ) {
    const tool = await this.repo.getTool(this.db, toolId, workspaceId);
    if (!tool) notFound("MCP tool not found");

    const binding = await this.repo.bindToolToProfile(this.db, {
      profileId,
      toolId,
      workspaceId,
      enabled: input.enabled ?? true,
    });

    await this.repo.upsertProfileServer(this.db, {
      profileId,
      serverId: tool.serverId,
      workspaceId,
      enabled: true,
    });

    this.audit(ctx, "mcp_tool.bound", toolId, { profile_id: profileId });
    return {
      binding_id: binding.id,
      profile_id: profileId,
      tool_id: toolId,
      enabled: binding.enabled,
    };
  }

  async unbindToolFromProfile(
    ctx: RequestContext,
    profileId: string,
    toolId: string,
    workspaceId: string,
  ) {
    const binding = await this.repo.unbindToolFromProfile(
      this.db,
      profileId,
      toolId,
      workspaceId,
    );
    if (!binding) notFound("MCP tool binding not found");
    this.audit(ctx, "mcp_tool.unbound", toolId, { profile_id: profileId });
    return {
      binding_id: binding.id,
      profile_id: profileId,
      tool_id: toolId,
    };
  }
}
