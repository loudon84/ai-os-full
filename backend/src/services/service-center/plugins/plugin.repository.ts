import { and, desc, eq } from "drizzle-orm";

import type { Db } from "@portal/db";
import {
  pluginInstallRecords,
  pluginManifests,
  pluginPermissionDeclarations,
  pluginVersions,
} from "@portal/db";

export class PluginRepository {
  async listPlugins(db: Db, workspaceId: string) {
    return db
      .select()
      .from(pluginManifests)
      .where(eq(pluginManifests.workspaceId, workspaceId))
      .orderBy(desc(pluginManifests.createdAt));
  }

  async getPlugin(db: Db, pluginId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(pluginManifests)
      .where(
        and(
          eq(pluginManifests.id, pluginId),
          eq(pluginManifests.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async createPlugin(db: Db, data: typeof pluginManifests.$inferInsert) {
    const [row] = await db.insert(pluginManifests).values(data).returning();
    return row!;
  }

  async updatePlugin(
    db: Db,
    pluginId: string,
    workspaceId: string,
    patch: Partial<typeof pluginManifests.$inferInsert>,
  ) {
    const [row] = await db
      .update(pluginManifests)
      .set({ ...patch, updatedAt: new Date() })
      .where(
        and(
          eq(pluginManifests.id, pluginId),
          eq(pluginManifests.workspaceId, workspaceId),
        ),
      )
      .returning();
    return row ?? null;
  }

  async deletePlugin(db: Db, pluginId: string, workspaceId: string) {
    const [row] = await db
      .delete(pluginManifests)
      .where(
        and(
          eq(pluginManifests.id, pluginId),
          eq(pluginManifests.workspaceId, workspaceId),
        ),
      )
      .returning();
    return row ?? null;
  }

  async listVersions(db: Db, pluginId: string, workspaceId: string) {
    return db
      .select()
      .from(pluginVersions)
      .where(
        and(
          eq(pluginVersions.pluginId, pluginId),
          eq(pluginVersions.workspaceId, workspaceId),
        ),
      )
      .orderBy(desc(pluginVersions.createdAt));
  }

  async getLatestVersion(db: Db, pluginId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(pluginVersions)
      .where(
        and(
          eq(pluginVersions.pluginId, pluginId),
          eq(pluginVersions.workspaceId, workspaceId),
        ),
      )
      .orderBy(desc(pluginVersions.createdAt))
      .limit(1);
    return row ?? null;
  }

  async createVersion(db: Db, data: typeof pluginVersions.$inferInsert) {
    const [row] = await db.insert(pluginVersions).values(data).returning();
    return row!;
  }

  async insertInstallRecord(
    db: Db,
    data: typeof pluginInstallRecords.$inferInsert,
  ) {
    const [row] = await db.insert(pluginInstallRecords).values(data).returning();
    return row!;
  }

  async syncPermissionDeclarations(
    db: Db,
    pluginId: string,
    workspaceId: string,
    permissions: string[],
  ) {
    await db
      .delete(pluginPermissionDeclarations)
      .where(
        and(
          eq(pluginPermissionDeclarations.pluginId, pluginId),
          eq(pluginPermissionDeclarations.workspaceId, workspaceId),
        ),
      );

    if (permissions.length === 0) return;

    await db.insert(pluginPermissionDeclarations).values(
      permissions.map((code) => ({
        pluginId,
        workspaceId,
        permissionCode: code,
      })),
    );
  }
}
