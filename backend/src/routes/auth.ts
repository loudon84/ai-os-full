import { Router } from "express";

import type { AuthService } from "../services/auth/auth-service.js";
import { authRegisterSchema, authLoginSchema, authRefreshSchema, authLogoutSchema } from "@portal/shared";
import { badRequest } from "../errors.js";

export function authRoutes(authService: AuthService): Router {
  const router = Router();

  router.post("/register", async (req, res, next) => {
    try {
      const parsed = authRegisterSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));

      const result = await authService.register(parsed.data);
      res.status(201).json({
        user: {
          id: result.user.id,
          email: result.user.email,
          display_name: result.user.displayName,
        },
        access_token: result.tokens.accessToken,
        refresh_token: result.tokens.refreshToken,
        expires_in: result.tokens.expiresIn,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      const parsed = authLoginSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));

      const result = await authService.login(parsed.data);
      const workspaceId = result.workspaceId;
      res.json({
        user: {
          id: result.user.id,
          email: result.user.email,
          display_name: result.user.displayName,
          status: result.user.status,
          workspace_id: workspaceId,
        },
        access_token: result.tokens.accessToken,
        refresh_token: result.tokens.refreshToken,
        expires_in: result.tokens.expiresIn,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/refresh", async (req, res, next) => {
    try {
      const parsed = authRefreshSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));

      const tokens = await authService.refresh(parsed.data.refresh_token);
      res.json({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_in: tokens.expiresIn,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/logout", async (req, res, next) => {
    try {
      const parsed = authLogoutSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));

      await authService.logout(parsed.data.refresh_token);
      res.json({ message: "Logged out" });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
