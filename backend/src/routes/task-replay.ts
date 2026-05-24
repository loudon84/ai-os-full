import { Router } from "express";
import type { Db } from "@portal/db";
import { taskReplayQuerySchema } from "@portal/shared";

import { badRequest } from "../errors.js";
import { rbacMiddleware } from "../middleware/rbac.js";
import type { TaskReplayService } from "../services/hermes/task-replay.service.js";

function param(req: { params: Record<string, unknown> }, key: string): string {
  return req.params[key] as string;
}

export function taskReplayRoutes(db: Db, service: TaskReplayService): Router {
  const router = Router({ mergeParams: true });

  router.get(
    "/:task_id/replay",
    rbacMiddleware(db, { requiredPermission: "team_task:read" }),
    async (req, res, next) => {
      try {
        const parsed = taskReplayQuerySchema.safeParse(req.query);
        if (!parsed.success) return next(badRequest("Invalid query"));
        const workspaceId = parsed.data.workspace_id ?? req.ctx.workspaceId;
        const data = await service.getReplay(
          db,
          param(req, "task_id"),
          workspaceId,
          parsed.data.limit,
        );
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
