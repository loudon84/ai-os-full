import type { ConnectorConfig } from "@portal/db";
import type { Db } from "@portal/db";

import type { AppConfig } from "../../../config.js";
import { badRequest, conflict, notFound } from "../../../errors.js";
import { publishDomainEvent } from "../../../events/publish-domain-event.js";
import type { RequestContext } from "../../../middleware/auth.js";
import type { AuditService } from "../../audit/audit-service.js";
import type { TeamTaskService } from "../../team-tasks/team-task.service.js";
import { ConnectorRepository } from "./connector.repository.js";
import { WebhookSignatureService } from "./webhook-signature.service.js";

function toConnectorDto(connector: ConnectorConfig) {
  return {
    connector_id: connector.id,
    workspace_id: connector.workspaceId,
    connector_key: connector.connectorKey,
    connector_type: connector.connectorType,
    name: connector.name,
    webhook_secret_ref: connector.webhookSecretRef,
    config: connector.config,
    enabled: connector.enabled,
    created_by_user_id: connector.createdByUserId,
    created_at: connector.createdAt.toISOString(),
    updated_at: connector.updatedAt.toISOString(),
  };
}

export class ConnectorService {
  private readonly repo = new ConnectorRepository();
  private readonly signatureService = new WebhookSignatureService();

  constructor(
    private readonly db: Db,
    private readonly config: AppConfig,
    private readonly auditService: AuditService,
    private readonly teamTaskService: TeamTaskService,
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
      targetType: "connector",
      targetId,
      result: "success",
      metadata,
    });
  }

  private resolveWebhookSecret(connector: ConnectorConfig): string {
    return (
      connector.webhookSecretRef ??
      this.config.teamTaskWebhookSecret ??
      ""
    );
  }

  async listConnectors(ctx: RequestContext, workspaceId: string) {
    const items = await this.repo.listConnectors(this.db, workspaceId);
    return { items: items.map(toConnectorDto) };
  }

  async createConnector(
    ctx: RequestContext,
    input: {
      workspace_id: string;
      connector_key: string;
      connector_type: string;
      name: string;
      webhook_secret_ref?: string | null;
      config?: Record<string, unknown>;
    },
  ) {
    try {
      const connector = await this.repo.createConnector(this.db, {
        workspaceId: input.workspace_id,
        connectorKey: input.connector_key,
        connectorType: input.connector_type,
        name: input.name,
        webhookSecretRef: input.webhook_secret_ref ?? null,
        config: input.config ?? {},
        enabled: true,
        createdByUserId: ctx.userId,
      });
      this.audit(ctx, "connector.created", connector.id);
      return toConnectorDto(connector);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.toLowerCase().includes("duplicate key")
      ) {
        conflict(
          "Connector key already exists in this workspace",
          "CONNECTOR_KEY_CONFLICT",
        );
      }
      throw err;
    }
  }

  async updateConnector(
    ctx: RequestContext,
    connectorId: string,
    workspaceId: string,
    input: {
      name?: string;
      webhook_secret_ref?: string | null;
      config?: Record<string, unknown>;
      enabled?: boolean;
    },
  ) {
    const connector = await this.repo.updateConnector(
      this.db,
      connectorId,
      workspaceId,
      {
        name: input.name,
        webhookSecretRef: input.webhook_secret_ref,
        config: input.config,
        enabled: input.enabled,
      },
    );
    if (!connector) notFound("Connector not found");
    this.audit(ctx, "connector.updated", connectorId, input);
    return toConnectorDto(connector);
  }

  async deleteConnector(
    ctx: RequestContext,
    connectorId: string,
    workspaceId: string,
  ) {
    const connector = await this.repo.deleteConnector(
      this.db,
      connectorId,
      workspaceId,
    );
    if (!connector) notFound("Connector not found");
    this.audit(ctx, "connector.deleted", connectorId);
    return toConnectorDto(connector);
  }

  async handleWebhook(
    ctx: RequestContext,
    connectorKey: string,
    rawBody: string,
    signature: string | undefined,
    payload: {
      title: string;
      description?: string | null;
      task_type?: string;
      risk_level?: string;
      assignee_user_id?: string | null;
      target_profile_id?: string | null;
      workspace_path?: string | null;
      input?: Record<string, unknown>;
    },
  ) {
    const connector = await this.repo.getConnectorByKey(this.db, connectorKey);
    if (!connector) notFound("Connector not found");
    if (!connector.enabled) badRequest("Connector is disabled");

    const secret = this.resolveWebhookSecret(connector);
    this.signatureService.assertValidSignature(rawBody, secret, signature ?? "");

    const webhookCtx: RequestContext = {
      ...ctx,
      workspaceId: connector.workspaceId,
      userId: ctx.userId || connector.createdByUserId,
    };

    let eventStatus = "processed";
    let errorMessage: string | null = null;
    let taskId: string | null = null;

    try {
      const task = await this.teamTaskService.createTask(webhookCtx, {
        workspace_id: connector.workspaceId,
        title: payload.title,
        description: payload.description ?? null,
        task_type: payload.task_type ?? "custom",
        risk_level: payload.risk_level ?? "low",
        assignee_user_id: payload.assignee_user_id ?? null,
        target_profile_id: payload.target_profile_id ?? null,
        workspace_path: payload.workspace_path ?? null,
        input: payload.input ?? {},
      });
      taskId = task.task_id;
    } catch (err) {
      eventStatus = "failed";
      errorMessage = err instanceof Error ? err.message : "Unknown error";
    }

    const event = await this.repo.insertWebhookEvent(this.db, {
      connectorId: connector.id,
      workspaceId: connector.workspaceId,
      status: eventStatus,
      payload: payload as Record<string, unknown>,
      errorMessage,
    });

    if (taskId) {
      await this.repo.insertTaskMapping(this.db, {
        connectorId: connector.id,
        webhookEventId: event.id,
        taskId,
        workspaceId: connector.workspaceId,
      });
    }

    this.auditService.emit({
      workspaceId: connector.workspaceId,
      actorUserId: webhookCtx.userId,
      action: "connector.webhook.received",
      targetType: "connector",
      targetId: connector.id,
      result: eventStatus === "processed" ? "success" : "failure",
      metadata: { connector_key: connectorKey, task_id: taskId },
    });

    await publishDomainEvent("connector.webhook.received", connector.workspaceId, {
      connector_id: connector.id,
      connector_key: connectorKey,
      task_id: taskId,
      status: eventStatus,
    });

    return {
      event_id: event.id,
      status: eventStatus,
      task_id: taskId,
      error_message: errorMessage,
    };
  }
}
