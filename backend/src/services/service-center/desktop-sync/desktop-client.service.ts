import type { DesktopClient } from "@portal/db";
import type { Db } from "@portal/db";

import { forbidden, notFound } from "../../../errors.js";
import type { RequestContext } from "../../../middleware/auth.js";
import type { AuditService } from "../../audit/audit-service.js";
import { DesktopClientRepository } from "./desktop-client.repository.js";

function toClientDto(client: DesktopClient) {
  return {
    client_id: client.id,
    workspace_id: client.workspaceId,
    user_id: client.userId,
    client_name: client.clientName,
    desktop_version: client.desktopVersion,
    copilot_serve_version: client.copilotServeVersion,
    platform: client.platform,
    arch: client.arch,
    status: client.status,
    last_seen_at: client.lastSeenAt?.toISOString() ?? null,
    created_at: client.createdAt.toISOString(),
    updated_at: client.updatedAt.toISOString(),
  };
}

export class DesktopClientService {
  private readonly repo = new DesktopClientRepository();

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
      targetType: "desktop_client",
      targetId,
      result: "success",
      metadata,
    });
  }

  async registerClient(
    ctx: RequestContext,
    input: {
      workspace_id: string;
      client_name?: string | null;
      desktop_version?: string | null;
      copilot_serve_version?: string | null;
      platform?: string | null;
      arch?: string | null;
    },
  ) {
    const client = await this.repo.createClient(this.db, {
      workspaceId: input.workspace_id,
      userId: ctx.userId,
      clientName: input.client_name ?? null,
      desktopVersion: input.desktop_version ?? null,
      copilotServeVersion: input.copilot_serve_version ?? null,
      platform: input.platform ?? null,
      arch: input.arch ?? null,
      status: "active",
      lastSeenAt: new Date(),
    });

    this.audit(ctx, "desktop_client.registered", client.id);
    return toClientDto(client);
  }

  async listClients(ctx: RequestContext, workspaceId: string) {
    const items = await this.repo.listClients(this.db, workspaceId);
    return { items: items.map(toClientDto) };
  }

  async getClient(ctx: RequestContext, clientId: string, workspaceId: string) {
    const client = await this.repo.getClient(this.db, clientId, workspaceId);
    if (!client) notFound("Desktop client not found");
    return toClientDto(client);
  }

  async assertClientActive(clientId: string, workspaceId: string) {
    const revoked = await this.repo.isRevoked(this.db, clientId, workspaceId);
    if (revoked) forbidden("Desktop client has been revoked");

    const client = await this.repo.getClient(this.db, clientId, workspaceId);
    if (!client) notFound("Desktop client not found");
    if (client.status === "revoked") forbidden("Desktop client has been revoked");
    return client;
  }

  async recordHeartbeat(
    ctx: RequestContext,
    input: {
      client_id: string;
      workspace_id: string;
      status_summary?: Record<string, unknown>;
    },
  ) {
    await this.assertClientActive(input.client_id, input.workspace_id);

    await this.repo.insertHeartbeat(this.db, {
      clientId: input.client_id,
      workspaceId: input.workspace_id,
      statusSummary: input.status_summary ?? {},
    });

    await this.repo.updateClient(this.db, input.client_id, input.workspace_id, {
      lastSeenAt: new Date(),
      status: "active",
    });

    return { ok: true, client_id: input.client_id };
  }

  async syncClient(
    ctx: RequestContext,
    input: {
      client_id: string;
      workspace_id: string;
      sync_cursor?: string | null;
    },
  ) {
    await this.assertClientActive(input.client_id, input.workspace_id);

    const cursor =
      input.sync_cursor ??
      `sync_${input.client_id}_${Date.now().toString(36)}`;

    const saved = await this.repo.upsertSyncCursor(
      this.db,
      input.client_id,
      input.workspace_id,
      cursor,
    );

    return {
      client_id: input.client_id,
      sync_cursor: saved.cursor,
      updated_at: saved.updatedAt.toISOString(),
    };
  }

  async revokeClient(
    ctx: RequestContext,
    clientId: string,
    workspaceId: string,
    reason?: string | null,
  ) {
    const client = await this.repo.getClient(this.db, clientId, workspaceId);
    if (!client) notFound("Desktop client not found");

    await this.repo.revokeClient(this.db, {
      clientId,
      workspaceId,
      revokedByUserId: ctx.userId,
      reason: reason ?? null,
    });

    this.audit(ctx, "desktop_client.revoked", clientId);
    return { client_id: clientId, status: "revoked" };
  }
}
