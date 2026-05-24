import { and, desc, eq, lt } from "drizzle-orm";

import type { Db } from "@portal/db";
import {
  desktopBootstrapEvents,
  desktopClientHeartbeats,
  desktopClientRevocations,
  desktopClients,
  desktopSyncCursors,
} from "@portal/db";

export class DesktopClientRepository {
  async listClients(db: Db, workspaceId: string) {
    return db
      .select()
      .from(desktopClients)
      .where(eq(desktopClients.workspaceId, workspaceId))
      .orderBy(desc(desktopClients.createdAt));
  }

  async getClient(db: Db, clientId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(desktopClients)
      .where(
        and(
          eq(desktopClients.id, clientId),
          eq(desktopClients.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async createClient(db: Db, data: typeof desktopClients.$inferInsert) {
    const [row] = await db.insert(desktopClients).values(data).returning();
    return row!;
  }

  async updateClient(
    db: Db,
    clientId: string,
    workspaceId: string,
    patch: Partial<typeof desktopClients.$inferInsert>,
  ) {
    const [row] = await db
      .update(desktopClients)
      .set({ ...patch, updatedAt: new Date() })
      .where(
        and(
          eq(desktopClients.id, clientId),
          eq(desktopClients.workspaceId, workspaceId),
        ),
      )
      .returning();
    return row ?? null;
  }

  async isRevoked(db: Db, clientId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(desktopClientRevocations)
      .where(
        and(
          eq(desktopClientRevocations.clientId, clientId),
          eq(desktopClientRevocations.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  async revokeClient(
    db: Db,
    data: typeof desktopClientRevocations.$inferInsert,
  ) {
    const [row] = await db.insert(desktopClientRevocations).values(data).returning();
    await db
      .update(desktopClients)
      .set({ status: "revoked", updatedAt: new Date() })
      .where(
        and(
          eq(desktopClients.id, data.clientId),
          eq(desktopClients.workspaceId, data.workspaceId),
        ),
      );
    return row!;
  }

  async insertHeartbeat(
    db: Db,
    data: typeof desktopClientHeartbeats.$inferInsert,
  ) {
    const [row] = await db.insert(desktopClientHeartbeats).values(data).returning();
    return row!;
  }

  async getSyncCursor(db: Db, clientId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(desktopSyncCursors)
      .where(
        and(
          eq(desktopSyncCursors.clientId, clientId),
          eq(desktopSyncCursors.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async upsertSyncCursor(
    db: Db,
    clientId: string,
    workspaceId: string,
    cursor: string,
  ) {
    const existing = await this.getSyncCursor(db, clientId, workspaceId);
    if (existing) {
      const [row] = await db
        .update(desktopSyncCursors)
        .set({ cursor, updatedAt: new Date() })
        .where(eq(desktopSyncCursors.id, existing.id))
        .returning();
      return row!;
    }

    const [row] = await db
      .insert(desktopSyncCursors)
      .values({ clientId, workspaceId, cursor })
      .returning();
    return row!;
  }

  async insertBootstrapEvent(
    db: Db,
    data: typeof desktopBootstrapEvents.$inferInsert,
  ) {
    const [row] = await db.insert(desktopBootstrapEvents).values(data).returning();
    return row!;
  }

  async deleteStaleHeartbeats(db: Db, before: Date) {
    return db
      .delete(desktopClientHeartbeats)
      .where(lt(desktopClientHeartbeats.createdAt, before))
      .returning();
  }

  async markStaleClientsOffline(db: Db, before: Date) {
    return db
      .update(desktopClients)
      .set({ status: "offline", updatedAt: new Date() })
      .where(
        and(
          eq(desktopClients.status, "active"),
          lt(desktopClients.lastSeenAt, before),
        ),
      )
      .returning();
  }
}
