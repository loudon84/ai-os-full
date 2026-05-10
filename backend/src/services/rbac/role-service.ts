import { eq, and } from "drizzle-orm";

import type { Db } from "@portal/db";
import { roles, rolePermissions, permissions } from "@portal/db";

import { notFound, forbidden } from "../../errors.js";

export class RoleService {
  constructor(private readonly db: Db) {}

  async list(workspaceId: string) {
    return this.db
      .select()
      .from(roles)
      .where(eq(roles.workspaceId, workspaceId));
  }

  async create(workspaceId: string, input: { name: string; code: string }) {
    const [role] = await this.db
      .insert(roles)
      .values({
        workspaceId,
        name: input.name,
        code: input.code,
        isSystem: false,
      })
      .returning();

    return role;
  }

  async get(roleId: string) {
    const result = await this.db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (result.length === 0) throw notFound("Role not found");
    return result[0];
  }

  async update(roleId: string, input: { name?: string }) {
    const role = await this.get(roleId);
    if (role.isSystem) throw forbidden("Cannot modify system role");

    const result = await this.db
      .update(roles)
      .set(input)
      .where(eq(roles.id, roleId))
      .returning();

    return result[0];
  }

  async delete(roleId: string) {
    const role = await this.get(roleId);
    if (role.isSystem) throw forbidden("Cannot delete system role");

    await this.db.delete(roles).where(eq(roles.id, roleId));
  }
}
