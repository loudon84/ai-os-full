import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";

import type { Db } from "@portal/db";
import {
  hermesGatewayInstances,
  hermesRunEvents,
  hermesRuns,
  hermesToolCalls,
  promptTemplates,
  promptTemplateVersions,
} from "@portal/db";

export class HermesRepository {
  // --- Gateway ---

  async createGateway(db: Db, data: typeof hermesGatewayInstances.$inferInsert) {
    const [row] = await db.insert(hermesGatewayInstances).values(data).returning();
    return row!;
  }

  async updateGateway(
    db: Db,
    gatewayId: string,
    patch: Partial<typeof hermesGatewayInstances.$inferInsert>,
  ) {
    const [row] = await db
      .update(hermesGatewayInstances)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(hermesGatewayInstances.id, gatewayId))
      .returning();
    return row ?? null;
  }

  async getGateway(db: Db, gatewayId: string) {
    const [row] = await db
      .select()
      .from(hermesGatewayInstances)
      .where(eq(hermesGatewayInstances.id, gatewayId))
      .limit(1);
    return row ?? null;
  }

  async listGateways(db: Db, workspaceId?: string) {
    if (workspaceId) {
      return db
        .select()
        .from(hermesGatewayInstances)
        .where(
          or(
            eq(hermesGatewayInstances.workspaceId, workspaceId),
            isNull(hermesGatewayInstances.workspaceId),
          ),
        )
        .orderBy(desc(hermesGatewayInstances.updatedAt));
    }
    return db
      .select()
      .from(hermesGatewayInstances)
      .orderBy(desc(hermesGatewayInstances.updatedAt));
  }

  async listHealthyGateways(db: Db, workspaceId: string) {
    return db
      .select()
      .from(hermesGatewayInstances)
      .where(
        and(
          eq(hermesGatewayInstances.status, "healthy"),
          or(
            eq(hermesGatewayInstances.workspaceId, workspaceId),
            isNull(hermesGatewayInstances.workspaceId),
          ),
        ),
      )
      .orderBy(desc(hermesGatewayInstances.updatedAt));
  }

  // --- Runs ---

  async createRun(db: Db, data: typeof hermesRuns.$inferInsert) {
    const [row] = await db.insert(hermesRuns).values(data).returning();
    return row!;
  }

  async updateRun(
    db: Db,
    runId: string,
    workspaceId: string,
    patch: Partial<typeof hermesRuns.$inferInsert>,
  ) {
    const [row] = await db
      .update(hermesRuns)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(hermesRuns.id, runId), eq(hermesRuns.workspaceId, workspaceId)))
      .returning();
    return row ?? null;
  }

  async getRun(db: Db, runId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(hermesRuns)
      .where(and(eq(hermesRuns.id, runId), eq(hermesRuns.workspaceId, workspaceId)))
      .limit(1);
    return row ?? null;
  }

  async listRuns(
    db: Db,
    input: {
      workspaceId: string;
      status?: string;
      runType?: string;
      limit: number;
      cursor?: string;
    },
  ) {
    const conditions = [eq(hermesRuns.workspaceId, input.workspaceId)];
    if (input.status) conditions.push(eq(hermesRuns.status, input.status));
    if (input.runType) conditions.push(eq(hermesRuns.runType, input.runType));
    if (input.cursor) conditions.push(gt(hermesRuns.id, input.cursor));

    return db
      .select()
      .from(hermesRuns)
      .where(and(...conditions))
      .orderBy(desc(hermesRuns.createdAt))
      .limit(input.limit);
  }

  // --- Run Events ---

  async getMaxEventSeq(db: Db, runId: string): Promise<number> {
    const [row] = await db
      .select({ maxSeq: sql<number>`coalesce(max(${hermesRunEvents.seq}), 0)` })
      .from(hermesRunEvents)
      .where(eq(hermesRunEvents.runId, runId));
    return row?.maxSeq ?? 0;
  }

  async appendRunEvent(db: Db, data: typeof hermesRunEvents.$inferInsert) {
    const [row] = await db.insert(hermesRunEvents).values(data).returning();
    return row!;
  }

  async listRunEvents(
    db: Db,
    runId: string,
    workspaceId: string,
    afterSeq: number,
    limit: number,
  ) {
    return db
      .select()
      .from(hermesRunEvents)
      .where(
        and(
          eq(hermesRunEvents.runId, runId),
          eq(hermesRunEvents.workspaceId, workspaceId),
          gt(hermesRunEvents.seq, afterSeq),
        ),
      )
      .orderBy(hermesRunEvents.seq)
      .limit(limit);
  }

  // --- Tool Calls ---

  async createToolCall(db: Db, data: typeof hermesToolCalls.$inferInsert) {
    const [row] = await db.insert(hermesToolCalls).values(data).returning();
    return row!;
  }

  async updateToolCall(
    db: Db,
    toolCallId: string,
    workspaceId: string,
    patch: Partial<typeof hermesToolCalls.$inferInsert>,
  ) {
    const [row] = await db
      .update(hermesToolCalls)
      .set({ ...patch, updatedAt: new Date() })
      .where(
        and(
          eq(hermesToolCalls.id, toolCallId),
          eq(hermesToolCalls.workspaceId, workspaceId),
        ),
      )
      .returning();
    return row ?? null;
  }

  async getToolCall(db: Db, toolCallId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(hermesToolCalls)
      .where(
        and(
          eq(hermesToolCalls.id, toolCallId),
          eq(hermesToolCalls.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  // --- Prompt Templates ---

  async createPromptTemplate(db: Db, data: typeof promptTemplates.$inferInsert) {
    const [row] = await db.insert(promptTemplates).values(data).returning();
    return row!;
  }

  async updatePromptTemplate(
    db: Db,
    templateId: string,
    workspaceId: string,
    patch: Partial<typeof promptTemplates.$inferInsert>,
  ) {
    const [row] = await db
      .update(promptTemplates)
      .set({ ...patch, updatedAt: new Date() })
      .where(
        and(
          eq(promptTemplates.id, templateId),
          eq(promptTemplates.workspaceId, workspaceId),
        ),
      )
      .returning();
    return row ?? null;
  }

  async getPromptTemplate(db: Db, templateId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(promptTemplates)
      .where(
        and(
          eq(promptTemplates.id, templateId),
          eq(promptTemplates.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async listPromptTemplates(db: Db, workspaceId: string) {
    return db
      .select()
      .from(promptTemplates)
      .where(eq(promptTemplates.workspaceId, workspaceId))
      .orderBy(desc(promptTemplates.updatedAt));
  }

  async createPromptTemplateVersion(
    db: Db,
    data: typeof promptTemplateVersions.$inferInsert,
  ) {
    const [row] = await db.insert(promptTemplateVersions).values(data).returning();
    return row!;
  }

  async getPromptTemplateVersion(db: Db, versionId: string) {
    const [row] = await db
      .select()
      .from(promptTemplateVersions)
      .where(eq(promptTemplateVersions.id, versionId))
      .limit(1);
    return row ?? null;
  }

  async getLatestPromptTemplateVersion(db: Db, templateId: string) {
    const [row] = await db
      .select()
      .from(promptTemplateVersions)
      .where(eq(promptTemplateVersions.templateId, templateId))
      .orderBy(desc(promptTemplateVersions.version))
      .limit(1);
    return row ?? null;
  }
}
