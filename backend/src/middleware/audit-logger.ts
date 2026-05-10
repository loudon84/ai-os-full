import type { RequestHandler } from "express";

import type { AuditService } from "../services/audit/audit-service.js";

export interface AuditLogOptions {
  action: string;
  targetType: string;
  targetIdSource?: "param" | "body";
  targetIdParam?: string;
}

export function auditLogMiddleware(
  auditService: AuditService,
  options: AuditLogOptions,
): RequestHandler {
  return (req, res, next) => {
    const originalEnd = res.end;

    res.end = function (...args: unknown[]) {
      const targetId = options.targetIdSource === "body"
        ? (req.body as Record<string, unknown>)[options.targetIdParam ?? "id"] as string | null
        : options.targetIdParam
          ? (req.params as Record<string, string>)[options.targetIdParam] ?? null
          : null;

      auditService.emit({
        workspaceId: req.ctx.workspaceId || null,
        actorUserId: req.ctx.userId || null,
        action: options.action,
        targetType: options.targetType,
        targetId,
        result: res.statusCode < 400 ? "success" : "failure",
        metadata: null,
      });

      return originalEnd.apply(this, args as Parameters<typeof originalEnd>);
    };

    next();
  };
}
