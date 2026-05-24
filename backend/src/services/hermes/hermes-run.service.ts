import type { HermesGatewayInstanceDto, HermesRunDto, HermesRunEventDto } from "@portal/shared";

import type { Db } from "@portal/db";

import type { AppConfig } from "../../config.js";
import { conflict, notFound } from "../../errors.js";
import { publishDomainEvent } from "../../events/publish-domain-event.js";
import type { RequestContext } from "../../middleware/auth.js";
import type { AuditService } from "../audit/audit-service.js";
import { ContextBuilder } from "./context-builder.js";
import { HermesEventService } from "./hermes-event.service.js";
import { HermesGatewayClient } from "./hermes-gateway-client.js";
import type { GatewayRouteResult } from "./hermes-gateway-router.js";
import { HermesGatewayRouter } from "./hermes-gateway-router.js";
import { HermesRepository } from "./hermes.repository.js";
import { PromptTemplateService } from "./prompt-template.service.js";

function toGatewayDto(row: {
  id: string;
  workspaceId: string | null;
  name: string;
  gatewayType: string;
  baseUrl: string;
  authMode: string;
  status: string;
  modelCapabilities: Record<string, unknown>;
  toolCapabilities: Record<string, unknown>;
  lastHealthAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): HermesGatewayInstanceDto {
  return {
    gateway_id: row.id,
    workspace_id: row.workspaceId,
    name: row.name,
    gateway_type: row.gatewayType as "local" | "remote",
    base_url: row.baseUrl,
    auth_mode: row.authMode as "none" | "bearer" | "service_token",
    status: row.status as "unknown" | "healthy" | "unhealthy" | "disabled",
    model_capabilities: row.modelCapabilities,
    tool_capabilities: row.toolCapabilities,
    last_health_at: row.lastHealthAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

function toRunDto(row: {
  id: string;
  workspaceId: string;
  userId: string;
  sessionId: string | null;
  runType: string;
  gatewayInstanceId: string | null;
  promptTemplateId: string | null;
  status: string;
  input: Record<string, unknown>;
  contextRefs: Array<{ type: string; id: string }>;
  outputText: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): HermesRunDto {
  return {
    run_id: row.id,
    workspace_id: row.workspaceId,
    user_id: row.userId,
    session_id: row.sessionId,
    run_type: row.runType as HermesRunDto["run_type"],
    gateway_instance_id: row.gatewayInstanceId,
    prompt_template_id: row.promptTemplateId,
    status: row.status as HermesRunDto["status"],
    input: row.input,
    context_refs: row.contextRefs,
    output_text: row.outputText,
    error_code: row.errorCode,
    error_message: row.errorMessage,
    started_at: row.startedAt?.toISOString() ?? null,
    finished_at: row.finishedAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export class HermesRunService {
  private readonly repo = new HermesRepository();
  private readonly eventService = new HermesEventService();
  private readonly contextBuilder: ContextBuilder;
  private readonly promptTemplateService = new PromptTemplateService();
  private readonly gatewayRouter: HermesGatewayRouter;
  private readonly gatewayClient: HermesGatewayClient;

  constructor(
    private readonly db: Db,
    private readonly config: AppConfig,
    private readonly auditService: AuditService,
    options?: { contextBuilder?: ContextBuilder },
  ) {
    this.contextBuilder = options?.contextBuilder ?? new ContextBuilder();
    this.gatewayClient = new HermesGatewayClient(config);
    this.gatewayRouter = new HermesGatewayRouter(config, this.gatewayClient);
  }

  async chat(
    ctx: RequestContext,
    input: {
      workspace_id?: string;
      user_message: string;
      session_id?: string | null;
      template_id?: string | null;
      context_refs?: Array<{ type: string; id: string }>;
      token_budget?: number;
      input?: Record<string, unknown>;
    },
  ) {
    const workspaceId = input.workspace_id ?? ctx.workspaceId;
    return this.createRun(ctx, {
      workspace_id: workspaceId,
      run_type: "chat",
      session_id: input.session_id,
      template_id: input.template_id,
      context_refs: input.context_refs ?? [],
      token_budget: input.token_budget ?? 12000,
      input: { ...input.input, user_message: input.user_message },
    });
  }

  async createRun(
    ctx: RequestContext,
    input: {
      workspace_id: string;
      run_type: string;
      session_id?: string | null;
      template_id?: string | null;
      context_refs: Array<{ type: string; id: string }>;
      token_budget: number;
      input: Record<string, unknown>;
      task_id?: string;
    },
  ) {
    const route = await this.gatewayRouter.selectGateway(this.db, {
      workspaceId: input.workspace_id,
      runType: input.run_type,
    });

    const context = await this.contextBuilder.buildContext(this.db, ctx, {
      workspaceId: input.workspace_id,
      userId: ctx.userId,
      runType: input.run_type,
      taskId: input.task_id,
      contextRefs: input.context_refs,
      tokenBudget: input.token_budget,
    });

    let prompt: string | undefined;
    if (input.template_id) {
      const rendered = await this.promptTemplateService.renderTemplate(
        this.db,
        input.template_id,
        input.workspace_id,
        { context: JSON.stringify(context), user_message: String(input.input.user_message ?? "") },
      );
      prompt = rendered.rendered;
    }

    const run = await this.repo.createRun(this.db, {
      workspaceId: input.workspace_id,
      userId: ctx.userId,
      sessionId: input.session_id ?? null,
      runType: input.run_type,
      gatewayInstanceId: route?.gateway.id !== "config-default" ? route?.gateway.id ?? null : null,
      promptTemplateId: input.template_id ?? null,
      status: "queued",
      input: input.input,
      contextRefs: input.context_refs,
    });

    await this.eventService.appendEvent(this.db, {
      runId: run.id,
      workspaceId: input.workspace_id,
      eventType: "run.created",
      payload: { run_type: input.run_type },
    });

    if (!route) {
      const failed = await this.repo.updateRun(this.db, run.id, input.workspace_id, {
        status: "failed",
        errorCode: "NO_GATEWAY_AVAILABLE",
        errorMessage: "No healthy Hermes gateway available",
        finishedAt: new Date(),
      });
      publishDomainEvent("hermes.run.failed", input.workspace_id, {
        run_id: run.id,
        error_code: "NO_GATEWAY_AVAILABLE",
      });
      return toRunDto(failed!);
    }

    await this.repo.updateRun(this.db, run.id, input.workspace_id, {
      status: "running",
      startedAt: new Date(),
    });

    await this.eventService.appendEvent(this.db, {
      runId: run.id,
      workspaceId: input.workspace_id,
      eventType: "run.started",
      payload: { gateway_id: route.gateway.id },
    });

    try {
      const gatewayResponse = await this.gatewayClient.createRun(
        route.baseUrl,
        route.authToken,
        {
          run_id: run.id,
          workspace_id: input.workspace_id,
          user_id: ctx.userId,
          run_type: input.run_type,
          input: input.input,
          context: context as unknown as Record<string, unknown>,
          prompt,
        },
      );

      const gatewayRunId = gatewayResponse.gateway_run_id ?? run.id;
      const ingested = await this.ingestGatewayEventStream(
        route,
        run.id,
        input.workspace_id,
        gatewayRunId,
      );

      const finalStatus =
        ingested.status ??
        (gatewayResponse.status === "failed" ? "failed" : "succeeded");
      const outputText =
        ingested.outputText ??
        (typeof gatewayResponse === "object" && gatewayResponse
          ? JSON.stringify(gatewayResponse)
          : null);

      const succeeded = await this.repo.updateRun(this.db, run.id, input.workspace_id, {
        status: finalStatus,
        outputText,
        errorCode: finalStatus === "failed" ? "GATEWAY_RUN_FAILED" : null,
        errorMessage: ingested.errorMessage,
        finishedAt: new Date(),
      });

      if (ingested.status === null) {
        const terminalEvent =
          finalStatus === "failed"
            ? "run.failed"
            : finalStatus === "cancelled"
              ? "run.cancelled"
              : "run.succeeded";
        await this.eventService.appendEvent(this.db, {
          runId: run.id,
          workspaceId: input.workspace_id,
          eventType: terminalEvent,
          payload: {
            gateway_run_id: gatewayRunId,
            error: ingested.errorMessage,
          },
        });
      }

      if (finalStatus === "succeeded") {
        await publishDomainEvent("hermes.run.succeeded", input.workspace_id, {
          run_id: run.id,
        });

        await this.auditService.emit({
          workspaceId: input.workspace_id,
          actorUserId: ctx.userId,
          action: "hermes.run.succeeded",
          targetType: "hermes_run",
          targetId: run.id,
          result: "success",
          metadata: null,
        });
      } else if (finalStatus === "failed") {
        await publishDomainEvent("hermes.run.failed", input.workspace_id, {
          run_id: run.id,
          error_code: "GATEWAY_RUN_FAILED",
        });
      }

      return toRunDto(succeeded!);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gateway run failed";
      const failed = await this.repo.updateRun(this.db, run.id, input.workspace_id, {
        status: "failed",
        errorCode: "GATEWAY_RUN_FAILED",
        errorMessage: message,
        finishedAt: new Date(),
      });

      await this.eventService.appendEvent(this.db, {
        runId: run.id,
        workspaceId: input.workspace_id,
        eventType: "run.failed",
        payload: { error: message },
      });

      publishDomainEvent("hermes.run.failed", input.workspace_id, {
        run_id: run.id,
        error_code: "GATEWAY_RUN_FAILED",
      });

      return toRunDto(failed!);
    }
  }

  private async ingestGatewayEventStream(
    route: GatewayRouteResult,
    runId: string,
    workspaceId: string,
    gatewayRunId: string,
  ): Promise<{
    status: "succeeded" | "failed" | "cancelled" | null;
    outputText: string | null;
    errorMessage: string | null;
  }> {
    let outputText = "";
    let terminalStatus: "succeeded" | "failed" | "cancelled" | null = null;
    let errorMessage: string | null = null;

    try {
      for await (const raw of this.gatewayClient.streamRunEvents(
        route.baseUrl,
        gatewayRunId,
        route.authToken,
      )) {
        const eventType = String(raw.event_type ?? raw.type ?? "message.delta");
        const payload =
          raw.payload && typeof raw.payload === "object"
            ? (raw.payload as Record<string, unknown>)
            : (raw as Record<string, unknown>);

        await this.eventService.appendEvent(this.db, {
          runId,
          workspaceId,
          eventType,
          payload,
        });

        if (eventType === "message.delta" && typeof payload.text === "string") {
          outputText += payload.text;
        }

        if (this.eventService.isTerminalEvent(eventType)) {
          if (eventType === "run.succeeded") terminalStatus = "succeeded";
          else if (eventType === "run.failed") {
            terminalStatus = "failed";
            errorMessage =
              typeof payload.error === "string"
                ? payload.error
                : typeof payload.message === "string"
                  ? payload.message
                  : "Gateway run failed";
          } else if (eventType === "run.cancelled") {
            terminalStatus = "cancelled";
          }
          break;
        }
      }
    } catch {
      return { status: null, outputText: null, errorMessage: null };
    }

    return {
      status: terminalStatus,
      outputText: outputText.length > 0 ? outputText : null,
      errorMessage,
    };
  }

  async getRun(runId: string, workspaceId: string) {
    const row = await this.repo.getRun(this.db, runId, workspaceId);
    if (!row) notFound("Run not found");
    return toRunDto(row);
  }

  async listRuns(
    workspaceId: string,
    query: { status?: string; run_type?: string; limit: number; cursor?: string },
  ) {
    const rows = await this.repo.listRuns(this.db, {
      workspaceId,
      status: query.status,
      runType: query.run_type,
      limit: query.limit,
      cursor: query.cursor,
    });
    return { data: rows.map(toRunDto), next_cursor: rows.at(-1)?.id ?? null };
  }

  async cancelRun(ctx: RequestContext, runId: string, workspaceId: string) {
    const row = await this.repo.getRun(this.db, runId, workspaceId);
    if (!row) notFound("Run not found");
    if (row.status === "succeeded" || row.status === "failed" || row.status === "cancelled") {
      conflict("Run already terminal");
    }

    const updated = await this.repo.updateRun(this.db, runId, workspaceId, {
      status: "cancelled",
      finishedAt: new Date(),
    });

    await this.eventService.appendEvent(this.db, {
      runId,
      workspaceId,
      eventType: "run.cancelled",
      payload: {},
    });

    await this.auditService.emit({
      workspaceId,
      actorUserId: ctx.userId,
      action: "hermes.run.cancelled",
      targetType: "hermes_run",
      targetId: runId,
      result: "success",
      metadata: null,
    });

    return toRunDto(updated!);
  }

  async listGateways(workspaceId?: string) {
    const rows = await this.repo.listGateways(this.db, workspaceId);
    return rows.map(toGatewayDto);
  }

  async createGateway(
    ctx: RequestContext,
    input: {
      workspace_id?: string | null;
      name: string;
      gateway_type: string;
      base_url: string;
      auth_mode?: string;
      auth_token?: string | null;
      model_capabilities?: Record<string, unknown>;
      tool_capabilities?: Record<string, unknown>;
    },
  ) {
    const row = await this.repo.createGateway(this.db, {
      workspaceId: input.workspace_id ?? null,
      name: input.name,
      gatewayType: input.gateway_type,
      baseUrl: input.base_url,
      authMode: input.auth_mode ?? "none",
      authToken: input.auth_token ?? null,
      status: "unknown",
      modelCapabilities: input.model_capabilities ?? {},
      toolCapabilities: input.tool_capabilities ?? {},
    });

    await this.auditService.emit({
      workspaceId: input.workspace_id ?? ctx.workspaceId,
      actorUserId: ctx.userId,
      action: "hermes.gateway.created",
      targetType: "hermes_gateway",
      targetId: row.id,
      result: "success",
      metadata: null,
    });

    return toGatewayDto(row);
  }

  async updateGateway(
    gatewayId: string,
    patch: {
      name?: string;
      base_url?: string;
      auth_mode?: string;
      auth_token?: string | null;
      status?: string;
      model_capabilities?: Record<string, unknown>;
      tool_capabilities?: Record<string, unknown>;
    },
  ) {
    const row = await this.repo.updateGateway(this.db, gatewayId, {
      name: patch.name,
      baseUrl: patch.base_url,
      authMode: patch.auth_mode,
      authToken: patch.auth_token,
      status: patch.status,
      modelCapabilities: patch.model_capabilities,
      toolCapabilities: patch.tool_capabilities,
    });
    if (!row) notFound("Gateway not found");
    return toGatewayDto(row);
  }

  async healthCheckGateway(gatewayId: string) {
    const updated = await this.gatewayRouter.probeAndUpdateGateway(this.db, gatewayId);
    if (!updated) notFound("Gateway not found");
    return toGatewayDto(updated);
  }

  async streamEvents(
    res: import("express").Response,
    runId: string,
    workspaceId: string,
    afterSeq: number,
    limit: number,
  ) {
    const pollMs = 500;
    const deadline = Date.now() + this.config.hermesRunMaxDurationSec * 1000;
    let cursor = afterSeq;
    let sawTerminal = false;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    while (Date.now() < deadline && !res.writableEnded) {
      const events = await this.eventService.listEvents(
        this.db,
        runId,
        workspaceId,
        cursor,
        limit,
      );

      for (const event of events) {
        res.write(this.eventService.formatSseEvent(event));
        cursor = event.seq;
        if (this.eventService.isTerminalEvent(String(event.event_type))) {
          sawTerminal = true;
          break;
        }
      }
      if (sawTerminal) break;

      const run = await this.repo.getRun(this.db, runId, workspaceId);
      const runTerminal =
        run?.status === "succeeded" ||
        run?.status === "failed" ||
        run?.status === "cancelled";
      if (runTerminal && events.length === 0) break;

      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }

    const endEvent: HermesRunEventDto = {
      event_id: "stream-end",
      run_id: runId,
      workspace_id: workspaceId,
      seq: cursor + 1,
      event_type: "stream.end",
      payload: {},
      created_at: new Date().toISOString(),
    };
    res.write(this.eventService.formatSseEvent(endEvent));
    res.end();
  }
}
