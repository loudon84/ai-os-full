import { Router } from "express";

import type { PermissionService } from "../services/rbac/permission-service.js";

export function permissionsRoutes(permissionService: PermissionService): Router {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      const perms = await permissionService.listAll();
      res.json({ items: perms });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
