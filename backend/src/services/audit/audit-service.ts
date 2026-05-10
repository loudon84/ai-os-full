import { eq, and, gte, lte, desc } from "drizzle-orm";

import type { Db } from "@portal/db";
import { auditEvents } from "@portal/db";

import { logger } from "../../middleware/logger.js";

export interface AuditEventInput {
  workspaceId: string | null;
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  result: "success" | "failure";
  metadata: Record<string, unknown> | null;
}

export class AuditService {
  private queue: AuditEventInput[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private static readonly FLUSH_INTERVAL_MS = 2000;
  private static readonly FLUSH_BATCH_SIZE = 50;

  constructor(private readonly db: Db) {
    this.flushTimer = setInterval(
      () => this.flush(),
      AuditService.FLUSH_INTERVAL_MS,
    );
  }

  emit(event: AuditEventInput): void {
    this.queue.push(event);
    if (this.queue.length >= AuditService.FLUSH_BATCH_SIZE) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, AuditService.FLUSH_BATCH_SIZE);

    try {
      await this.db.insert(auditEvents).values(
        batch.map((e) => ({
          workspaceId: e.workspaceId,
          actorUserId: e.actorUserId,
          action: e.action,
          targetType: e.targetType,
          targetId: e.targetId,
          result: e.result,
          metadata: e.metadata,
        })),
      );
    } catch (err) {
      logger.error({ err, batchSize: batch.length }, "Audit flush failed");
    }
  }

  async query(input: {
    workspaceId?: string;
    action?: string;
    targetType?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (input.workspaceId) {
      conditions.push(eq(auditEvents.workspaceId, input.workspaceId));
    }
    if (input.action) {
      conditions.push(eq(auditEvents.action, input.action));
    }
    if (input.targetType) {
      conditions.push(eq(auditEvents.targetType, input.targetType));
    }
    if (input.fromDate) {
      conditions.push(gte(auditEvents.createdAt, new Date(input.fromDate)));
    }
    if (input.toDate) {
      conditions.push(lte(auditEvents.createdAt, new Date(input.toDate)));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const items = await this.db
      .select()
      .from(auditEvents)
      .where(whereClause)
      .orderBy(desc(auditEvents.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items,
      page,
      page_size: pageSize,
      total: items.length,
    };
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}
