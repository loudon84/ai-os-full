import type { Db } from "@portal/db";

import { forbidden } from "../../errors.js";
import type { RequestContext } from "../../middleware/auth.js";
import type { HermesToolCallService } from "./hermes-tool-call.service.js";
import { auditReplayToolHandlers } from "./tools/audit-replay-tool.js";
import { documentToolHandlers } from "./tools/document-tool.js";
import { emailToolHandlers } from "./tools/email-tool.js";
import { teamTaskToolHandlers } from "./tools/team-task-tool.js";
import type { HermesToolDeps } from "./tools/tool-context.js";

const FORBIDDEN_ACTIONS = new Set([
  "email.send_direct",
  "document.delete",
  "workspace.delete",
  "role_permission.change",
  "plugin.install_direct",
  "mcp.enable_direct",
]);

export type ToolFacadeBaseDeps = Omit<HermesToolDeps, "db" | "ctx">;

function buildRegistry(): Record<
  string,
  Record<string, (deps: HermesToolDeps, input: Record<string, unknown>) => Promise<Record<string, unknown>>>
> {
  return {
    document: documentToolHandlers(),
    email: emailToolHandlers(),
    team_task: teamTaskToolHandlers(),
    audit_replay: auditReplayToolHandlers(),
  };
}

export class ToolFacadeService {
  private readonly registry = buildRegistry();

  constructor(
    private readonly toolCallService: HermesToolCallService,
    private readonly baseDeps: ToolFacadeBaseDeps,
  ) {}

  async dispatch(
    db: Db,
    ctx: RequestContext,
    input: {
      runId: string;
      workspaceId: string;
      toolName: string;
      toolAction: string;
      payload: Record<string, unknown>;
    },
  ) {
    const key = `${input.toolName}.${input.toolAction}`;
    if (FORBIDDEN_ACTIONS.has(key)) {
      forbidden(`Tool action forbidden: ${key}`);
    }

    const toolCall = await this.toolCallService.createToolCall(db, ctx, {
      runId: input.runId,
      workspaceId: input.workspaceId,
      toolName: input.toolName,
      toolAction: input.toolAction,
      input: input.payload,
    });

    if (toolCall.approval_required && toolCall.status === "blocked") {
      return { tool_call: toolCall, output: null, pending_approval: true };
    }

    return this.executeToolCall(db, ctx, toolCall.tool_call_id, input.workspaceId);
  }

  async approveAndExecute(
    db: Db,
    ctx: RequestContext,
    toolCallId: string,
    workspaceId: string,
    reason?: string,
  ) {
    const approved = await this.toolCallService.approveToolCall(
      db,
      ctx,
      toolCallId,
      workspaceId,
      reason,
    );
  const result = await this.executeToolCall(db, ctx, toolCallId, workspaceId);
    return { ...result, tool_call: result.tool_call ?? approved };
  }

  async executeToolCall(
    db: Db,
    ctx: RequestContext,
    toolCallId: string,
    workspaceId: string,
  ) {
    const existing = await this.toolCallService.getToolCall(db, toolCallId, workspaceId);
    if (!existing) {
      return {
        tool_call: null,
        output: { error: "Tool call not found" },
        pending_approval: false,
      };
    }

    if (existing.approval_required && existing.status === "blocked") {
      return { tool_call: existing, output: null, pending_approval: true };
    }

    const handler = this.registry[existing.tool_name]?.[existing.tool_action];
    if (!handler) {
      const failed = await this.toolCallService.finishToolCall(db, ctx, {
        toolCallId,
        workspaceId,
        runId: existing.run_id,
        status: "failed",
        output: { error: `Unknown tool: ${existing.tool_name}.${existing.tool_action}` },
      });
      return { tool_call: failed, output: failed.output, pending_approval: false };
    }

    try {
      const deps: HermesToolDeps = { ...this.baseDeps, db, ctx };
      const output = await handler(deps, existing.input);
      const completed = await this.toolCallService.finishToolCall(db, ctx, {
        toolCallId,
        workspaceId,
        runId: existing.run_id,
        status: "succeeded",
        output,
      });
      return { tool_call: completed, output, pending_approval: false };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tool execution failed";
      const failed = await this.toolCallService.finishToolCall(db, ctx, {
        toolCallId,
        workspaceId,
        runId: existing.run_id,
        status: "failed",
        output: { error: message },
      });
      return { tool_call: failed, output: failed.output, pending_approval: false };
    }
  }
}
