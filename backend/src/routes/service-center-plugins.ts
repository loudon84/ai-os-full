import { Router } from "express";
import type { Db } from "@portal/db";
import {
  pluginCreateSchema,
  pluginIdParamSchema,
  pluginInstallSchema,
  pluginUpdateSchema,
  pluginVersionCreateSchema,
} from "@portal/shared";

import { badRequest } from "../errors.js";
import { rbacMiddleware } from "../middleware/rbac.js";
import type { PluginService } from "../services/service-center/plugins/index.js";

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

export function serviceCenterPluginRoutes(db: Db, service: PluginService): Router {
  const router = Router();
  const read = rbacMiddleware(db, { requiredPermission: "plugin:read" });
  const write = rbacMiddleware(db, { requiredPermission: "plugin:write" });

  router.get("/plugins", read, async (req, res, next) => {
    try {
      const wsId = workspaceId(req);
      const result = await service.listPlugins(req.ctx, wsId);
      res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/plugins", write, async (req, res, next) => {
    try {
      const parsed = pluginCreateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const data = await service.createPlugin(req.ctx, parsed.data);
      res.status(201).json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/plugins/:plugin_id", read, async (req, res, next) => {
    try {
      const params = pluginIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid plugin_id"));
      const wsId = workspaceId(req);
      const data = await service.getPlugin(req.ctx, params.data.plugin_id, wsId);
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/plugins/:plugin_id", write, async (req, res, next) => {
    try {
      const params = pluginIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid plugin_id"));
      const parsed = pluginUpdateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const wsId = workspaceId(req);
      const data = await service.updatePlugin(
        req.ctx,
        params.data.plugin_id,
        wsId,
        parsed.data,
      );
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/plugins/:plugin_id", write, async (req, res, next) => {
    try {
      const params = pluginIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid plugin_id"));
      const wsId = workspaceId(req);
      const data = await service.deletePlugin(req.ctx, params.data.plugin_id, wsId);
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/plugins/:plugin_id/versions", read, async (req, res, next) => {
    try {
      const params = pluginIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid plugin_id"));
      const wsId = workspaceId(req);
      const result = await service.listVersions(req.ctx, params.data.plugin_id, wsId);
      res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/plugins/:plugin_id/versions", write, async (req, res, next) => {
    try {
      const params = pluginIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid plugin_id"));
      const parsed = pluginVersionCreateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const wsId = workspaceId(req);
      const data = await service.createVersion(
        req.ctx,
        params.data.plugin_id,
        wsId,
        parsed.data,
      );
      res.status(201).json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/plugins/:plugin_id/install", write, async (req, res, next) => {
    try {
      const params = pluginIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid plugin_id"));
      const parsed = pluginInstallSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const wsId = workspaceId(req);
      const data = await service.installPlugin(
        req.ctx,
        params.data.plugin_id,
        wsId,
        parsed.data,
      );
      res.status(201).json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/plugins/:plugin_id/enable", write, async (req, res, next) => {
    try {
      const params = pluginIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid plugin_id"));
      const wsId = workspaceId(req);
      const data = await service.setEnabled(req.ctx, params.data.plugin_id, wsId, true);
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/plugins/:plugin_id/disable", write, async (req, res, next) => {
    try {
      const params = pluginIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid plugin_id"));
      const wsId = workspaceId(req);
      const data = await service.setEnabled(req.ctx, params.data.plugin_id, wsId, false);
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
