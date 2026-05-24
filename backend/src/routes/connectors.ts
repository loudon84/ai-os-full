import { Router } from "express";
import type { Db } from "@portal/db";
import {
  connectorCreateSchema,
  connectorIdParamSchema,
  connectorKeyParamSchema,
  connectorUpdateSchema,
  connectorWebhookPayloadSchema,
} from "@portal/shared";

import { badRequest } from "../errors.js";
import { rbacMiddleware } from "../middleware/rbac.js";
import type { ConnectorService } from "../services/service-center/connectors/index.js";

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

export function connectorRoutes(db: Db, service: ConnectorService): Router {
  const router = Router();

  router.post("/webhooks/:connector_key", async (req, res, next) => {
    try {
      const params = connectorKeyParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid connector_key"));

      const rawBody = req.rawBody ?? "";
      let payloadBody: unknown = req.body;
      if (rawBody && (!payloadBody || Object.keys(payloadBody as object).length === 0)) {
        payloadBody = JSON.parse(rawBody);
      }

      const parsed = connectorWebhookPayloadSchema.safeParse(payloadBody);
      if (!parsed.success) return next(badRequest("Invalid payload"));

      const signature =
        (req.headers["x-webhook-signature"] as string | undefined) ??
        (req.headers["x-signature"] as string | undefined);

      const data = await service.handleWebhook(
        req.ctx,
        params.data.connector_key,
        rawBody,
        signature,
        parsed.data,
      );

      const statusCode = data.status === "processed" ? 201 : 422;
      res.status(statusCode).json({
        data,
        meta: { request_id: req.headers["x-request-id"] ?? null },
      });
    } catch (err) {
      next(err);
    }
  });

  router.get(
    "/",
    rbacMiddleware(db, { requiredPermission: "connector:read" }),
    async (req, res, next) => {
      try {
        const wsId = workspaceId(req);
        const result = await service.listConnectors(req.ctx, wsId);
        res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/",
    rbacMiddleware(db, { requiredPermission: "connector:write" }),
    async (req, res, next) => {
      try {
        const parsed = connectorCreateSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const data = await service.createConnector(req.ctx, parsed.data);
        res.status(201).json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    "/:connector_id",
    rbacMiddleware(db, { requiredPermission: "connector:write" }),
    async (req, res, next) => {
      try {
        const params = connectorIdParamSchema.safeParse(req.params);
        if (!params.success) return next(badRequest("Invalid connector_id"));
        const parsed = connectorUpdateSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const wsId = workspaceId(req);
        const data = await service.updateConnector(
          req.ctx,
          params.data.connector_id,
          wsId,
          parsed.data,
        );
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    "/:connector_id",
    rbacMiddleware(db, { requiredPermission: "connector:write" }),
    async (req, res, next) => {
      try {
        const params = connectorIdParamSchema.safeParse(req.params);
        if (!params.success) return next(badRequest("Invalid connector_id"));
        const wsId = workspaceId(req);
        const data = await service.deleteConnector(
          req.ctx,
          params.data.connector_id,
          wsId,
        );
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
