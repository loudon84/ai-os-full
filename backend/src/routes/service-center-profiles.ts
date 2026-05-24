import { Router } from "express";
import type { Db } from "@portal/db";
import {
  profileCreateSchema,
  profileIdParamSchema,
  profileTemplateCreateSchema,
  profileTemplateIdParamSchema,
  profileUpdateSchema,
} from "@portal/shared";

import { badRequest } from "../errors.js";
import { rbacMiddleware } from "../middleware/rbac.js";
import type { ProfileService } from "../services/service-center/profiles/index.js";

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

export function serviceCenterProfileRoutes(db: Db, service: ProfileService): Router {
  const router = Router();
  const read = rbacMiddleware(db, { requiredPermission: "profile:read" });
  const write = rbacMiddleware(db, { requiredPermission: "profile:write" });

  router.get("/profiles", read, async (req, res, next) => {
    try {
      const wsId = workspaceId(req);
      const result = await service.listProfiles(req.ctx, wsId);
      res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/profiles", write, async (req, res, next) => {
    try {
      const parsed = profileCreateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const data = await service.createProfile(req.ctx, parsed.data);
      res.status(201).json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/profiles/:profile_id", read, async (req, res, next) => {
    try {
      const params = profileIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid profile_id"));
      const wsId = workspaceId(req);
      const data = await service.getProfile(req.ctx, params.data.profile_id, wsId);
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/profiles/:profile_id", write, async (req, res, next) => {
    try {
      const params = profileIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid profile_id"));
      const parsed = profileUpdateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const wsId = workspaceId(req);
      const data = await service.updateProfile(
        req.ctx,
        params.data.profile_id,
        wsId,
        parsed.data,
      );
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/profiles/:profile_id", write, async (req, res, next) => {
    try {
      const params = profileIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid profile_id"));
      const wsId = workspaceId(req);
      const data = await service.deleteProfile(req.ctx, params.data.profile_id, wsId);
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/profile-templates", read, async (req, res, next) => {
    try {
      const wsId = workspaceId(req);
      const result = await service.listTemplates(req.ctx, wsId);
      res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/profile-templates", write, async (req, res, next) => {
    try {
      const parsed = profileTemplateCreateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const data = await service.createTemplate(req.ctx, parsed.data);
      res.status(201).json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/profile-templates/:template_id", read, async (req, res, next) => {
    try {
      const params = profileTemplateIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid template_id"));
      const wsId = workspaceId(req);
      const data = await service.getTemplate(req.ctx, params.data.template_id, wsId);
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/profile-templates/:template_id/publish", write, async (req, res, next) => {
    try {
      const params = profileTemplateIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid template_id"));
      const wsId = workspaceId(req);
      const data = await service.publishTemplate(req.ctx, params.data.template_id, wsId);
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/profiles/:profile_id/manifest", read, async (req, res, next) => {
    try {
      const params = profileIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid profile_id"));
      const wsId = workspaceId(req);
      const data = await service.getManifest(req.ctx, params.data.profile_id, wsId);
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/profiles/:profile_id/manifest", write, async (req, res, next) => {
    try {
      const params = profileIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid profile_id"));
      const wsId = workspaceId(req);
      const data = await service.regenerateManifest(req.ctx, params.data.profile_id, wsId);
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
