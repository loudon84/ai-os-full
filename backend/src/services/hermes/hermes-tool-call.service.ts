import type { HermesRiskLevel } from "@portal/shared";

import type { Db } from "@portal/db";

import { conflict, notFound } from "../../errors.js";
import type { RequestContext } from "../../middleware/auth.js";
import type { AuditService } from "../audit/audit-service.js";
import { HermesEventService } from "./hermes-event.service.js";
import { HermesRepository } from "./hermes.repository.js";

const HIGH_RISK_ACTIONS = new Set([
  "send_direct",
  "delete",
  "publish",
  "enable_direct",
  "install_direct",
  "change_rbac",
]);

const MEDIUM_RISK_ACTIONS = new Set(["create_draft", "update_draft", "update_status"]);

function inferRiskLevel(toolName: string, toolAction: string): HermesRiskLevel {
  const key = `${toolName}.${toolAction}`;
  if (HIGH_RISK_ACTIONS.has(toolAction) || key.includes("delete") || key.includes("send")) {
    return "high";
  }
  if (MEDIUM_RISK_ACTIONS.has(toolAction)) {
    return "medium";
  }
  return "low";
}

function toToolCallDto(row: {
  id: string;
  runId: string;
  workspaceId: string;
  toolName: string;
  toolAction: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status: string;
  riskLevel: string;
  approvalRequired: boolean;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    tool_call_id: row.id,
    run_id: row.runId,
    workspace_id: row.workspaceId,
    tool_name: row.toolName,
    tool_action: row.toolAction,
    input: row.input,
    output: row.output,
    status: row.status as "pending" | "running" | "succeeded" | "failed" | "blocked",
    risk_level: row.riskLevel as HermesRiskLevel,
    approval_required: row.approvalRequired,
    approved_by: row.approvedBy,
    approved_at: row.approvedAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export class HermesToolCallService {
  private readonly repo = new HermesRepository();
  private readonly eventService = new HermesEventService();

  constructor(private readonly auditService: AuditService) {}

  async createToolCall(
    db: Db,
    ctx: RequestContext,
    input: {
      runId: string;
      workspaceId: string;
      toolName: string;
      toolAction: string;
      input: Record<string, unknown>;
    },
  ) {
    const riskLevel = inferRiskLevel(input.toolName, input.toolAction);
    const approvalRequired = riskLevel === "high";

    const row = await this.repo.createToolCall(db, {
      runId: input.runId,
      workspaceId: input.workspaceId,
      toolName: input.toolName,
      toolAction: input.toolAction,
      input: input.input,
      status: approvalRequired ? "blocked" : "pending",
      riskLevel,
      approvalRequired,
    });

    await this.eventService.appendEvent(db, {
      runId: input.runId,
      workspaceId: input.workspaceId,
      eventType: approvalRequired ? "approval.requested" : "tool.call.created",
      payload: {
        tool_call_id: row.id,
        tool_name: input.toolName,
        tool_action: input.toolAction,
        risk_level: riskLevel,
      },
    });

    await this.auditService.emit({
      workspaceId: input.workspaceId,
      actorUserId: ctx.userId,
      action: "hermes.tool_call.created",
      targetType: "hermes_tool_call",
      targetId: row.id,
      result: "success",
      metadata: { tool_name: input.toolName, tool_action: input.toolAction, risk_level: riskLevel },
    });

    return toToolCallDto(row);
  }

  async approveToolCall(
    db: Db,
    ctx: RequestContext,
    toolCallId: string,
    workspaceId: string,
    reason?: string,
  ) {
    const existing = await this.repo.getToolCall(db, toolCallId, workspaceId);
    if (!existing) notFound("Tool call not found");
    if (!existing.approvalRequired) conflict("Tool call does not require approval");
    if (existing.status !== "blocked") conflict("Tool call is not awaiting approval");

    const row = await this.repo.updateToolCall(db, toolCallId, workspaceId, {
      status: "pending",
      approvedBy: ctx.userId,
      approvedAt: new Date(),
    });
    if (!row) notFound("Tool call not found");

    await this.eventService.appendEvent(db, {
      runId: existing.runId,
      workspaceId,
      eventType: "approval.resolved",
      payload: { tool_call_id: toolCallId, decision: "approved", reason: reason ?? null },
    });

    return toToolCallDto(row);
  }

  async getToolCall(db: Db, toolCallId: string, workspaceId: string) {
    const row = await this.repo.getToolCall(db, toolCallId, workspaceId);
    return row ? toToolCallDto(row) : null;
  }

  async finishToolCall(
    db: Db,
    ctx: RequestContext,
    input: {
      toolCallId: string;
      workspaceId: string;
      runId: string;
      status: "succeeded" | "failed";
      output: Record<string, unknown>;
    },
  ) {
    const row = await this.repo.updateToolCall(db, input.toolCallId, input.workspaceId, {
      status: input.status,
      output: input.output,
    });
    if (!row) notFound("Tool call not found");

    await this.eventService.appendEvent(db, {
      runId: input.runId,
      workspaceId: input.workspaceId,
      eventType: "tool.call.completed",
      payload: {
        tool_call_id: input.toolCallId,
        status: input.status,
        output: input.output,
      },
    });

    await this.auditService.emit({
      workspaceId: input.workspaceId,
      actorUserId: ctx.userId,
      action: "hermes.tool_call.completed",
      targetType: "hermes_tool_call",
      targetId: input.toolCallId,
      result: input.status === "succeeded" ? "success" : "failure",
      metadata: { status: input.status },
    });

    return toToolCallDto(row);
  }

  async rejectToolCall(
    db: Db,
    ctx: RequestContext,
    toolCallId: string,
    workspaceId: string,
    reason: string,
  ) {
    const existing = await this.repo.getToolCall(db, toolCallId, workspaceId);
    if (!existing) notFound("Tool call not found");

    const row = await this.repo.updateToolCall(db, toolCallId, workspaceId, {
      status: "failed",
      output: { error: reason },
    });
    if (!row) notFound("Tool call not found");

    await this.eventService.appendEvent(db, {
      runId: existing.runId,
      workspaceId,
      eventType: "approval.resolved",
      payload: { tool_call_id: toolCallId, decision: "rejected", reason },
    });

    return toToolCallDto(row);
  }
}
