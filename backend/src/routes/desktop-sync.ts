import { Router } from "express";
import type { Db } from "@portal/db";
import {
  desktopBootstrapSchema,
  desktopClientIdParamSchema,
  desktopHeartbeatSchema,
  desktopRegisterSchema,
  desktopSyncSchema,
} from "@portal/shared";

import { badRequest } from "../errors.js";
import { rbacMiddleware } from "../middleware/rbac.js";
import type {
  BootstrapService,
  DesktopClientService,
} from "../services/service-center/desktop-sync/index.js";

function workspaceId(req: {
  ctx: { workspaceId: string };
  query: Record<string, unknown>;
  body: Record<string, unknown>;
}): string {
  return (
    (req.query.workspace_id as string) ||
    (req.body.workspace_id as string) ||
    req.ctx.workspaceId
  );
}

export interface DesktopSyncRouteDeps {
  clientService: DesktopClientService;
  bootstrapService: BootstrapService;
}

export function desktopSyncRoutes(db: Db, deps: DesktopSyncRouteDeps): Router {
  const router = Router();
  const { clientService, bootstrapService } = deps;
  const bootstrap = rbacMiddleware(db, { requiredPermission: "desktop:bootstrap" });
  const read = rbacMiddleware(db, { requiredPermission: "profile:read" });
  const write = rbacMiddleware(db, { requiredPermission: "profile:write" });

  router.post("/register", bootstrap, async (req, res, next) => {
    try {
      const parsed = desktopRegisterSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const data = await clientService.registerClient(req.ctx, parsed.data);
      res.status(201).json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/bootstrap", bootstrap, async (req, res, next) => {
    try {
      const parsed = desktopBootstrapSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const data = await bootstrapService.bootstrap(req.ctx, parsed.data);
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/sync", bootstrap, async (req, res, next) => {
    try {
      const parsed = desktopSyncSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const data = await clientService.syncClient(req.ctx, parsed.data);
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/heartbeat", bootstrap, async (req, res, next) => {
    try {
      const parsed = desktopHeartbeatSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const data = await clientService.recordHeartbeat(req.ctx, parsed.data);
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/clients", read, async (req, res, next) => {
    try {
      const wsId = workspaceId(req);
      const result = await clientService.listClients(req.ctx, wsId);
      res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/clients/:client_id", read, async (req, res, next) => {
    try {
      const params = desktopClientIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid client_id"));
      const wsId = workspaceId(req);
      const data = await clientService.getClient(
        req.ctx,
        params.data.client_id,
        wsId,
      );
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/clients/:client_id/revoke", write, async (req, res, next) => {
    try {
      const params = desktopClientIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid client_id"));
      const wsId = workspaceId(req);
      const reason = (req.body.reason as string | undefined) ?? null;
      const data = await clientService.revokeClient(
        req.ctx,
        params.data.client_id,
        wsId,
        reason,
      );
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
