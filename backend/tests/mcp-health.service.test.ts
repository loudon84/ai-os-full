import { describe, expect, it, vi } from "vitest";

import { McpRepository } from "../src/services/service-center/mcp/mcp.repository.js";
import { McpHealthService } from "../src/services/service-center/mcp/mcp-health.service.js";

describe("McpHealthService", () => {
  it("records unhealthy when probe fails", async () => {
    vi.spyOn(McpRepository.prototype, "getServer").mockResolvedValue({
      id: "server-1",
      workspaceId: "ws-1",
      name: "Test",
      serverType: "http",
      baseUrl: "http://127.0.0.1:59999",
      config: {},
      enabled: true,
      createdByUserId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const insertSpy = vi.spyOn(McpRepository.prototype, "insertHealthEvent").mockResolvedValue({
      id: "event-1",
      serverId: "server-1",
      workspaceId: "ws-1",
      status: "unhealthy",
      message: "connection refused",
      createdAt: new Date(),
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connection refused");
      }),
    );

    const service = new McpHealthService({} as never, { emit: vi.fn() } as never);
    const result = await service.probeServer(
      {
        userId: "user-1",
        workspaceId: "ws-1",
        tenantId: "ws-1",
        roles: [],
        departments: [],
        authSource: "token",
        permissions: [],
      },
      "server-1",
      "ws-1",
    );

    expect(result.status).toBe("unhealthy");
    expect(insertSpy).toHaveBeenCalledOnce();
  });
});
