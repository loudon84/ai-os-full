import { eq, and } from "drizzle-orm";

import type { Db } from "@portal/db";
import { workspaces, memberships, roles, rolePermissions, permissions } from "@portal/db";

import { notFound, forbidden, conflict } from "../../errors.js";

export class WorkspaceService {
  constructor(private readonly db: Db) {}

  async create(input: { name: string; ownerUserId: string; memberLimit?: number }) {
    const [workspace] = await this.db
      .insert(workspaces)
      .values({
        name: input.name,
        ownerUserId: input.ownerUserId,
        memberLimit: input.memberLimit ?? 100,
      })
      .returning();

    await this.db.insert(memberships).values({
      workspaceId: workspace.id,
      userId: input.ownerUserId,
      role: "owner",
    });

    const [ownerRole] = await this.db
      .insert(roles)
      .values({
        workspaceId: workspace.id,
        name: "Owner",
        code: "owner",
        isSystem: true,
      })
      .returning();

    const [adminRole] = await this.db
      .insert(roles)
      .values({
        workspaceId: workspace.id,
        name: "Admin",
        code: "admin",
        isSystem: true,
      })
      .returning();

    const [userRole] = await this.db
      .insert(roles)
      .values({
        workspaceId: workspace.id,
        name: "User",
        code: "user",
        isSystem: true,
      })
      .returning();

    const allPermissions = await this.db.select().from(permissions);
    for (const perm of allPermissions) {
      await this.db.insert(rolePermissions).values({
        roleId: ownerRole.id,
        permissionId: perm.id,
      });
    }

    return workspace;
  }

  async list(userId: string) {
    return this.db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        ownerUserId: workspaces.ownerUserId,
        status: workspaces.status,
        memberLimit: workspaces.memberLimit,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
      })
      .from(memberships)
      .innerJoin(workspaces, eq(memberships.workspaceId, workspaces.id))
      .where(and(eq(memberships.userId, userId), eq(workspaces.status, "active")));
  }

  async get(workspaceId: string) {
    const result = await this.db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (result.length === 0) throw notFound("Workspace not found");
    return result[0];
  }

  async update(workspaceId: string, input: { name?: string }) {
    const result = await this.db
      .update(workspaces)
      .set(input)
      .where(eq(workspaces.id, workspaceId))
      .returning();

    if (result.length === 0) throw notFound("Workspace not found");
    return result[0];
  }

  async delete(workspaceId: string, userId: string) {
    const workspace = await this.get(workspaceId);

    if (workspace.ownerUserId !== userId) {
      throw forbidden("Only the workspace owner can delete it");
    }

    await this.db
      .update(workspaces)
      .set({ status: "deleted", deletedAt: new Date() })
      .where(eq(workspaces.id, workspaceId));
  }
}
