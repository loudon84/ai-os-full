import { describe, expect, it } from "vitest";

import { HermesToolCallService } from "../src/services/hermes/hermes-tool-call.service.js";

describe("HermesToolCallService", () => {
  it("blocks high-risk tool calls pending approval", async () => {
    const auditService = { emit: () => undefined } as never;
    const service = new HermesToolCallService(auditService);

    const repo = {
      createToolCall: async (_db: unknown, data: Record<string, unknown>) => ({
        id: "tc-1",
        runId: data.runId,
        workspaceId: data.workspaceId,
        toolName: data.toolName,
        toolAction: data.toolAction,
        input: data.input,
        output: null,
        status: data.status,
        riskLevel: data.riskLevel,
        approvalRequired: data.approvalRequired,
        approvedBy: null,
        approvedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    Object.assign(service, {
      repo,
      eventService: {
        appendEvent: async () => ({
          event_id: "evt-1",
          run_id: "run-1",
          workspace_id: "ws-1",
          seq: 1,
          event_type: "approval.requested",
          payload: {},
          created_at: new Date().toISOString(),
        }),
      },
    });

    const result = await service.createToolCall(
      {} as never,
      {
        userId: "user-1",
        workspaceId: "ws-1",
        tenantId: "t-1",
        roles: [],
        permissions: [],
        authSource: "jwt",
      },
      {
        runId: "run-1",
        workspaceId: "ws-1",
        toolName: "email",
        toolAction: "send_direct",
        input: {},
      },
    );

    expect(result.approval_required).toBe(true);
    expect(result.status).toBe("blocked");
  });
});
