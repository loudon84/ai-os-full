import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";

import type { Db } from "@portal/db";
import {
  teamTaskApprovals,
  teamTaskArtifacts,
  teamTaskAssignments,
  teamTaskContextRefs,
  teamTaskEvents,
  teamTaskResults,
  teamTasks,
} from "@portal/db";

export class TeamTaskRepository {
  async createTask(
    db: Db,
    data: typeof teamTasks.$inferInsert,
  ) {
    const [row] = await db.insert(teamTasks).values(data).returning();
    return row!;
  }

  async updateTask(
    db: Db,
    taskId: string,
    workspaceId: string,
    patch: Partial<typeof teamTasks.$inferInsert>,
  ) {
    const [row] = await db
      .update(teamTasks)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(teamTasks.id, taskId), eq(teamTasks.workspaceId, workspaceId)))
      .returning();
    return row ?? null;
  }

  async getTask(db: Db, taskId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(teamTasks)
      .where(and(eq(teamTasks.id, taskId), eq(teamTasks.workspaceId, workspaceId)))
      .limit(1);
    return row ?? null;
  }

  async listTasks(
    db: Db,
    input: {
      workspaceId: string;
      status?: string;
      assigneeUserId?: string;
      taskType?: string;
      limit: number;
      cursor?: string;
    },
  ) {
    const conditions = [eq(teamTasks.workspaceId, input.workspaceId)];
    if (input.status) conditions.push(eq(teamTasks.status, input.status));
    if (input.assigneeUserId) {
      conditions.push(eq(teamTasks.assigneeUserId, input.assigneeUserId));
    }
    if (input.taskType) conditions.push(eq(teamTasks.taskType, input.taskType));
    if (input.cursor) conditions.push(lt(teamTasks.createdAt, new Date(input.cursor)));

    const items = await db
      .select()
      .from(teamTasks)
      .where(and(...conditions))
      .orderBy(desc(teamTasks.createdAt))
      .limit(input.limit + 1);

    const hasMore = items.length > input.limit;
    const page = hasMore ? items.slice(0, input.limit) : items;
    const nextCursor =
      hasMore && page.length > 0
        ? page[page.length - 1]!.createdAt.toISOString()
        : null;

    return { items: page, nextCursor };
  }

  async listAssignedTasks(
    db: Db,
    input: {
      workspaceId: string;
      assigneeUserId: string;
      desktopClientId?: string;
      limit: number;
      cursor?: string;
    },
  ) {
    const assignmentRows = await db
      .select()
      .from(teamTaskAssignments)
      .where(
        and(
          eq(teamTaskAssignments.workspaceId, input.workspaceId),
          eq(teamTaskAssignments.assigneeUserId, input.assigneeUserId),
        ),
      )
      .orderBy(desc(teamTaskAssignments.createdAt));

    const latestByTask = new Map<string, (typeof assignmentRows)[number]>();
    for (const row of assignmentRows) {
      if (!latestByTask.has(row.taskId)) {
        latestByTask.set(row.taskId, row);
      }
    }

    const eligibleTaskIds = [...latestByTask.entries()]
      .filter(([, assignment]) => {
        if (!input.desktopClientId) return true;
        if (!assignment.desktopClientId) return true;
        return assignment.desktopClientId === input.desktopClientId;
      })
      .map(([taskId]) => taskId);

    if (eligibleTaskIds.length === 0) {
      return { items: [], nextCursor: null };
    }

    const conditions = [
      eq(teamTasks.workspaceId, input.workspaceId),
      eq(teamTasks.assigneeUserId, input.assigneeUserId),
      eq(teamTasks.status, "assigned"),
      inArray(teamTasks.id, eligibleTaskIds),
    ];
    if (input.cursor) conditions.push(lt(teamTasks.createdAt, new Date(input.cursor)));

    const items = await db
      .select()
      .from(teamTasks)
      .where(and(...conditions))
      .orderBy(desc(teamTasks.createdAt))
      .limit(input.limit + 1);

    const hasMore = items.length > input.limit;
    const page = hasMore ? items.slice(0, input.limit) : items;
    const nextCursor =
      hasMore && page.length > 0
        ? page[page.length - 1]!.createdAt.toISOString()
        : null;

    return { items: page, nextCursor };
  }

  async getLatestAssignment(db: Db, taskId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(teamTaskAssignments)
      .where(
        and(
          eq(teamTaskAssignments.taskId, taskId),
          eq(teamTaskAssignments.workspaceId, workspaceId),
        ),
      )
      .orderBy(desc(teamTaskAssignments.createdAt))
      .limit(1);
    return row ?? null;
  }

  async listStaleAssignedTasks(db: Db, cutoff: Date) {
    const assignedTasks = await db
      .select()
      .from(teamTasks)
      .where(eq(teamTasks.status, "assigned"));

    const stale: Array<{ task: typeof teamTasks.$inferSelect; assignedAt: Date }> =
      [];

    for (const task of assignedTasks) {
      const [assignment] = await db
        .select()
        .from(teamTaskAssignments)
        .where(
          and(
            eq(teamTaskAssignments.taskId, task.id),
            eq(teamTaskAssignments.workspaceId, task.workspaceId),
          ),
        )
        .orderBy(desc(teamTaskAssignments.createdAt))
        .limit(1);

      const assignedAt = assignment?.createdAt ?? task.createdAt;
      if (assignedAt < cutoff) {
        stale.push({ task, assignedAt });
      }
    }

    return stale;
  }

  async listStaleActiveTasks(db: Db, cutoff: Date, statuses: string[]) {
    return db
      .select()
      .from(teamTasks)
      .where(
        and(
          inArray(teamTasks.status, statuses),
          lt(teamTasks.updatedAt, cutoff),
        ),
      );
  }

  async insertEvent(db: Db, data: typeof teamTaskEvents.$inferInsert) {
    const [row] = await db.insert(teamTaskEvents).values(data).returning();
    return row!;
  }

  async listEvents(db: Db, taskId: string, workspaceId: string) {
    return db
      .select()
      .from(teamTaskEvents)
      .where(
        and(
          eq(teamTaskEvents.taskId, taskId),
          eq(teamTaskEvents.workspaceId, workspaceId),
        ),
      )
      .orderBy(desc(teamTaskEvents.createdAt));
  }

  async insertAssignment(db: Db, data: typeof teamTaskAssignments.$inferInsert) {
    const [row] = await db.insert(teamTaskAssignments).values(data).returning();
    return row!;
  }

  async insertResult(db: Db, data: typeof teamTaskResults.$inferInsert) {
    const [row] = await db.insert(teamTaskResults).values(data).returning();
    return row!;
  }

  async insertArtifacts(
    db: Db,
    rows: (typeof teamTaskArtifacts.$inferInsert)[],
  ) {
    if (rows.length === 0) return [];
    return db.insert(teamTaskArtifacts).values(rows).returning();
  }

  async insertContextRefs(
    db: Db,
    rows: (typeof teamTaskContextRefs.$inferInsert)[],
  ) {
    if (rows.length === 0) return [];
    return db.insert(teamTaskContextRefs).values(rows).returning();
  }

  async insertApproval(db: Db, data: typeof teamTaskApprovals.$inferInsert) {
    const [row] = await db.insert(teamTaskApprovals).values(data).returning();
    return row!;
  }

  async getLatestResult(db: Db, taskId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(teamTaskResults)
      .where(
        and(
          eq(teamTaskResults.taskId, taskId),
          eq(teamTaskResults.workspaceId, workspaceId),
        ),
      )
      .orderBy(desc(teamTaskResults.createdAt))
      .limit(1);
    return row ?? null;
  }

  async countByStatus(db: Db, workspaceId: string, status: string) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(teamTasks)
      .where(
        and(eq(teamTasks.workspaceId, workspaceId), eq(teamTasks.status, status)),
      );
    return row?.count ?? 0;
  }
}
