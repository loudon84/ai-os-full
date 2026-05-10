import { Router } from "express";

import type { WorkspaceService } from "../services/rbac/workspace-service.js";
import type { MembershipService } from "../services/rbac/membership-service.js";
import type { RoleService } from "../services/rbac/role-service.js";
import type { PermissionService } from "../services/rbac/permission-service.js";
import { workspaceCreateSchema, workspaceUpdateSchema, membershipCreateSchema, membershipUpdateSchema, roleCreateSchema, roleUpdateSchema, permissionAssignSchema } from "@portal/shared";
import { badRequest, notFound } from "../errors.js";
import { rbacMiddleware, type RbacOptions } from "../middleware/rbac.js";

import type { Db } from "@portal/db";

function param(req: { params: Record<string, unknown> }, key: string): string {
  return req.params[key] as string;
}

export function workspaceRoutes(
  db: Db,
  workspaceService: WorkspaceService,
  membershipService: MembershipService,
  roleService: RoleService,
  permissionService: PermissionService,
): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const workspaces = await workspaceService.list(req.ctx.userId);
      res.json({ items: workspaces });
    } catch (err) {
      next(err);
    }
  });

  router.post("/", rbacMiddleware(db, { requiredPermission: "workspace.create" }), async (req, res, next) => {
    try {
      const parsed = workspaceCreateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));

      const workspace = await workspaceService.create({
        name: parsed.data.name,
        ownerUserId: req.ctx.userId,
      });
      res.status(201).json(workspace);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:workspaceId", rbacMiddleware(db, { requiredPermission: "workspace.read", workspaceIdSource: "param" }), async (req, res, next) => {
    try {
      const workspace = await workspaceService.get(param(req, "workspaceId"));
      res.json(workspace);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:workspaceId", rbacMiddleware(db, { requiredPermission: "workspace.update", workspaceIdSource: "param" }), async (req, res, next) => {
    try {
      const parsed = workspaceUpdateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));

      const workspace = await workspaceService.update(param(req, "workspaceId"), parsed.data);
      res.json(workspace);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:workspaceId", rbacMiddleware(db, { requiredPermission: "workspace.delete", workspaceIdSource: "param" }), async (req, res, next) => {
    try {
      await workspaceService.delete(param(req, "workspaceId"), req.ctx.userId);
      res.json({ message: "Workspace deleted" });
    } catch (err) {
      next(err);
    }
  });

  // Memberships
  router.get("/:workspaceId/memberships", rbacMiddleware(db, { requiredPermission: "workspace.read", workspaceIdSource: "param" }), async (req, res, next) => {
    try {
      const memberships = await membershipService.list(param(req, "workspaceId"));
      res.json({ items: memberships });
    } catch (err) {
      next(err);
    }
  });

  router.post("/:workspaceId/memberships", rbacMiddleware(db, { requiredPermission: "membership.invite", workspaceIdSource: "param" }), async (req, res, next) => {
    try {
      const parsed = membershipCreateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));

      const membership = await membershipService.invite(
        param(req, "workspaceId"),
        parsed.data.user_id,
        parsed.data.role,
      );
      res.status(201).json(membership);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:workspaceId/memberships/:membershipId", rbacMiddleware(db, { requiredPermission: "membership.update", workspaceIdSource: "param" }), async (req, res, next) => {
    try {
      const parsed = membershipUpdateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));

      await membershipService.updateRole(
        param(req, "workspaceId"),
        param(req, "membershipId"),
        parsed.data.role,
        req.ctx.userId,
      );
      res.json({ message: "Role updated" });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:workspaceId/memberships/:membershipId", rbacMiddleware(db, { requiredPermission: "membership.remove", workspaceIdSource: "param" }), async (req, res, next) => {
    try {
      await membershipService.remove(param(req, "membershipId"), req.ctx.userId);
      res.json({ message: "Member removed" });
    } catch (err) {
      next(err);
    }
  });

  router.post("/:workspaceId/transfer-ownership", rbacMiddleware(db, { requiredPermission: "workspace.update", workspaceIdSource: "param" }), async (req, res, next) => {
    try {
      const { new_owner_id } = req.body as { new_owner_id: string };
      if (!new_owner_id) return next(badRequest("new_owner_id is required"));

      await membershipService.transferOwnership(
        param(req, "workspaceId"),
        new_owner_id,
        req.ctx.userId,
      );
      res.json({ message: "Ownership transferred" });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:workspaceId/memberships/me", async (req, res, next) => {
    try {
      await membershipService.leave(param(req, "workspaceId"), req.ctx.userId);
      res.json({ message: "Left workspace" });
    } catch (err) {
      next(err);
    }
  });

  // Roles
  router.get("/:workspaceId/roles", rbacMiddleware(db, { requiredPermission: "workspace.read", workspaceIdSource: "param" }), async (req, res, next) => {
    try {
      const roles = await roleService.list(param(req, "workspaceId"));
      res.json({ items: roles });
    } catch (err) {
      next(err);
    }
  });

  router.post("/:workspaceId/roles", rbacMiddleware(db, { requiredPermission: "role.create", workspaceIdSource: "param" }), async (req, res, next) => {
    try {
      const parsed = roleCreateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));

      const role = await roleService.create(param(req, "workspaceId"), parsed.data);
      res.status(201).json(role);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:workspaceId/roles/:roleId", rbacMiddleware(db, { requiredPermission: "role.update", workspaceIdSource: "param" }), async (req, res, next) => {
    try {
      const parsed = roleUpdateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));

      const role = await roleService.update(param(req, "roleId"), parsed.data);
      res.json(role);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:workspaceId/roles/:roleId", rbacMiddleware(db, { requiredPermission: "role.delete", workspaceIdSource: "param" }), async (req, res, next) => {
    try {
      await roleService.delete(param(req, "roleId"));
      res.json({ message: "Role deleted" });
    } catch (err) {
      next(err);
    }
  });

  // Role permissions
  router.get("/:workspaceId/roles/:roleId/permissions", rbacMiddleware(db, { requiredPermission: "permission.read", workspaceIdSource: "param" }), async (req, res, next) => {
    try {
      const perms = await permissionService.listByRole(param(req, "roleId"));
      res.json({ items: perms });
    } catch (err) {
      next(err);
    }
  });

  router.put("/:workspaceId/roles/:roleId/permissions", rbacMiddleware(db, { requiredPermission: "role.assign_permissions", workspaceIdSource: "param" }), async (req, res, next) => {
    try {
      const parsed = permissionAssignSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));

      await permissionService.assign(param(req, "roleId"), parsed.data.permission_ids);
      res.json({ message: "Permissions assigned" });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
