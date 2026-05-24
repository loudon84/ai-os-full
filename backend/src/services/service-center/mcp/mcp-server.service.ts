import type { McpServer } from "@portal/db";
import type { Db } from "@portal/db";

import { notFound } from "../../../errors.js";
import { publishDomainEvent } from "../../../events/publish-domain-event.js";
import type { RequestContext } from "../../../middleware/auth.js";
import type { AuditService } from "../../audit/audit-service.js";
import { McpRepository } from "./mcp.repository.js";

function toServerDto(server: McpServer) {
  return {
    server_id: server.id,
    workspace_id: server.workspaceId,
    name: server.name,
    server_type: server.serverType,
    base_url: server.baseUrl,
    config: server.config,
    enabled: server.enabled,
    created_by_user_id: server.createdByUserId,
    created_at: server.createdAt.toISOString(),
    updated_at: server.updatedAt.toISOString(),
  };
}

export class McpServerService {
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
      targetType: "mcp_server",
      targetId,
      result: "success",
      metadata,
    });
  }

  async listServers(ctx: RequestContext, workspaceId: string) {
    const items = await this.repo.listServers(this.db, workspaceId);
    return { items: items.map(toServerDto) };
  }

  async getServer(ctx: RequestContext, serverId: string, workspaceId: string) {
    const server = await this.repo.getServer(this.db, serverId, workspaceId);
    if (!server) notFound("MCP server not found");
    return toServerDto(server);
  }

  async createServer(
    ctx: RequestContext,
    input: {
      workspace_id: string;
      name: string;
      server_type: string;
      base_url?: string | null;
      config?: Record<string, unknown>;
    },
  ) {
    const server = await this.repo.createServer(this.db, {
      workspaceId: input.workspace_id,
      name: input.name,
      serverType: input.server_type,
      baseUrl: input.base_url ?? null,
      config: input.config ?? {},
      enabled: true,
      createdByUserId: ctx.userId,
    });
    this.audit(ctx, "mcp_server.created", server.id);
    await publishDomainEvent("mcp_server.created", input.workspace_id, {
      server_id: server.id,
    });
    return toServerDto(server);
  }

  async updateServer(
    ctx: RequestContext,
    serverId: string,
    workspaceId: string,
    input: {
      name?: string;
      base_url?: string | null;
      config?: Record<string, unknown>;
      enabled?: boolean;
    },
  ) {
    const server = await this.repo.updateServer(this.db, serverId, workspaceId, {
      name: input.name,
      baseUrl: input.base_url,
      config: input.config,
      enabled: input.enabled,
    });
    if (!server) notFound("MCP server not found");
    this.audit(ctx, "mcp_server.updated", serverId, input);
    await publishDomainEvent("mcp_server.updated", workspaceId, {
      server_id: serverId,
    });
    return toServerDto(server);
  }

  async deleteServer(
    ctx: RequestContext,
    serverId: string,
    workspaceId: string,
  ) {
    const server = await this.repo.deleteServer(this.db, serverId, workspaceId);
    if (!server) notFound("MCP server not found");
    this.audit(ctx, "mcp_server.deleted", serverId);
    return toServerDto(server);
  }
}
