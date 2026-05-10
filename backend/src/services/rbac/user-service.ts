import { eq, and, or } from "drizzle-orm";

import type { Db } from "@portal/db";
import { users, memberships } from "@portal/db";

import { notFound, forbidden } from "../../errors.js";

export class UserService {
  constructor(private readonly db: Db) {}

  async list(actorUserId: string, actorRoles: string[], workspaceId?: string) {
    if (actorRoles.includes("super_admin")) {
      return this.db.select().from(users);
    }

    if (!workspaceId) return [];

    const workspaceMembers = await this.db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(eq(memberships.workspaceId, workspaceId));

    return workspaceMembers;
  }

  async get(userId: string) {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (result.length === 0) throw notFound("User not found");
    return result[0];
  }

  async updateStatus(
    userId: string,
    status: string,
    actorUserId: string,
    actorRoles: string[],
  ) {
    if (userId === actorUserId) {
      throw forbidden("Cannot disable yourself");
    }

    const targetUser = await this.get(userId);

    if (!actorRoles.includes("super_admin")) {
      const targetMemberships = await this.db
        .select()
        .from(memberships)
        .where(eq(memberships.userId, userId));

      if (targetMemberships.some((m) => m.role === "owner")) {
        throw forbidden("Cannot disable workspace owner");
      }
      if (targetMemberships.some((m) => m.role === "admin")) {
        throw forbidden("Cannot disable another admin");
      }
    }

    await this.db
      .update(users)
      .set({ status })
      .where(eq(users.id, userId));
  }

  async updateMe(userId: string, input: { displayName?: string }) {
    await this.db
      .update(users)
      .set(input)
      .where(eq(users.id, userId));

    return this.get(userId);
  }
}
