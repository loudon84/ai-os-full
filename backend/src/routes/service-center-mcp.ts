import { Router } from "express";
import type { Db } from "@portal/db";
import {
  mcpProfileBindSchema,
  mcpServerCreateSchema,
  mcpServerIdParamSchema,
  mcpServerUpdateSchema,
  mcpToolCreateSchema,
  mcpToolIdParamSchema,
  mcpToolUpdateSchema,
  profileIdParamSchema,
} from "@portal/shared";

import { badRequest } from "../errors.js";
import { rbacMiddleware } from "../middleware/rbac.js";
import type {
  McpHealthService,
  McpServerService,
  McpToolService,
} from "../services/service-center/mcp/index.js";

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

export interface McpRouteDeps {
  serverService: McpServerService;
  toolService: McpToolService;
  healthService: McpHealthService;
}

export function serviceCenterMcpRoutes(db: Db, deps: McpRouteDeps): Router {
  const router = Router();
  const { serverService, toolService, healthService } = deps;
  const read = rbacMiddleware(db, { requiredPermission: "mcp:read" });
  const write = rbacMiddleware(db, { requiredPermission: "mcp:write" });

  router.get("/mcp-servers", read, async (req, res, next) => {
    try {
      const wsId = workspaceId(req);
      const result = await serverService.listServers(req.ctx, wsId);
      res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/mcp-servers", write, async (req, res, next) => {
    try {
      const parsed = mcpServerCreateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const data = await serverService.createServer(req.ctx, parsed.data);
      res.status(201).json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/mcp-servers/:server_id", read, async (req, res, next) => {
    try {
      const params = mcpServerIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid server_id"));
      const wsId = workspaceId(req);
      const data = await serverService.getServer(req.ctx, params.data.server_id, wsId);
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/mcp-servers/:server_id", write, async (req, res, next) => {
    try {
      const params = mcpServerIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid server_id"));
      const parsed = mcpServerUpdateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const wsId = workspaceId(req);
      const data = await serverService.updateServer(
        req.ctx,
        params.data.server_id,
        wsId,
        parsed.data,
      );
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/mcp-servers/:server_id", write, async (req, res, next) => {
    try {
      const params = mcpServerIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid server_id"));
      const wsId = workspaceId(req);
      const data = await serverService.deleteServer(
        req.ctx,
        params.data.server_id,
        wsId,
      );
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/mcp-servers/:server_id/health-check", write, async (req, res, next) => {
    try {
      const params = mcpServerIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid server_id"));
      const wsId = workspaceId(req);
      const data = await healthService.probeServer(
        req.ctx,
        params.data.server_id,
        wsId,
      );
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/mcp-servers/:server_id/health-events", read, async (req, res, next) => {
    try {
      const params = mcpServerIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid server_id"));
      const wsId = workspaceId(req);
      const limit = Number(req.query.limit ?? 20);
      const result = await healthService.listHealthEvents(
        req.ctx,
        params.data.server_id,
        wsId,
        limit,
      );
      res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/mcp-tools", read, async (req, res, next) => {
    try {
      const wsId = workspaceId(req);
      const serverId = req.query.server_id as string | undefined;
      const result = await toolService.listTools(req.ctx, wsId, serverId);
      res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/mcp-tools", write, async (req, res, next) => {
    try {
      const parsed = mcpToolCreateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const data = await toolService.createTool(req.ctx, parsed.data);
      res.status(201).json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/mcp-tools/:tool_id", read, async (req, res, next) => {
    try {
      const params = mcpToolIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid tool_id"));
      const wsId = workspaceId(req);
      const data = await toolService.getTool(req.ctx, params.data.tool_id, wsId);
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/mcp-tools/:tool_id", write, async (req, res, next) => {
    try {
      const params = mcpToolIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid tool_id"));
      const parsed = mcpToolUpdateSchema.safeParse(req.body);
      if (!parsed.success) return next(badRequest("Invalid input"));
      const wsId = workspaceId(req);
      const data = await toolService.updateTool(
        req.ctx,
        params.data.tool_id,
        wsId,
        parsed.data,
      );
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/mcp-tools/:tool_id/enable", write, async (req, res, next) => {
    try {
      const params = mcpToolIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid tool_id"));
      const wsId = workspaceId(req);
      const data = await toolService.setToolEnabled(
        req.ctx,
        params.data.tool_id,
        wsId,
        true,
      );
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/mcp-tools/:tool_id/disable", write, async (req, res, next) => {
    try {
      const params = mcpToolIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid tool_id"));
      const wsId = workspaceId(req);
      const data = await toolService.setToolEnabled(
        req.ctx,
        params.data.tool_id,
        wsId,
        false,
      );
      res.json({ data, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/profiles/:profile_id/mcp-tools", read, async (req, res, next) => {
    try {
      const params = profileIdParamSchema.safeParse(req.params);
      if (!params.success) return next(badRequest("Invalid profile_id"));
      const wsId = workspaceId(req);
      const result = await toolService.listProfileTools(
        req.ctx,
        params.data.profile_id,
        wsId,
      );
      res.json({ ...result, meta: { request_id: req.headers["x-request-id"] ?? null } });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    "/profiles/:profile_id/mcp-tools/:tool_id/bind",
    write,
    async (req, res, next) => {
      try {
        const profileParams = profileIdParamSchema.safeParse(req.params);
        const toolParams = mcpToolIdParamSchema.safeParse(req.params);
        if (!profileParams.success || !toolParams.success) {
          return next(badRequest("Invalid params"));
        }
        const parsed = mcpProfileBindSchema.safeParse(req.body);
        if (!parsed.success) return next(badRequest("Invalid input"));
        const wsId = workspaceId(req);
        const data = await toolService.bindToolToProfile(
          req.ctx,
          profileParams.data.profile_id,
          toolParams.data.tool_id,
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
    "/profiles/:profile_id/mcp-tools/:tool_id",
    write,
    async (req, res, next) => {
      try {
        const profileParams = profileIdParamSchema.safeParse(req.params);
        const toolParams = mcpToolIdParamSchema.safeParse(req.params);
        if (!profileParams.success || !toolParams.success) {
          return next(badRequest("Invalid params"));
        }
        const wsId = workspaceId(req);
        const data = await toolService.unbindToolFromProfile(
          req.ctx,
          profileParams.data.profile_id,
          toolParams.data.tool_id,
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
