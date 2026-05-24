import { Router } from "express";
import type { Db } from "@portal/db";
import {
  teamTaskAckSchema,
  teamTaskApproveSchema,
  teamTaskAssignSchema,
  teamTaskAssignedClientParamSchema,
  teamTaskAssignedQuerySchema,
  teamTaskCreateSchema,
  teamTaskListQuerySchema,
  teamTaskRejectSchema,
  teamTaskResultSchema,
  teamTaskStatusSchema,
  teamTaskUpdateSchema,
} from "@portal/shared";

import { badRequest } from "../errors.js";
import {
  requireDesktopClientId,
} from "../middleware/desktop-client.js";
import { rbacMiddleware } from "../middleware/rbac.js";
import type { TeamTaskService } from "../services/team-tasks/team-task.service.js";

function param(req: { params: Record<string, unknown> }, key: string): string {
  return req.params[key] as string;
}

function workspaceFromBodyOrCtx(req: {
  ctx: { workspaceId: string };
  body: Record<string, unknown>;
}): string {
  return (req.body.workspace_id as string) || req.ctx.workspaceId;
}

export function teamTaskRoutes(db: Db, service: TeamTaskService): Router {
  const router = Router();

  router.post(
    "/",
    rbacMiddleware(db, { requiredPermission: "team_task:create" }),
    async (req, res, next) => {
      try {
        const parsed = teamTaskCreateSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const data = await service.createTask(req.ctx, parsed.data);
        res
          .status(201)
          .json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/assigned/:desktop_client_id",
    rbacMiddleware(db, { requiredPermission: "team_task:execute" }),
    async (req, res, next) => {
      try {
        const params = teamTaskAssignedClientParamSchema.safeParse(req.params);
        if (!params.success) return next(badRequest("Invalid desktop_client_id"));
        const headerClientId = requireDesktopClientId(req);
        if (headerClientId !== params.data.desktop_client_id) {
          return next(badRequest("Path desktop_client_id must match X-Desktop-Client-Id"));
        }
        const parsed = teamTaskAssignedQuerySchema.safeParse(req.query);
        if (!parsed.success) return next(badRequest("Invalid query"));
        const result = await service.listAssigned(req.ctx, {
          ...parsed.data,
          client_id: params.data.desktop_client_id,
        });
        res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/assigned",
    rbacMiddleware(db, { requiredPermission: "team_task:execute" }),
    async (req, res, next) => {
      try {
        const clientId = requireDesktopClientId(req);
        const parsed = teamTaskAssignedQuerySchema.safeParse(req.query);
        if (!parsed.success) return next(badRequest("Invalid query"));
        const result = await service.listAssigned(req.ctx, {
          ...parsed.data,
          client_id: clientId,
        });
        res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/",
    rbacMiddleware(db, { requiredPermission: "team_task:read" }),
    async (req, res, next) => {
      try {
        const parsed = teamTaskListQuerySchema.safeParse(req.query);
        if (!parsed.success) return next(badRequest("Invalid query"));
        const result = await service.listTasks(req.ctx, parsed.data);
        res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/:task_id",
    rbacMiddleware(db, { requiredPermission: "team_task:read" }),
    async (req, res, next) => {
      try {
        const workspaceId =
          (req.query.workspace_id as string) || req.ctx.workspaceId;
        const data = await service.getTask(req.ctx, param(req, "task_id"), workspaceId);
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    "/:task_id",
    rbacMiddleware(db, { requiredPermission: "team_task:create" }),
    async (req, res, next) => {
      try {
        const parsed = teamTaskUpdateSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const workspaceId = workspaceFromBodyOrCtx(req);
        const data = await service.updateTask(
          req.ctx,
          param(req, "task_id"),
          workspaceId,
          parsed.data,
        );
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/:task_id/assign",
    rbacMiddleware(db, { requiredPermission: "team_task:assign" }),
    async (req, res, next) => {
      try {
        const parsed = teamTaskAssignSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const workspaceId = workspaceFromBodyOrCtx(req);
        const data = await service.assignTask(
          req.ctx,
          param(req, "task_id"),
          workspaceId,
          parsed.data,
        );
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/:task_id/ack",
    rbacMiddleware(db, { requiredPermission: "team_task:execute" }),
    async (req, res, next) => {
      try {
        const parsed = teamTaskAckSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const workspaceId = workspaceFromBodyOrCtx(req);
        const desktopClientId =
          requireDesktopClientId(req) ?? parsed.data.desktop_client_id ?? undefined;
        const data = await service.ackTask(req.ctx, param(req, "task_id"), workspaceId, {
          ...parsed.data,
          desktop_client_id: desktopClientId ?? null,
        });
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/:task_id/approve",
    rbacMiddleware(db, { requiredPermission: "team_task:approve" }),
    async (req, res, next) => {
      try {
        const parsed = teamTaskApproveSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const workspaceId = workspaceFromBodyOrCtx(req);
        const data = await service.approveTask(
          req.ctx,
          param(req, "task_id"),
          workspaceId,
          parsed.data,
        );
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/:task_id/reject",
    rbacMiddleware(db, { requiredPermission: "team_task:approve" }),
    async (req, res, next) => {
      try {
        const parsed = teamTaskRejectSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const workspaceId = workspaceFromBodyOrCtx(req);
        const data = await service.rejectTask(
          req.ctx,
          param(req, "task_id"),
          workspaceId,
          parsed.data,
        );
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/:task_id/status",
    rbacMiddleware(db, { requiredPermission: "team_task:execute" }),
    async (req, res, next) => {
      try {
        const parsed = teamTaskStatusSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const workspaceId = workspaceFromBodyOrCtx(req);
        const desktopClientId =
          requireDesktopClientId(req) ?? parsed.data.desktop_client_id ?? undefined;
        const data = await service.updateStatus(
          req.ctx,
          param(req, "task_id"),
          workspaceId,
          {
            ...parsed.data,
            desktop_client_id: desktopClientId ?? null,
          },
        );
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/:task_id/result",
    rbacMiddleware(db, { requiredPermission: "team_task:execute" }),
    async (req, res, next) => {
      try {
        const parsed = teamTaskResultSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const workspaceId = workspaceFromBodyOrCtx(req);
        const desktopClientId =
          requireDesktopClientId(req) ?? parsed.data.desktop_client_id ?? undefined;
        const data = await service.submitResult(
          req.ctx,
          param(req, "task_id"),
          workspaceId,
          {
            ...parsed.data,
            desktop_client_id: desktopClientId ?? null,
          },
        );
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/:task_id/cancel",
    rbacMiddleware(db, { requiredPermission: "team_task:cancel" }),
    async (req, res, next) => {
      try {
        const workspaceId = workspaceFromBodyOrCtx(req);
        const data = await service.cancelTask(
          req.ctx,
          param(req, "task_id"),
          workspaceId,
        );
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/:task_id/retry",
    rbacMiddleware(db, { requiredPermission: "team_task:cancel" }),
    async (req, res, next) => {
      try {
        const workspaceId = workspaceFromBodyOrCtx(req);
        const data = await service.retryTask(
          req.ctx,
          param(req, "task_id"),
          workspaceId,
        );
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/:task_id/events",
    rbacMiddleware(db, { requiredPermission: "team_task:read" }),
    async (req, res, next) => {
      try {
        const workspaceId =
          (req.query.workspace_id as string) || req.ctx.workspaceId;
        const result = await service.listEvents(
          req.ctx,
          param(req, "task_id"),
          workspaceId,
        );
        res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
