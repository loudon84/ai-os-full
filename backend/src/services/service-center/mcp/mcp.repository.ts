import { and, desc, eq } from "drizzle-orm";

import type { Db } from "@portal/db";
import {
  agentProfileMcpServers,
  mcpProfileBindings,
  mcpServerHealthEvents,
  mcpServers,
  mcpToolPermissions,
  mcpTools,
} from "@portal/db";

export class McpRepository {
  async listServers(db: Db, workspaceId: string) {
    return db
      .select()
      .from(mcpServers)
      .where(eq(mcpServers.workspaceId, workspaceId))
      .orderBy(desc(mcpServers.createdAt));
  }

  async getServer(db: Db, serverId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(mcpServers)
      .where(
        and(eq(mcpServers.id, serverId), eq(mcpServers.workspaceId, workspaceId)),
      )
      .limit(1);
    return row ?? null;
  }

  async getServerById(db: Db, serverId: string) {
    const [row] = await db
      .select()
      .from(mcpServers)
      .where(eq(mcpServers.id, serverId))
      .limit(1);
    return row ?? null;
  }

  async createServer(db: Db, data: typeof mcpServers.$inferInsert) {
    const [row] = await db.insert(mcpServers).values(data).returning();
    return row!;
  }

  async updateServer(
    db: Db,
    serverId: string,
    workspaceId: string,
    patch: Partial<typeof mcpServers.$inferInsert>,
  ) {
    const [row] = await db
      .update(mcpServers)
      .set({ ...patch, updatedAt: new Date() })
      .where(
        and(eq(mcpServers.id, serverId), eq(mcpServers.workspaceId, workspaceId)),
      )
      .returning();
    return row ?? null;
  }

  async deleteServer(db: Db, serverId: string, workspaceId: string) {
    const [row] = await db
      .delete(mcpServers)
      .where(
        and(eq(mcpServers.id, serverId), eq(mcpServers.workspaceId, workspaceId)),
      )
      .returning();
    return row ?? null;
  }

  async listTools(db: Db, workspaceId: string, serverId?: string) {
    const conditions = [eq(mcpTools.workspaceId, workspaceId)];
    if (serverId) conditions.push(eq(mcpTools.serverId, serverId));

    return db
      .select()
      .from(mcpTools)
      .where(and(...conditions))
      .orderBy(desc(mcpTools.createdAt));
  }

  async getTool(db: Db, toolId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(mcpTools)
      .where(and(eq(mcpTools.id, toolId), eq(mcpTools.workspaceId, workspaceId)))
      .limit(1);
    return row ?? null;
  }

  async createTool(db: Db, data: typeof mcpTools.$inferInsert) {
    const [row] = await db.insert(mcpTools).values(data).returning();
    return row!;
  }

  async updateTool(
    db: Db,
    toolId: string,
    workspaceId: string,
    patch: Partial<typeof mcpTools.$inferInsert>,
  ) {
    const [row] = await db
      .update(mcpTools)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(mcpTools.id, toolId), eq(mcpTools.workspaceId, workspaceId)))
      .returning();
    return row ?? null;
  }

  async syncToolPermissions(
    db: Db,
    toolId: string,
    workspaceId: string,
    permissions: string[],
  ) {
    await db
      .delete(mcpToolPermissions)
      .where(
        and(
          eq(mcpToolPermissions.toolId, toolId),
          eq(mcpToolPermissions.workspaceId, workspaceId),
        ),
      );

    if (permissions.length === 0) return;

    await db.insert(mcpToolPermissions).values(
      permissions.map((code) => ({
        toolId,
        workspaceId,
        permissionCode: code,
      })),
    );
  }

  async listProfileBindings(db: Db, profileId: string, workspaceId: string) {
    return db
      .select({
        binding: mcpProfileBindings,
        tool: mcpTools,
      })
      .from(mcpProfileBindings)
      .innerJoin(mcpTools, eq(mcpProfileBindings.toolId, mcpTools.id))
      .where(
        and(
          eq(mcpProfileBindings.profileId, profileId),
          eq(mcpProfileBindings.workspaceId, workspaceId),
        ),
      );
  }

  async bindToolToProfile(
    db: Db,
    data: typeof mcpProfileBindings.$inferInsert,
  ) {
    const existing = await db
      .select()
      .from(mcpProfileBindings)
      .where(
        and(
          eq(mcpProfileBindings.profileId, data.profileId),
          eq(mcpProfileBindings.toolId, data.toolId),
          eq(mcpProfileBindings.workspaceId, data.workspaceId),
        ),
      )
      .limit(1);

    if (existing[0]) {
      const [row] = await db
        .update(mcpProfileBindings)
        .set({ enabled: data.enabled ?? true })
        .where(eq(mcpProfileBindings.id, existing[0].id))
        .returning();
      return row!;
    }

    const [row] = await db.insert(mcpProfileBindings).values(data).returning();
    return row!;
  }

  async unbindToolFromProfile(
    db: Db,
    profileId: string,
    toolId: string,
    workspaceId: string,
  ) {
    const [row] = await db
      .delete(mcpProfileBindings)
      .where(
        and(
          eq(mcpProfileBindings.profileId, profileId),
          eq(mcpProfileBindings.toolId, toolId),
          eq(mcpProfileBindings.workspaceId, workspaceId),
        ),
      )
      .returning();
    return row ?? null;
  }

  async upsertProfileServer(
    db: Db,
    data: typeof agentProfileMcpServers.$inferInsert,
  ) {
    const existing = await db
      .select()
      .from(agentProfileMcpServers)
      .where(
        and(
          eq(agentProfileMcpServers.profileId, data.profileId),
          eq(agentProfileMcpServers.serverId, data.serverId),
          eq(agentProfileMcpServers.workspaceId, data.workspaceId),
        ),
      )
      .limit(1);

    if (existing[0]) {
      const [row] = await db
        .update(agentProfileMcpServers)
        .set({ enabled: data.enabled ?? true })
        .where(eq(agentProfileMcpServers.id, existing[0].id))
        .returning();
      return row!;
    }

    const [row] = await db.insert(agentProfileMcpServers).values(data).returning();
    return row!;
  }

  async insertHealthEvent(
    db: Db,
    data: typeof mcpServerHealthEvents.$inferInsert,
  ) {
    const [row] = await db.insert(mcpServerHealthEvents).values(data).returning();
    return row!;
  }

  async listHealthEvents(
    db: Db,
    serverId: string,
    workspaceId: string,
    limit: number,
  ) {
    return db
      .select()
      .from(mcpServerHealthEvents)
      .where(
        and(
          eq(mcpServerHealthEvents.serverId, serverId),
          eq(mcpServerHealthEvents.workspaceId, workspaceId),
        ),
      )
      .orderBy(desc(mcpServerHealthEvents.createdAt))
      .limit(limit);
  }
}
