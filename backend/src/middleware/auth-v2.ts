import type { RequestHandler } from "express";
import type { AppConfig } from "../config.js";
import type { AuthProvider } from "../auth-provider/auth-provider.js";
import { AuthProviderError } from "../auth-provider/auth-provider.js";
import { unauthorized, forbidden } from "../errors.js";
import { logger } from "./logger.js";

export function authV2Middleware(
  config: AppConfig,
  authProvider: AuthProvider,
): RequestHandler {
  const publicPaths = [
    "/api/v1/auth/register",
    "/api/v1/auth/login",
    "/api/v1/auth/refresh",
    "/health",
  ];

  return async (req, _res, next) => {
    try {
      if (publicPaths.some((p) => req.path === p || req.originalUrl === p)) {
        req.ctx = {
          tenantId: config.defaultTenantId,
          workspaceId: config.defaultWorkspaceId,
          userId: config.defaultUserId,
          roles: [],
          departments: [],
          authSource: "public",
          permissions: [],
        };
        return next();
      }

      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        try {
          const principal = await authProvider.verifyAccessToken(token);
          req.ctx = {
            tenantId: principal.workspaceId ?? config.defaultTenantId,
            workspaceId: principal.workspaceId ?? config.defaultWorkspaceId,
            userId: principal.userId,
            roles: principal.roles,
            departments: [],
            authSource: "token",
            permissions: [],
          };
          return next();
        } catch (err) {
          if (err instanceof AuthProviderError) {
            if (err.code === "user_disabled") {
              return next(forbidden("User account is disabled"));
            }
            return next(unauthorized("Invalid or expired token"));
          }
          return next(unauthorized("Invalid or expired token"));
        }
      }

      const hasLegacyHeaders =
        req.headers["x-user-id"] ||
        req.headers["x-tenant-id"] ||
        req.headers["x-workspace-id"];

      if (hasLegacyHeaders) {
        logger.warn(
          {
            path: req.path,
            headers: Object.keys(req.headers),
          },
          "Legacy header auth used — migrate to Bearer token",
        );

        const UUID_RE =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        function parseUuidList(raw: string | string[] | undefined): string[] {
          if (!raw) return [];
          const text = Array.isArray(raw) ? raw.join(",") : raw;
          return text
            .split(/[\s,]+/)
            .map((v) => v.trim())
            .filter((v) => v.length > 0 && UUID_RE.test(v));
        }

        req.ctx = {
          tenantId:
            (req.headers["x-tenant-id"] as string) || config.defaultTenantId,
          workspaceId:
            (req.headers["x-workspace-id"] as string) || config.defaultWorkspaceId,
          userId:
            (req.headers["x-user-id"] as string) || config.defaultUserId,
          roles: parseUuidList(req.headers["x-roles"]),
          departments: parseUuidList(req.headers["x-departments"]),
          authSource: "header",
          permissions: [],
        };
        return next();
      }

      return next(unauthorized("Authentication required"));
    } catch (err) {
      next(err);
    }
  };
}
