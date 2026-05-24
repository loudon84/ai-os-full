import type { Db } from "@portal/db";

import { notFound } from "../../../errors.js";
import type { RequestContext } from "../../../middleware/auth.js";
import type { AuditService } from "../../audit/audit-service.js";
import { McpRepository } from "./mcp.repository.js";

const PROBE_TIMEOUT_MS = 5_000;

export class McpHealthService {
  private readonly repo = new McpRepository();

  constructor(
    private readonly db: Db,
    private readonly auditService: AuditService,
  ) {}

  async probeServer(
    ctx: RequestContext,
    serverId: string,
    workspaceId: string,
  ) {
    const server = await this.repo.getServer(this.db, serverId, workspaceId);
    if (!server) notFound("MCP server not found");

    let status = "unknown";
    let message: string | null = null;

    if (!server.baseUrl) {
      status = "unknown";
      message = "MCP server has no base_url configured";
    } else {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
        const response = await fetch(server.baseUrl, {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timer);
        status = response.ok ? "healthy" : "unhealthy";
        message = `HTTP ${response.status}`;
      } catch (err) {
        status = "unhealthy";
        message = err instanceof Error ? err.message : "Probe failed";
      }
    }

    const event = await this.repo.insertHealthEvent(this.db, {
      serverId,
      workspaceId,
      status,
      message,
    });

    this.auditService.emit({
      workspaceId,
      actorUserId: ctx.userId,
      action: "mcp_server.health_check",
      targetType: "mcp_server",
      targetId: serverId,
      result: status === "healthy" ? "success" : "failure",
      metadata: { status, message },
    });

    return {
      event_id: event.id,
      server_id: serverId,
      status,
      message,
      created_at: event.createdAt.toISOString(),
    };
  }

  async listHealthEvents(
    ctx: RequestContext,
    serverId: string,
    workspaceId: string,
    limit = 20,
  ) {
    const server = await this.repo.getServer(this.db, serverId, workspaceId);
    if (!server) notFound("MCP server not found");

    const events = await this.repo.listHealthEvents(
      this.db,
      serverId,
      workspaceId,
      limit,
    );

    return {
      items: events.map((event) => ({
        event_id: event.id,
        server_id: event.serverId,
        status: event.status,
        message: event.message,
        created_at: event.createdAt.toISOString(),
      })),
    };
  }
}
