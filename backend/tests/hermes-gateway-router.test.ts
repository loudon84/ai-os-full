import { describe, expect, it } from "vitest";

import type { HermesGatewayInstance } from "@portal/db";

import type { AppConfig } from "../src/config.js";
import { HermesGatewayRouter } from "../src/services/hermes/hermes-gateway-router.js";

function baseConfig(overrides: Partial<AppConfig> = {}): AppConfig {
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
    ...overrides,
  } as AppConfig;
}

function gateway(partial: Partial<HermesGatewayInstance>): HermesGatewayInstance {
  return {
    id: partial.id ?? "gw-1",
    workspaceId: partial.workspaceId ?? "ws-1",
    name: partial.name ?? "primary",
    gatewayType: partial.gatewayType ?? "local",
    baseUrl: partial.baseUrl ?? "http://127.0.0.1:9000",
    authMode: partial.authMode ?? "none",
    authToken: partial.authToken ?? null,
    status: partial.status ?? "healthy",
    modelCapabilities: {},
    toolCapabilities: {},
    lastHealthAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("HermesGatewayRouter", () => {
  it("prefers healthy workspace-bound gateway", async () => {
    const repo = {
      listHealthyGateways: async () => [
        gateway({ id: "gw-workspace", workspaceId: "ws-1", status: "healthy" }),
      ],
      listGateways: async () => [],
    };
    const router = new HermesGatewayRouter(baseConfig());
    Object.assign(router, {
      repo,
    });

    const result = await router.selectGateway({} as never, {
      workspaceId: "ws-1",
    });
    expect(result?.gateway.id).toBe("gw-workspace");
  });

  it("falls back to config default gateway when db has none", async () => {
    const repo = {
      listHealthyGateways: async () => [],
      listGateways: async () => [],
    };
    const router = new HermesGatewayRouter(
      baseConfig({ hermesGatewayBaseUrl: "http://127.0.0.1:9100" }),
    );
    Object.assign(router, { repo });

    const result = await router.selectGateway({} as never, { workspaceId: "ws-1" });
    expect(result?.baseUrl).toBe("http://127.0.0.1:9100");
  });

  it("returns null when no gateway and no config default", async () => {
    const repo = {
      listHealthyGateways: async () => [],
      listGateways: async () => [],
    };
    const router = new HermesGatewayRouter(baseConfig());
    Object.assign(router, { repo });

    const result = await router.selectGateway({} as never, { workspaceId: "ws-1" });
    expect(result).toBeNull();
  });
});
