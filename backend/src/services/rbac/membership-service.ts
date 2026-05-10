import { eq, and } from "drizzle-orm";

import type { Db } from "@portal/db";
import { memberships, workspaces } from "@portal/db";

import { notFound, forbidden, conflict } from "../../errors.js";

export class MembershipService {
  constructor(private readonly db: Db) {}

  async invite(workspaceId: string, userId: string, role: string = "user") {
    const memberCount = await this.db
      .select()
      .from(memberships)
      .where(eq(memberships.workspaceId, workspaceId));

    const workspace = await this.db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (workspace.length > 0 && memberCount.length >= workspace[0].memberLimit) {
      throw conflict("Workspace member limit reached", "member_limit_reached");
    }

    const existing = await this.db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.workspaceId, workspaceId),
          eq(memberships.userId, userId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw conflict("User is already a member", "already_member");
    }

    const [membership] = await this.db
      .insert(memberships)
      .values({ workspaceId, userId, role })
      .returning();

    return membership;
  }

  async list(workspaceId: string) {
    return this.db
      .select()
      .from(memberships)
      .where(eq(memberships.workspaceId, workspaceId));
  }

  async updateRole(
    workspaceId: string,
    membershipId: string,
    newRole: string,
    actorUserId: string,
  ) {
    const membership = await this.db
      .select()
      .from(memberships)
      .where(eq(memberships.id, membershipId))
      .limit(1);

    if (membership.length === 0) throw notFound("Membership not found");
    if (membership[0].role === "owner") {
      throw forbidden("Cannot change owner role directly. Use transfer ownership.");
    }

    await this.db
      .update(memberships)
      .set({ role: newRole })
      .where(eq(memberships.id, membershipId));
  }

  async remove(membershipId: string, actorUserId: string) {
    const membership = await this.db
      .select()
      .from(memberships)
      .where(eq(memberships.id, membershipId))
      .limit(1);

    if (membership.length === 0) throw notFound("Membership not found");
    if (membership[0].role === "owner") {
      throw forbidden("Cannot remove owner. Transfer ownership first.");
    }

    await this.db
      .delete(memberships)
      .where(eq(memberships.id, membershipId));
  }

  async transferOwnership(
    workspaceId: string,
    newOwnerId: string,
    currentOwnerUserId: string,
  ) {
    const newOwnerMembership = await this.db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.workspaceId, workspaceId),
          eq(memberships.userId, newOwnerId),
        ),
      )
      .limit(1);

    if (newOwnerMembership.length === 0) {
      throw notFound("New owner is not a member of this workspace");
    }

    const currentOwnerMembership = await this.db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.workspaceId, workspaceId),
          eq(memberships.userId, currentOwnerUserId),
        ),
      )
      .limit(1);

    if (currentOwnerMembership.length > 0) {
      await this.db
        .update(memberships)
        .set({ role: "admin" })
        .where(eq(memberships.id, currentOwnerMembership[0].id));
    }

    await this.db
      .update(memberships)
      .set({ role: "owner" })
      .where(eq(memberships.id, newOwnerMembership[0].id));

    await this.db
      .update(workspaces)
      .set({ ownerUserId: newOwnerId })
      .where(eq(workspaces.id, workspaceId));
  }

  async leave(workspaceId: string, userId: string) {
    const membership = await this.db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.workspaceId, workspaceId),
          eq(memberships.userId, userId),
        ),
      )
      .limit(1);

    if (membership.length === 0) throw notFound("Membership not found");
    if (membership[0].role === "owner") {
      throw forbidden("Owner cannot leave. Transfer ownership first.");
    }

    await this.db
      .delete(memberships)
      .where(eq(memberships.id, membership[0].id));
  }
}
