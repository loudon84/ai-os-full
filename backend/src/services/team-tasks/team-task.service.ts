import type { TeamTaskStatus } from "@portal/shared";

import type { AuditService } from "../audit/audit-service.js";
import type { RequestContext } from "../../middleware/auth.js";
import type { Db } from "@portal/db";
import type { TeamTask } from "@portal/db";

import { publishDomainEvent } from "../../events/publish-domain-event.js";
import { conflict, forbidden } from "../../errors.js";
import type { DesktopClientService } from "../service-center/desktop-sync/desktop-client.service.js";
import { TeamTaskRepository } from "./team-task.repository.js";
import { TeamTaskPolicyService } from "./team-task-policy.service.js";
import {
  assertTransition,
  requiresApprovalForRisk,
} from "./team-task-status-machine.js";

function toTaskDto(task: TeamTask) {
  return {
    task_id: task.id,
    workspace_id: task.workspaceId,
    project_id: task.projectId,
    title: task.title,
    description: task.description,
    task_type: task.taskType,
    risk_level: task.riskLevel,
    status: task.status,
    assignee_user_id: task.assigneeUserId,
    target_profile_id: task.targetProfileId,
    target_agent_id: task.targetAgentId,
    source_agent_id: task.sourceAgentId,
    created_by_user_id: task.createdByUserId,
    workspace_path: task.workspacePath,
    requires_approval: task.requiresApproval,
    input: task.input ?? {},
    acceptance_criteria: (task.acceptanceCriteria as string[]) ?? [],
    created_at: task.createdAt.toISOString(),
    updated_at: task.updatedAt.toISOString(),
  };
}

export class TeamTaskService {
  private readonly repo = new TeamTaskRepository();
  private readonly policy: TeamTaskPolicyService = new TeamTaskPolicyService();

  constructor(
    private readonly db: Db,
    private readonly auditService: AuditService,
    private readonly desktopClientService?: DesktopClientService,
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
      targetType: "team_task",
      targetId,
      result: "success",
      metadata,
    });
  }

  private async recordEvent(
    taskId: string,
    workspaceId: string,
    eventType: string,
    status: string | null,
    message: string | null,
    ctx: RequestContext,
    metadata?: Record<string, unknown>,
  ) {
    return this.repo.insertEvent(this.db, {
      taskId,
      workspaceId,
      eventType,
      status,
      message,
      actorUserId: ctx.userId,
      actorAgentId: null,
      metadata: metadata ?? null,
    });
  }

  private async validateDesktopClient(
    ctx: RequestContext,
    workspaceId: string,
    desktopClientId: string,
  ) {
    if (!this.desktopClientService) {
      forbidden("Desktop client validation is not configured");
    }
    const client = await this.desktopClientService.assertClientActive(
      desktopClientId,
      workspaceId,
    );
    if (client.userId !== ctx.userId) {
      forbidden("Desktop client does not belong to the current user");
    }
  }

  private async validateTaskExecution(
    ctx: RequestContext,
    taskId: string,
    workspaceId: string,
    task: TeamTask,
    desktopClientId?: string,
  ) {
    this.policy.canExecute(ctx, task);
    if (!desktopClientId) return;
    await this.validateDesktopClient(ctx, workspaceId, desktopClientId);
    const assignment = await this.repo.getLatestAssignment(
      this.db,
      taskId,
      workspaceId,
    );
    this.policy.assertAssignmentClient(assignment, desktopClientId);
  }

  async createTask(
    ctx: RequestContext,
    input: {
      workspace_id: string;
      project_id?: string | null;
      title: string;
      description?: string | null;
      task_type: string;
      risk_level: string;
      assignee_user_id?: string | null;
      target_profile_id?: string | null;
      target_agent_id?: string | null;
      source_agent_id?: string | null;
      workspace_path?: string | null;
      requires_approval?: boolean;
      input?: Record<string, unknown>;
      acceptance_criteria?: string[];
      context_refs?: Array<{ ref_type: string; ref_id: string }>;
    },
  ) {
    this.policy.canCreate(ctx, input.workspace_id);

    const requiresApproval =
      input.requires_approval ?? requiresApprovalForRisk(input.risk_level);

    let status: TeamTaskStatus = "created";
    if (input.assignee_user_id) status = "assigned";

    const task = await this.repo.createTask(this.db, {
      workspaceId: input.workspace_id,
      projectId: input.project_id ?? null,
      title: input.title,
      description: input.description ?? null,
      taskType: input.task_type,
      riskLevel: input.risk_level,
      status,
      assigneeUserId: input.assignee_user_id ?? null,
      targetProfileId: input.target_profile_id ?? null,
      targetAgentId: input.target_agent_id ?? null,
      sourceAgentId: input.source_agent_id ?? null,
      createdByUserId: ctx.userId,
      workspacePath: input.workspace_path ?? null,
      requiresApproval,
      input: input.input ?? {},
      acceptanceCriteria: input.acceptance_criteria ?? [],
    });

    if (input.context_refs?.length) {
      await this.repo.insertContextRefs(
        this.db,
        input.context_refs.map((ref) => ({
          taskId: task.id,
          workspaceId: input.workspace_id,
          refType: ref.ref_type,
          refId: ref.ref_id,
        })),
      );
    }

    await this.recordEvent(
      task.id,
      input.workspace_id,
      "task_created",
      status,
      "Task created",
      ctx,
    );

    if (status === "assigned" && input.assignee_user_id) {
      await this.repo.insertAssignment(this.db, {
        taskId: task.id,
        workspaceId: input.workspace_id,
        assigneeUserId: input.assignee_user_id,
        targetProfileId: input.target_profile_id ?? null,
        targetAgentId: input.target_agent_id ?? null,
        assignedByUserId: ctx.userId,
      });
    }

    this.audit(ctx, "team_task.create", task.id, { status });
    await publishDomainEvent("team_task.created", input.workspace_id, {
      task_id: task.id,
      status,
    });
    return toTaskDto(task);
  }

  async listTasks(
    ctx: RequestContext,
    query: {
      workspace_id: string;
      status?: string;
      assignee_user_id?: string;
      task_type?: string;
      limit: number;
      cursor?: string;
    },
  ) {
    this.policy.canList(ctx, query.workspace_id);
    const { items, nextCursor } = await this.repo.listTasks(this.db, {
      workspaceId: query.workspace_id,
      status: query.status,
      assigneeUserId: query.assignee_user_id,
      taskType: query.task_type,
      limit: query.limit,
      cursor: query.cursor,
    });
    return {
      items: items.map(toTaskDto),
      pagination: { limit: query.limit, next_cursor: nextCursor },
    };
  }

  async getTask(ctx: RequestContext, taskId: string, workspaceId: string) {
    const task = await this.repo.getTask(this.db, taskId, workspaceId);
    this.policy.assertTaskExists(task);
    this.policy.canRead(ctx, task);
    return toTaskDto(task);
  }

  async updateTask(
    ctx: RequestContext,
    taskId: string,
    workspaceId: string,
    patch: Record<string, unknown>,
  ) {
    const existing = await this.repo.getTask(this.db, taskId, workspaceId);
    this.policy.assertTaskExists(existing);
    this.policy.canUpdate(ctx, existing);

    const task = await this.repo.updateTask(this.db, taskId, workspaceId, {
      title: patch.title as string | undefined,
      description: patch.description as string | null | undefined,
      taskType: patch.task_type as string | undefined,
      riskLevel: patch.risk_level as string | undefined,
      workspacePath: patch.workspace_path as string | null | undefined,
      requiresApproval: patch.requires_approval as boolean | undefined,
      input: patch.input as Record<string, unknown> | undefined,
      acceptanceCriteria: patch.acceptance_criteria as string[] | undefined,
    });

    this.policy.assertTaskExists(task);
    this.audit(ctx, "team_task.update", taskId);
    return toTaskDto(task);
  }

  async assignTask(
    ctx: RequestContext,
    taskId: string,
    workspaceId: string,
    input: {
      assignee_user_id: string;
      target_profile_id?: string | null;
      target_agent_id?: string | null;
      desktop_client_id?: string | null;
    },
  ) {
    const existing = await this.repo.getTask(this.db, taskId, workspaceId);
    this.policy.assertTaskExists(existing);
    this.policy.canAssign(ctx, existing);
    assertTransition(existing.status as TeamTaskStatus, "assigned");

    const task = await this.repo.updateTask(this.db, taskId, workspaceId, {
      assigneeUserId: input.assignee_user_id,
      targetProfileId: input.target_profile_id ?? null,
      targetAgentId: input.target_agent_id ?? null,
      status: "assigned",
    });
    this.policy.assertTaskExists(task);

    await this.repo.insertAssignment(this.db, {
      taskId,
      workspaceId,
      assigneeUserId: input.assignee_user_id,
      targetProfileId: input.target_profile_id ?? null,
      targetAgentId: input.target_agent_id ?? null,
      desktopClientId: input.desktop_client_id ?? null,
      assignedByUserId: ctx.userId,
    });

    await this.recordEvent(
      taskId,
      workspaceId,
      "task_assigned",
      "assigned",
      "Task assigned",
      ctx,
    );
    this.audit(ctx, "team_task.assign", taskId);
    await publishDomainEvent("team_task.status_changed", workspaceId, {
      task_id: taskId,
      status: "assigned",
    });
    return toTaskDto(task);
  }

  async ackTask(
    ctx: RequestContext,
    taskId: string,
    workspaceId: string,
    input: { desktop_client_id?: string | null; profile_id?: string | null },
  ) {
    const existing = await this.repo.getTask(this.db, taskId, workspaceId);
    this.policy.assertTaskExists(existing);
    await this.validateTaskExecution(
      ctx,
      taskId,
      workspaceId,
      existing,
      input.desktop_client_id ?? undefined,
    );
    assertTransition(existing.status as TeamTaskStatus, "acknowledged");

    const task = await this.repo.updateTask(this.db, taskId, workspaceId, {
      status: "acknowledged",
    });
    this.policy.assertTaskExists(task);

    await this.recordEvent(
      taskId,
      workspaceId,
      "task_acknowledged",
      "acknowledged",
      "Task acknowledged",
      ctx,
    );
    this.audit(ctx, "team_task.ack", taskId);
    await publishDomainEvent("team_task.status_changed", workspaceId, {
      task_id: taskId,
      status: "acknowledged",
    });
    return toTaskDto(task);
  }

  async updateStatus(
    ctx: RequestContext,
    taskId: string,
    workspaceId: string,
    input: {
      status: TeamTaskStatus;
      profile_id?: string | null;
      event_type?: string;
      message?: string | null;
      progress?: number | null;
      runtime?: Record<string, unknown> | null;
      desktop_client_id?: string | null;
    },
  ) {
    const existing = await this.repo.getTask(this.db, taskId, workspaceId);
    this.policy.assertTaskExists(existing);
    await this.validateTaskExecution(
      ctx,
      taskId,
      workspaceId,
      existing,
      input.desktop_client_id ?? undefined,
    );

    if (input.status === "approved" || input.status === "rejected") {
      conflict(
        "Use approve or reject endpoints for approval transitions",
        "TEAM_TASK_USE_APPROVAL_ENDPOINT",
      );
    }

    let nextStatus = input.status;
    if (nextStatus === "running" && existing.requiresApproval) {
      if (existing.status === "acknowledged") {
        nextStatus = "pending_approval";
      }
    }

    assertTransition(existing.status as TeamTaskStatus, nextStatus);

    const task = await this.repo.updateTask(this.db, taskId, workspaceId, {
      status: nextStatus,
      targetProfileId: input.profile_id ?? existing.targetProfileId,
    });
    this.policy.assertTaskExists(task);

    if (nextStatus === "pending_approval") {
      await this.repo.insertApproval(this.db, {
        taskId,
        workspaceId,
        approverUserId: null,
        status: "pending",
        reason: null,
      });
    }

    await this.recordEvent(
      taskId,
      workspaceId,
      input.event_type ?? "status_updated",
      nextStatus,
      input.message ?? null,
      ctx,
      {
        progress: input.progress,
        runtime: input.runtime,
      },
    );
    this.audit(ctx, "team_task.status", taskId, { status: nextStatus });
    await publishDomainEvent("team_task.status_changed", workspaceId, {
      task_id: taskId,
      status: nextStatus,
    });
    return toTaskDto(task);
  }

  async approveTask(
    ctx: RequestContext,
    taskId: string,
    workspaceId: string,
    input: { reason?: string | null; auto_start?: boolean },
  ) {
    const existing = await this.repo.getTask(this.db, taskId, workspaceId);
    this.policy.assertTaskExists(existing);
    this.policy.canApprove(ctx, existing);
    assertTransition(existing.status as TeamTaskStatus, "approved");

    let nextStatus: TeamTaskStatus = "approved";
    if (input.auto_start) {
      assertTransition("approved", "running");
      nextStatus = "running";
    }

    const task = await this.repo.updateTask(this.db, taskId, workspaceId, {
      status: nextStatus,
    });
    this.policy.assertTaskExists(task);

    await this.repo.insertApproval(this.db, {
      taskId,
      workspaceId,
      approverUserId: ctx.userId,
      status: "approved",
      reason: input.reason ?? null,
      resolvedAt: new Date(),
    });

    await this.recordEvent(
      taskId,
      workspaceId,
      "task_approved",
      nextStatus,
      input.reason ?? "Task approved",
      ctx,
    );
    this.audit(ctx, "team_task.approve", taskId, { status: nextStatus });
    await publishDomainEvent("team_task.approved", workspaceId, {
      task_id: taskId,
      status: nextStatus,
    });
    return toTaskDto(task);
  }

  async rejectTask(
    ctx: RequestContext,
    taskId: string,
    workspaceId: string,
    input: { reason: string },
  ) {
    const existing = await this.repo.getTask(this.db, taskId, workspaceId);
    this.policy.assertTaskExists(existing);
    this.policy.canApprove(ctx, existing);
    assertTransition(existing.status as TeamTaskStatus, "rejected");

    const task = await this.repo.updateTask(this.db, taskId, workspaceId, {
      status: "rejected",
    });
    this.policy.assertTaskExists(task);

    await this.repo.insertApproval(this.db, {
      taskId,
      workspaceId,
      approverUserId: ctx.userId,
      status: "rejected",
      reason: input.reason,
      resolvedAt: new Date(),
    });

    await this.recordEvent(
      taskId,
      workspaceId,
      "task_rejected",
      "rejected",
      input.reason,
      ctx,
    );
    this.audit(ctx, "team_task.reject", taskId);
    await publishDomainEvent("team_task.rejected", workspaceId, {
      task_id: taskId,
      reason: input.reason,
    });
    return toTaskDto(task);
  }

  async submitResult(
    ctx: RequestContext,
    taskId: string,
    workspaceId: string,
    input: {
      status: "succeeded" | "failed";
      summary?: string | null;
      output_text?: string | null;
      artifacts?: Array<{
        type: string;
        name: string;
        storage_key?: string | null;
        url?: string | null;
      }>;
      git_commit?: string | null;
      pr_url?: string | null;
      logs_summary?: string | null;
      desktop_client_id?: string | null;
    },
  ) {
    const existing = await this.repo.getTask(this.db, taskId, workspaceId);
    this.policy.assertTaskExists(existing);
    await this.validateTaskExecution(
      ctx,
      taskId,
      workspaceId,
      existing,
      input.desktop_client_id ?? undefined,
    );
    assertTransition(existing.status as TeamTaskStatus, input.status);

    const task = await this.repo.updateTask(this.db, taskId, workspaceId, {
      status: input.status,
    });
    this.policy.assertTaskExists(task);

    await this.repo.insertResult(this.db, {
      taskId,
      workspaceId,
      status: input.status,
      summary: input.summary ?? null,
      outputText: input.output_text ?? null,
      gitCommit: input.git_commit ?? null,
      prUrl: input.pr_url ?? null,
      logsSummary: input.logs_summary ?? null,
    });

    if (input.artifacts?.length) {
      await this.repo.insertArtifacts(
        this.db,
        input.artifacts.map((a) => ({
          taskId,
          workspaceId,
          artifactType: a.type,
          name: a.name,
          storageKey: a.storage_key ?? null,
          url: a.url ?? null,
        })),
      );
    }

    await this.recordEvent(
      taskId,
      workspaceId,
      "result_submitted",
      input.status,
      input.summary ?? "Result submitted",
      ctx,
    );
    this.audit(ctx, "team_task.result", taskId, { status: input.status });
    await publishDomainEvent("team_task.status_changed", workspaceId, {
      task_id: taskId,
      status: input.status,
    });
    return toTaskDto(task);
  }

  async cancelTask(ctx: RequestContext, taskId: string, workspaceId: string) {
    const existing = await this.repo.getTask(this.db, taskId, workspaceId);
    this.policy.assertTaskExists(existing);
    this.policy.canUpdate(ctx, existing);
    assertTransition(existing.status as TeamTaskStatus, "cancelled");

    const task = await this.repo.updateTask(this.db, taskId, workspaceId, {
      status: "cancelled",
    });
    this.policy.assertTaskExists(task);

    await this.recordEvent(
      taskId,
      workspaceId,
      "task_cancelled",
      "cancelled",
      "Task cancelled",
      ctx,
    );
    this.audit(ctx, "team_task.cancel", taskId);
    await publishDomainEvent("team_task.status_changed", workspaceId, {
      task_id: taskId,
      status: "cancelled",
    });
    return toTaskDto(task);
  }

  async retryTask(ctx: RequestContext, taskId: string, workspaceId: string) {
    const existing = await this.repo.getTask(this.db, taskId, workspaceId);
    this.policy.assertTaskExists(existing);
    this.policy.canUpdate(ctx, existing);

    const fromStatus = existing.status as TeamTaskStatus;
    const targetStatus: TeamTaskStatus = "assigned";
    assertTransition(fromStatus, targetStatus);

    const task = await this.repo.updateTask(this.db, taskId, workspaceId, {
      status: targetStatus,
    });
    this.policy.assertTaskExists(task);

    await this.recordEvent(
      taskId,
      workspaceId,
      "task_reassigned",
      targetStatus,
      "Task reassigned after retry",
      ctx,
    );
    this.audit(ctx, "team_task.retry", taskId);
    await publishDomainEvent("team_task.status_changed", workspaceId, {
      task_id: taskId,
      status: targetStatus,
    });
    return toTaskDto(task);
  }

  async listEvents(ctx: RequestContext, taskId: string, workspaceId: string) {
    const task = await this.repo.getTask(this.db, taskId, workspaceId);
    this.policy.assertTaskExists(task);
    this.policy.canRead(ctx, task);

    const events = await this.repo.listEvents(this.db, taskId, workspaceId);
    return {
      items: events.map((e) => ({
        id: e.id,
        task_id: e.taskId,
        workspace_id: e.workspaceId,
        event_type: e.eventType,
        status: e.status,
        message: e.message,
        actor_user_id: e.actorUserId,
        actor_agent_id: e.actorAgentId,
        metadata: e.metadata,
        created_at: e.createdAt.toISOString(),
      })),
    };
  }

  async listAssigned(
    ctx: RequestContext,
    query: {
      workspace_id: string;
      client_id: string;
      limit: number;
      cursor?: string;
    },
  ) {
    this.policy.canListAssigned(ctx, query.workspace_id);
    await this.validateDesktopClient(ctx, query.workspace_id, query.client_id);

    const assigneeUserId = ctx.userId;
    const { items, nextCursor } = await this.repo.listAssignedTasks(this.db, {
      workspaceId: query.workspace_id,
      assigneeUserId,
      desktopClientId: query.client_id,
      limit: query.limit,
      cursor: query.cursor,
    });

    return {
      items: items.map((task) => ({
        task_id: task.id,
        workspace_id: task.workspaceId,
        project_id: task.projectId,
        title: task.title,
        task_type: task.taskType,
        risk_level: task.riskLevel,
        status: task.status,
        assignee_user_id: task.assigneeUserId,
        target_profile_id: task.targetProfileId,
        workspace_path: task.workspacePath,
        requires_approval: task.requiresApproval,
        input: task.input ?? {},
        acceptance_criteria: (task.acceptanceCriteria as string[]) ?? [],
        created_at: task.createdAt.toISOString(),
      })),
      next_cursor: nextCursor,
    };
  }
}
