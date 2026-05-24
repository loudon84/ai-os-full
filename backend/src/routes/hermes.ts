import { Router } from "express";
import type { Db } from "@portal/db";
import {
  hermesChatSchema,
  hermesGatewayCreateSchema,
  hermesGatewayUpdateSchema,
  hermesRunEventsQuerySchema,
  hermesRunListQuerySchema,
  hermesToolCallApproveSchema,
  hermesToolCallRejectSchema,
  hermesToolDispatchSchema,
  promptTemplateCreateSchema,
  promptTemplateRenderSchema,
  promptTemplateUpdateSchema,
} from "@portal/shared";

import { badRequest } from "../errors.js";
import { idempotencyMiddleware } from "../middleware/idempotency.js";
import { rbacMiddleware } from "../middleware/rbac.js";
import type {
  HermesEventService,
  HermesRunService,
  HermesToolCallService,
  PromptTemplateService,
  ToolFacadeService,
} from "../services/hermes/index.js";

function param(req: { params: Record<string, unknown> }, key: string): string {
  return req.params[key] as string;
}

function workspaceId(req: {
  ctx: { workspaceId: string };
  body: Record<string, unknown>;
  query: Record<string, unknown>;
}): string {
  return (
    (req.body.workspace_id as string) ||
    (req.query.workspace_id as string) ||
    req.ctx.workspaceId
  );
}

export function hermesRoutes(
  db: Db,
  services: {
    runService: HermesRunService;
    eventService: HermesEventService;
    toolCallService: HermesToolCallService;
    toolFacadeService: ToolFacadeService;
    promptTemplateService: PromptTemplateService;
  },
): Router {
  const router = Router();
  const { runService, eventService, toolCallService, toolFacadeService, promptTemplateService } =
    services;

  router.post(
    "/chat",
    rbacMiddleware(db, { requiredPermission: "hermes:write" }),
    idempotencyMiddleware(),
    async (req, res, next) => {
      try {
        const parsed = hermesChatSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const data = await runService.chat(req.ctx, parsed.data);
        res.status(201).json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/runs",
    rbacMiddleware(db, { requiredPermission: "hermes:read" }),
    async (req, res, next) => {
      try {
        const parsed = hermesRunListQuerySchema.safeParse(req.query);
        if (!parsed.success) return next(badRequest("Invalid query"));
        const wsId = parsed.data.workspace_id ?? req.ctx.workspaceId;
        const result = await runService.listRuns(wsId, parsed.data);
        res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/runs/:run_id",
    rbacMiddleware(db, { requiredPermission: "hermes:read" }),
    async (req, res, next) => {
      try {
        const wsId = workspaceId(req);
        const data = await runService.getRun(param(req, "run_id"), wsId);
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/runs/:run_id/events",
    rbacMiddleware(db, { requiredPermission: "hermes:read" }),
    async (req, res, next) => {
      try {
        const parsed = hermesRunEventsQuerySchema.safeParse(req.query);
        if (!parsed.success) return next(badRequest("Invalid query"));
        const wsId = workspaceId(req);
        const data = await eventService.listEvents(
          db,
          param(req, "run_id"),
          wsId,
          parsed.data.after_seq,
          parsed.data.limit,
        );
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/runs/:run_id/stream",
    rbacMiddleware(db, { requiredPermission: "hermes:read" }),
    async (req, res, next) => {
      try {
        const parsed = hermesRunEventsQuerySchema.safeParse(req.query);
        if (!parsed.success) return next(badRequest("Invalid query"));
        const wsId = workspaceId(req);
        await runService.streamEvents(
          res,
          param(req, "run_id"),
          wsId,
          parsed.data.after_seq,
          parsed.data.limit,
        );
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/tool-calls/dispatch",
    rbacMiddleware(db, { requiredPermission: "hermes:write" }),
    idempotencyMiddleware(),
    async (req, res, next) => {
      try {
        const parsed = hermesToolDispatchSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const wsId = parsed.data.workspace_id ?? req.ctx.workspaceId;
        const data = await toolFacadeService.dispatch(db, req.ctx, {
          runId: parsed.data.run_id,
          workspaceId: wsId,
          toolName: parsed.data.tool_name,
          toolAction: parsed.data.tool_action,
          payload: parsed.data.payload,
        });
        res.status(201).json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/runs/:run_id/cancel",
    rbacMiddleware(db, { requiredPermission: "hermes:write" }),
    async (req, res, next) => {
      try {
        const wsId = workspaceId(req);
        const data = await runService.cancelRun(req.ctx, param(req, "run_id"), wsId);
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/gateways",
    rbacMiddleware(db, { requiredPermission: "hermes:read" }),
    async (req, res, next) => {
      try {
        const wsId = (req.query.workspace_id as string) || req.ctx.workspaceId;
        const data = await runService.listGateways(wsId);
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/gateways",
    rbacMiddleware(db, { requiredPermission: "hermes:write" }),
    async (req, res, next) => {
      try {
        const parsed = hermesGatewayCreateSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const data = await runService.createGateway(req.ctx, parsed.data);
        res.status(201).json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    "/gateways/:gateway_id",
    rbacMiddleware(db, { requiredPermission: "hermes:write" }),
    async (req, res, next) => {
      try {
        const parsed = hermesGatewayUpdateSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const data = await runService.updateGateway(param(req, "gateway_id"), parsed.data);
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/gateways/:gateway_id/health-check",
    rbacMiddleware(db, { requiredPermission: "hermes:write" }),
    async (req, res, next) => {
      try {
        const data = await runService.healthCheckGateway(param(req, "gateway_id"));
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/prompt-templates",
    rbacMiddleware(db, { requiredPermission: "hermes:read" }),
    async (req, res, next) => {
      try {
        const wsId = (req.query.workspace_id as string) || req.ctx.workspaceId;
        const data = await promptTemplateService.listTemplates(db, wsId);
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/prompt-templates",
    rbacMiddleware(db, { requiredPermission: "hermes:write" }),
    async (req, res, next) => {
      try {
        const parsed = promptTemplateCreateSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const data = await promptTemplateService.createTemplate(db, req.ctx, parsed.data);
        res.status(201).json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    "/prompt-templates/:template_id",
    rbacMiddleware(db, { requiredPermission: "hermes:write" }),
    async (req, res, next) => {
      try {
        const parsed = promptTemplateUpdateSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const wsId = workspaceId(req);
        const data = await promptTemplateService.updateTemplate(
          db,
          param(req, "template_id"),
          wsId,
          parsed.data,
        );
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/prompt-templates/:template_id/render",
    rbacMiddleware(db, { requiredPermission: "hermes:read" }),
    async (req, res, next) => {
      try {
        const parsed = promptTemplateRenderSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const wsId = workspaceId(req);
        const data = await promptTemplateService.renderTemplate(
          db,
          param(req, "template_id"),
          wsId,
          parsed.data.variables,
        );
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/tool-calls/:tool_call_id/approve",
    rbacMiddleware(db, { requiredPermission: "hermes:approve" }),
    async (req, res, next) => {
      try {
        const parsed = hermesToolCallApproveSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const wsId = workspaceId(req);
        const data = await toolFacadeService.approveAndExecute(
          db,
          req.ctx,
          param(req, "tool_call_id"),
          wsId,
          parsed.data.reason,
        );
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/tool-calls/:tool_call_id/reject",
    rbacMiddleware(db, { requiredPermission: "hermes:approve" }),
    async (req, res, next) => {
      try {
        const parsed = hermesToolCallRejectSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const wsId = workspaceId(req);
        const data = await toolCallService.rejectToolCall(
          db,
          req.ctx,
          param(req, "tool_call_id"),
          wsId,
          parsed.data.reason,
        );
        res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
