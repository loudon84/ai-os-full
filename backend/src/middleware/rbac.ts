import type { RequestHandler } from "express";
import { eq, and } from "drizzle-orm";

import type { Db } from "@portal/db";
import { memberships, roles, rolePermissions, permissions } from "@portal/db";

import { forbidden, badRequest } from "../errors.js";

export interface RbacOptions {
  requiredPermission?: string;
  workspaceIdSource?: "param" | "ctx";
}

export function rbacMiddleware(db: Db, options: RbacOptions = {}): RequestHandler {
  return async (req, _res, next) => {
    try {
      if (req.ctx.permissions.includes("*") || req.ctx.roles.includes("super_admin")) {
        return next();
      }

      const workspaceId =
        options.workspaceIdSource === "param"
          ? (req.params as Record<string, string>).workspaceId
          : req.ctx.workspaceId;

      if (!workspaceId) {
        if (options.requiredPermission) {
          return next(badRequest("Workspace ID is required for permission check"));
        }
        return next();
      }

      const userPermissionsResult = await db
        .select({ permissionCode: permissions.code })
        .from(memberships)
        .innerJoin(roles, eq(memberships.role, roles.code))
        .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
          and(
            eq(memberships.workspaceId, workspaceId),
            eq(memberships.userId, req.ctx.userId),
          ),
        );

      const userPermissions = userPermissionsResult.map((r) => r.permissionCode);
      req.ctx.permissions = userPermissions;

      if (userPermissions.includes("*")) {
        return next();
      }

      if (options.requiredPermission) {
        if (!userPermissions.includes(options.requiredPermission)) {
          return next(forbidden(`Permission denied: ${options.requiredPermission}`));
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
