import { Router } from "express";
import type { Db } from "@portal/db";
import {
  skillIdParamSchema,
  skillInstallSchema,
  skillTemplateCreateSchema,
  skillTemplateUpdateSchema,
  skillVersionCreateSchema,
  skillVersionIdParamSchema,
} from "@portal/shared";

import { badRequest } from "../errors.js";
import { rbacMiddleware } from "../middleware/rbac.js";
import type { SkillTemplateService } from "../services/service-center/skills/index.js";

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

export function serviceCenterSkillRoutes(db: Db, service: SkillTemplateService): Router {
  const router = Router();
  const read = rbacMiddleware(db, { requiredPermission: "skill:read" });
  const write = rbacMiddleware(db, { requiredPermission: "skill:write" });
  const publish = rbacMiddleware(db, { requiredPermission: "skill:publish" });

  router.get("/skill-install-records", read, async (req, res, next) => {
    try {
      const wsId = workspaceId(req);
      const result = await service.listInstallRecords(req.ctx, wsId);
      res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/skill-templates", read, async (req, res, next) => {
    try {
      const wsId = workspaceId(req);
      const result = await service.listTemplates(req.ctx, wsId);
      res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/skill-templates", write, async (req, res, next) => {
    try {
      const parsed = skillTemplateCreateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const data = await service.createTemplate(req.ctx, parsed.data);
      res.status(201).json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/skill-templates/:skill_id", read, async (req, res, next) => {
    try {
      const params = skillIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid skill_id"));
      const wsId = workspaceId(req);
      const data = await service.getTemplate(req.ctx, params.data.skill_id, wsId);
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/skill-templates/:skill_id", write, async (req, res, next) => {
    try {
      const params = skillIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid skill_id"));
      const parsed = skillTemplateUpdateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const wsId = workspaceId(req);
      const data = await service.updateTemplate(
        req.ctx,
        params.data.skill_id,
        wsId,
        parsed.data,
      );
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/skill-templates/:skill_id", write, async (req, res, next) => {
    try {
      const params = skillIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid skill_id"));
      const wsId = workspaceId(req);
      const data = await service.deleteTemplate(req.ctx, params.data.skill_id, wsId);
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/skill-templates/:skill_id/versions", read, async (req, res, next) => {
    try {
      const params = skillIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid skill_id"));
      const wsId = workspaceId(req);
      const result = await service.listVersions(req.ctx, params.data.skill_id, wsId);
      res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/skill-templates/:skill_id/versions", write, async (req, res, next) => {
    try {
      const params = skillIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid skill_id"));
      const parsed = skillVersionCreateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const wsId = workspaceId(req);
      const data = await service.createVersion(
        req.ctx,
        params.data.skill_id,
        wsId,
        parsed.data,
      );
      res.status(201).json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    "/skill-templates/:skill_id/versions/:version_id/publish",
    publish,
    async (req, res, next) => {
      try {
        const params = skillVersionIdParamSchema.safeParse(req.params);
        if (!params.success) return next(badRequest("Invalid params"));
        const wsId = workspaceId(req);
        const data = await service.publishVersion(
          req.ctx,
          params.data.skill_id,
          params.data.version_id,
          wsId,
        );
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post("/skill-templates/:skill_id/install", write, async (req, res, next) => {
    try {
      const params = skillIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid skill_id"));
      const parsed = skillInstallSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const wsId = workspaceId(req);
      const data = await service.installSkill(
        req.ctx,
        params.data.skill_id,
        wsId,
        parsed.data,
      );
      res.status(201).json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
