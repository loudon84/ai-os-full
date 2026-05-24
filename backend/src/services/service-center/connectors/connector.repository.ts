import { and, desc, eq } from "drizzle-orm";

import type { Db } from "@portal/db";
import {
  connectorConfigs,
  connectorTaskMappings,
  connectorWebhookEvents,
} from "@portal/db";

export class ConnectorRepository {
  async listConnectors(db: Db, workspaceId: string) {
    return db
      .select()
      .from(connectorConfigs)
      .where(eq(connectorConfigs.workspaceId, workspaceId))
      .orderBy(desc(connectorConfigs.createdAt));
  }

  async getConnector(db: Db, connectorId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(connectorConfigs)
      .where(
        and(
          eq(connectorConfigs.id, connectorId),
          eq(connectorConfigs.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async getConnectorByKey(db: Db, connectorKey: string, workspaceId?: string) {
    const conditions = [eq(connectorConfigs.connectorKey, connectorKey)];
    if (workspaceId) conditions.push(eq(connectorConfigs.workspaceId, workspaceId));

    const [row] = await db
      .select()
      .from(connectorConfigs)
      .where(and(...conditions))
      .limit(1);
    return row ?? null;
  }

  async createConnector(db: Db, data: typeof connectorConfigs.$inferInsert) {
    const [row] = await db.insert(connectorConfigs).values(data).returning();
    return row!;
  }

  async updateConnector(
    db: Db,
    connectorId: string,
    workspaceId: string,
    patch: Partial<typeof connectorConfigs.$inferInsert>,
  ) {
    const [row] = await db
      .update(connectorConfigs)
      .set({ ...patch, updatedAt: new Date() })
      .where(
        and(
          eq(connectorConfigs.id, connectorId),
          eq(connectorConfigs.workspaceId, workspaceId),
        ),
      )
      .returning();
    return row ?? null;
  }

  async deleteConnector(db: Db, connectorId: string, workspaceId: string) {
    const [row] = await db
      .delete(connectorConfigs)
      .where(
        and(
          eq(connectorConfigs.id, connectorId),
          eq(connectorConfigs.workspaceId, workspaceId),
        ),
      )
      .returning();
    return row ?? null;
  }

  async insertWebhookEvent(
    db: Db,
    data: typeof connectorWebhookEvents.$inferInsert,
  ) {
    const [row] = await db.insert(connectorWebhookEvents).values(data).returning();
    return row!;
  }

  async insertTaskMapping(
    db: Db,
    data: typeof connectorTaskMappings.$inferInsert,
  ) {
    const [row] = await db.insert(connectorTaskMappings).values(data).returning();
    return row!;
  }
}
