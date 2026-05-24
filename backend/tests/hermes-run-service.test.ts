import { describe, expect, it } from "vitest";

import type { AppConfig } from "../src/config.js";
import { HermesRunService } from "../src/services/hermes/hermes-run.service.js";

function baseConfig(): AppConfig {
  return {
    port: 8000,
    dbUrl: "postgres://localhost/test",
    defaultTenantId: "",
    defaultWorkspaceId: "",
    defaultUserId: "",
    nodeEnv: "test",
    s3Region: "us-east-1",
    s3Bucket: "b",
    s3ForcePathStyle: true,
    snapshotMaxBytes: 1,
    emailDefaultSyncIntervalSec: 300,
    emailSyncEnabled: false,
    emailMaxAttachmentBytes: 1,
    emailAttachmentBucket: "a",
    jwtSecret: "x".repeat(32),
    jwtRefreshSecret: "y".repeat(32),
    jwtAccessExpSec: 900,
    jwtRefreshExpSec: 604800,
    refreshTokenMax: 5,
    loginMaxAttempts: 5,
    loginLockDurationSec: 900,
    workspaceMemberLimit: 100,
    mcpServerEnabled: false,
    mcpServerPort: 8100,
    serviceCenterBaseUrl: "http://127.0.0.1:8000",
    teamTaskPollIntervalSec: 15,
    teamTaskTimeoutHours: 24,
    hermesGatewayTimeoutMs: 30000,
    hermesRunMaxDurationSec: 300,
  } as AppConfig;
}

describe("HermesRunService", () => {
  it("marks run failed when no gateway is available", async () => {
    const repoCalls: Array<Record<string, unknown>> = [];
    const db = {} as never;
    const auditService = { emit: () => undefined } as never;

    const service = new HermesRunService(db, baseConfig(), auditService);
    const repo = {
      createRun: async (_db: unknown, data: Record<string, unknown>) => {
        repoCalls.push({ op: "create", data });
        return {
          id: "run-1",
          workspaceId: data.workspaceId,
          userId: data.userId,
          sessionId: null,
          runType: data.runType,
          gatewayInstanceId: null,
          promptTemplateId: null,
          status: "queued",
          input: data.input,
          contextRefs: data.contextRefs,
          outputText: null,
          errorCode: null,
          errorMessage: null,
          startedAt: null,
          finishedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
      updateRun: async (_db: unknown, _id: string, _ws: string, patch: Record<string, unknown>) => ({
        id: "run-1",
        workspaceId: "ws-1",
        userId: "user-1",
        sessionId: null,
        runType: "chat",
        gatewayInstanceId: null,
        promptTemplateId: null,
        status: patch.status,
        input: { user_message: "hello" },
        contextRefs: [],
        outputText: patch.outputText ?? null,
        errorCode: patch.errorCode ?? null,
        errorMessage: patch.errorMessage ?? null,
        startedAt: patch.startedAt ?? null,
        finishedAt: patch.finishedAt ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    Object.assign(service, {
      repo,
      gatewayRouter: {
        selectGateway: async () => null,
      },
      contextBuilder: {
        buildContext: async () => ({
          workspace: {},
          user: {},
          task: null,
          documents: [],
          emails: [],
          profiles: [],
          skills: [],
          plugins: [],
          audit_summary: [],
          source_refs: [],
        }),
      },
      eventService: {
        appendEvent: async () => ({
          event_id: "evt-1",
          run_id: "run-1",
          workspace_id: "ws-1",
          seq: 1,
          event_type: "run.created",
          payload: {},
          created_at: new Date().toISOString(),
        }),
      },
    });

    const result = await service.createRun(
      {
        userId: "user-1",
        workspaceId: "ws-1",
        tenantId: "t-1",
        roles: [],
        permissions: [],
        authSource: "jwt",
      },
      {
        workspace_id: "ws-1",
        run_type: "chat",
        context_refs: [],
        token_budget: 12000,
        input: { user_message: "hello" },
      },
    );

    expect(result.status).toBe("failed");
    expect(result.error_code).toBe("NO_GATEWAY_AVAILABLE");
    expect(repoCalls.length).toBeGreaterThan(0);
  });

  it("persists gateway SSE events before marking run succeeded", async () => {
    const appendedEvents: Array<{ eventType: string; payload: Record<string, unknown> }> = [];
    const db = {} as never;
    const auditService = { emit: async () => undefined } as never;

    const service = new HermesRunService(db, baseConfig(), auditService);
    const repo = {
      createRun: async (_db: unknown, data: Record<string, unknown>) => ({
        id: "run-1",
        workspaceId: data.workspaceId,
        userId: data.userId,
        sessionId: null,
        runType: data.runType,
        gatewayInstanceId: "gw-inst-1",
        promptTemplateId: null,
        status: "queued",
        input: data.input,
        contextRefs: data.contextRefs,
        outputText: null,
        errorCode: null,
        errorMessage: null,
        startedAt: null,
        finishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      updateRun: async (_db: unknown, _id: string, _ws: string, patch: Record<string, unknown>) => ({
        id: "run-1",
        workspaceId: "ws-1",
        userId: "user-1",
        sessionId: null,
        runType: "chat",
        gatewayInstanceId: "gw-inst-1",
        promptTemplateId: null,
        status: patch.status,
        input: { user_message: "hello" },
        contextRefs: [],
        outputText: patch.outputText ?? null,
        errorCode: patch.errorCode ?? null,
        errorMessage: patch.errorMessage ?? null,
        startedAt: patch.startedAt ?? null,
        finishedAt: patch.finishedAt ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    async function* streamEvents() {
      yield { event_type: "message.delta", payload: { text: "Hello" } };
      yield { event_type: "run.succeeded", payload: { gateway_run_id: "gw-run-1" } };
    }

    Object.assign(service, {
      repo,
      gatewayRouter: {
        selectGateway: async () => ({
          gateway: { id: "gw-inst-1" },
          baseUrl: "http://127.0.0.1:9000",
          authToken: "token",
        }),
      },
      contextBuilder: {
        buildContext: async () => ({
          workspace: {},
          user: {},
          task: null,
          documents: [],
          emails: [],
          profiles: [],
          skills: [],
          plugins: [],
          audit_summary: [],
          source_refs: [],
        }),
      },
      gatewayClient: {
        createRun: async () => ({ gateway_run_id: "gw-run-1", status: "running" }),
        streamRunEvents: streamEvents,
      },
      eventService: {
        appendEvent: async (_db: unknown, data: { eventType: string; payload: Record<string, unknown> }) => {
          appendedEvents.push({ eventType: data.eventType, payload: data.payload });
          return {
            event_id: `evt-${appendedEvents.length}`,
            run_id: "run-1",
            workspace_id: "ws-1",
            seq: appendedEvents.length,
            event_type: data.eventType,
            payload: data.payload,
            created_at: new Date().toISOString(),
          };
        },
        isTerminalEvent: (eventType: string) =>
          eventType === "run.succeeded" || eventType === "run.failed" || eventType === "run.cancelled",
      },
      promptTemplateService: {
        renderTemplate: async () => ({ rendered: "prompt" }),
      },
    });

    const result = await service.createRun(
      {
        userId: "user-1",
        workspaceId: "ws-1",
        tenantId: "t-1",
        roles: [],
        permissions: [],
        authSource: "jwt",
      },
      {
        workspace_id: "ws-1",
        run_type: "chat",
        context_refs: [],
        token_budget: 12000,
        input: { user_message: "hello" },
      },
    );

    expect(result.status).toBe("succeeded");
    expect(result.output_text).toBe("Hello");
    expect(appendedEvents.map((e) => e.eventType)).toEqual([
      "run.created",
      "run.started",
      "message.delta",
      "run.succeeded",
    ]);
    expect(appendedEvents.filter((e) => e.eventType === "run.succeeded")).toHaveLength(1);
  });
});
