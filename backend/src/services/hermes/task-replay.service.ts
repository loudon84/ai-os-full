import { and, desc, eq, inArray } from "drizzle-orm";

import type { TaskReplayDto } from "@portal/shared";

import type { Db } from "@portal/db";
import { auditEvents, hermesRunEvents, hermesRuns, teamTaskEvents } from "@portal/db";

import { notFound } from "../../errors.js";
import { TeamTaskRepository } from "../team-tasks/team-task.repository.js";

function runBelongsToTask(
  run: typeof hermesRuns.$inferSelect,
  taskId: string,
): boolean {
  const inputTaskId = run.input?.task_id;
  if (typeof inputTaskId === "string" && inputTaskId === taskId) {
    return true;
  }
  return run.contextRefs.some(
    (ref) => ref.type === "team_task" && ref.id === taskId,
  );
}

export class TaskReplayService {
  private readonly teamTaskRepo = new TeamTaskRepository();

  async getReplay(
    db: Db,
    taskId: string,
    workspaceId: string,
    limit: number,
  ): Promise<TaskReplayDto> {
    const task = await this.teamTaskRepo.getTask(db, taskId, workspaceId);
    if (!task) notFound("Task not found");

    const taskEvents = await db
      .select()
      .from(teamTaskEvents)
      .where(
        and(eq(teamTaskEvents.taskId, taskId), eq(teamTaskEvents.workspaceId, workspaceId)),
      )
      .orderBy(teamTaskEvents.createdAt)
      .limit(limit);

    const workspaceRuns = await db
      .select()
      .from(hermesRuns)
      .where(eq(hermesRuns.workspaceId, workspaceId))
      .orderBy(desc(hermesRuns.createdAt))
      .limit(100);

    const linkedRunIds = workspaceRuns
      .filter((run) => runBelongsToTask(run, taskId))
      .map((run) => run.id);

    let hermesEvents: Array<typeof hermesRunEvents.$inferSelect> = [];
    if (linkedRunIds.length > 0) {
      hermesEvents = await db
        .select()
        .from(hermesRunEvents)
        .where(
          and(
            eq(hermesRunEvents.workspaceId, workspaceId),
            inArray(hermesRunEvents.runId, linkedRunIds),
          ),
        )
        .orderBy(hermesRunEvents.createdAt)
        .limit(limit);
    }

    const audits = await db
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.workspaceId, workspaceId),
          eq(auditEvents.targetType, "team_task"),
          eq(auditEvents.targetId, taskId),
        ),
      )
      .orderBy(desc(auditEvents.createdAt))
      .limit(limit);

    const timeline = [
      ...taskEvents.map((e) => ({
        seq: 0,
        source: "team_task" as const,
        event_type: e.eventType,
        payload: {
          status: e.status,
          message: e.message,
          metadata: e.metadata,
        },
        created_at: e.createdAt.toISOString(),
      })),
      ...hermesEvents.map((e) => ({
        seq: 0,
        source: "hermes_run" as const,
        event_type: e.eventType,
        payload: e.payload,
        created_at: e.createdAt.toISOString(),
      })),
      ...audits.map((e) => ({
        seq: 0,
        source: "audit" as const,
        event_type: e.action,
        payload: { result: e.result, metadata: e.metadata },
        created_at: e.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .slice(0, limit)
      .map((item, index) => ({ ...item, seq: index + 1 }));

    return {
      task_id: taskId,
      workspace_id: workspaceId,
      timeline,
    };
  }
}
