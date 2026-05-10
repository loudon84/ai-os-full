import { Router } from "express";

import type { UserService } from "../services/rbac/user-service.js";
import { userUpdateSchema } from "@portal/shared";
import { badRequest } from "../errors.js";

function param(req: { params: Record<string, unknown> }, key: string): string {
  return req.params[key] as string;
}

export function userRoutes(userService: UserService): Router {
  const router = Router();

  router.get("/me", async (req, res, next) => {
    try {
      const user = await userService.get(req.ctx.userId);
      res.json(user);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/me", async (req, res, next) => {
    try {
      const parsed = userUpdateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));

      const user = await userService.updateMe(req.ctx.userId, {
        displayName: parsed.data.display_name,
      });
      res.json(user);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:userId", async (req, res, next) => {
    try {
      const user = await userService.get(param(req, "userId"));
      res.json(user);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:userId", async (req, res, next) => {
    try {
      const parsed = userUpdateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));

      if (parsed.data.status) {
        await userService.updateStatus(
          param(req, "userId"),
          parsed.data.status,
          req.ctx.userId,
          req.ctx.roles,
        );
      }

      if (parsed.data.display_name) {
        await userService.updateMe(param(req, "userId"), {
          displayName: parsed.data.display_name,
        });
      }

      const user = await userService.get(param(req, "userId"));
      res.json(user);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
