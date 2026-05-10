import { Router } from "express";

import type { AuditService } from "../services/audit/audit-service.js";
import { auditListQuerySchema } from "@portal/shared";
import { badRequest, forbidden } from "../errors.js";

function param(req: { params: Record<string, unknown> }, key: string): string {
  return req.params[key] as string;
}

export function auditRoutes(auditService: AuditService): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      if (!req.ctx.roles.includes("super_admin")) {
        return next(forbidden("Only super admins can view all audit events"));
      }

      const parsed = auditListQuerySchema.safeParse(req.query);
      if (!parsed.success) return next(badRequest("Invalid query parameters"));

      const result = await auditService.query(parsed.data);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:workspaceId", async (req, res, next) => {
    try {
      const parsed = auditListQuerySchema.safeParse(req.query);
      if (!parsed.success) return next(badRequest("Invalid query parameters"));

      const result = await auditService.query({
        ...parsed.data,
        workspaceId: param(req, "workspaceId"),
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
