import type { RequestHandler } from "express";
import type { AppConfig } from "../config.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface RequestContext {
  tenantId: string;
  workspaceId: string;
  userId: string;
  roles: string[];
  departments: string[];
  authSource: "token" | "header";
  permissions: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      ctx: RequestContext;
    }
  }
}

function parseUuidList(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  const text = Array.isArray(raw) ? raw.join(",") : raw;
  return text
    .split(/[\s,]+/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && UUID_RE.test(v));
}

export function authMiddleware(config: AppConfig): RequestHandler {
  return (req, _res, next) => {
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
    next();
  };
}
