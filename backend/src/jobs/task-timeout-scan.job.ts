import { eq } from "drizzle-orm";

import type { Db } from "@portal/db";
import { teamTaskEvents, teamTasks } from "@portal/db";

import type { AuditService } from "../services/audit/audit-service.js";
import { TeamTaskRepository } from "../services/team-tasks/team-task.repository.js";
import { logger } from "../middleware/logger.js";

export class TaskTimeoutScanJob {
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly repo = new TeamTaskRepository();

  constructor(
    private readonly db: Db,
    private readonly auditService: AuditService,
    private readonly timeoutHours: number,
    private readonly intervalMs = 60_000,
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.run().catch((err) => {
        logger.error({ err }, "Task timeout scan failed");
      });
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async expireTask(task: typeof teamTasks.$inferSelect, reason: string) {
    await this.db
      .update(teamTasks)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(teamTasks.id, task.id));

    await this.db.insert(teamTaskEvents).values({
      taskId: task.id,
      workspaceId: task.workspaceId,
      eventType: "task_expired",
      status: "expired",
      message: "Task expired due to timeout",
      actorUserId: null,
      actorAgentId: null,
      metadata: { reason },
    });

    this.auditService.emit({
      workspaceId: task.workspaceId,
      actorUserId: null,
      action: "team_task.expired",
      targetType: "team_task",
      targetId: task.id,
      result: "success",
      metadata: { reason },
    });
  }

  async run(): Promise<number> {
    const cutoff = new Date(Date.now() - this.timeoutHours * 60 * 60 * 1000);
    const otherActiveStatuses = [
      "created",
      "acknowledged",
      "pending_approval",
      "approved",
      "running",
      "retrying",
    ];

    const staleAssigned = await this.repo.listStaleAssignedTasks(this.db, cutoff);
    const staleOthers = await this.repo.listStaleActiveTasks(
      this.db,
      cutoff,
      otherActiveStatuses,
    );

    const expiredIds = new Set<string>();
    for (const row of staleAssigned) {
      if (expiredIds.has(row.task.id)) continue;
      expiredIds.add(row.task.id);
      await this.expireTask(row.task, "timeout_scan_assigned");
    }

    for (const task of staleOthers) {
      if (expiredIds.has(task.id)) continue;
      expiredIds.add(task.id);
      await this.expireTask(task, "timeout_scan");
    }

    if (expiredIds.size > 0) {
      logger.info({ count: expiredIds.size }, "Expired stale team tasks");
    }

    return expiredIds.size;
  }
}
