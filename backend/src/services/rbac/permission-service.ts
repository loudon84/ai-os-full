import { eq, and, inArray } from "drizzle-orm";

import type { Db } from "@portal/db";
import { roles, rolePermissions, permissions, memberships } from "@portal/db";

export class PermissionService {
  constructor(private readonly db: Db) {}

  async listAll() {
    return this.db.select().from(permissions);
  }

  async listByRole(roleId: string) {
    return this.db
      .select({
        id: permissions.id,
        code: permissions.code,
        description: permissions.description,
        createdAt: permissions.createdAt,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));
  }

  async assign(roleId: string, permissionIds: string[]) {
    await this.db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    if (permissionIds.length > 0) {
      await this.db.insert(rolePermissions).values(
        permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      );
    }
  }

  async queryUserPermissions(
    userId: string,
    workspaceId: string,
  ): Promise<string[]> {
    const userRoles = await this.db
      .select({ role: memberships.role })
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.workspaceId, workspaceId),
        ),
      );

    if (userRoles.some((r) => r.role === "super_admin")) {
      return ["*"];
    }

    const roleCodes = userRoles.map((r) => r.role);

    const workspaceRoles = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(
        and(
          eq(roles.workspaceId, workspaceId),
          inArray(roles.code, roleCodes),
        ),
      );

    if (workspaceRoles.length === 0) return [];

    const roleIds = workspaceRoles.map((r) => r.id);
    const result = await this.db
      .select({ code: permissions.code })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(inArray(rolePermissions.roleId, roleIds));

    return result.map((r) => r.code);
  }
}
