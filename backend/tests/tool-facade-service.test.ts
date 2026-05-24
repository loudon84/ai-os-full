import { describe, expect, it } from "vitest";

import { ToolFacadeService } from "../src/services/hermes/tool-facade.service.js";

describe("ToolFacadeService", () => {
  it("executes approved tool call via handler registry", async () => {
    const toolCallService = {
      approveToolCall: async () => ({
        tool_call_id: "tc-1",
        run_id: "run-1",
        workspace_id: "ws-1",
        tool_name: "audit_replay",
        tool_action: "query",
        input: { page: 1 },
        output: null,
        status: "pending",
        risk_level: "high",
        approval_required: true,
        approved_by: "user-1",
        approved_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      getToolCall: async () => ({
        tool_call_id: "tc-1",
        run_id: "run-1",
        workspace_id: "ws-1",
        tool_name: "audit_replay",
        tool_action: "query",
        input: { page: 1 },
        output: null,
        status: "pending",
        risk_level: "high",
        approval_required: true,
        approved_by: "user-1",
        approved_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      finishToolCall: async (_db: unknown, _ctx: unknown, input: { output: Record<string, unknown> }) => ({
        tool_call_id: "tc-1",
        run_id: "run-1",
        workspace_id: "ws-1",
        tool_name: "audit_replay",
        tool_action: "query",
        input: { page: 1 },
        output: input.output,
        status: "succeeded",
        risk_level: "high",
        approval_required: true,
        approved_by: "user-1",
        approved_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    };

    const facade = new ToolFacadeService(toolCallService as never, {
      documentService: {} as never,
      documentRepo: {} as never,
      documentPermission: {} as never,
      emailMessageService: {} as never,
      emailMessageRepo: {} as never,
      teamTaskService: {} as never,
      auditService: {
        query: async () => ({
          items: [
            {
              id: "audit-1",
              action: "hermes.run.succeeded",
              targetType: "hermes_run",
              targetId: "run-1",
              result: "success",
              metadata: null,
              createdAt: new Date("2026-05-24T10:00:00.000Z"),
              workspaceId: "ws-1",
              actorUserId: "user-1",
            },
          ],
          page: 1,
          page_size: 20,
        }),
      } as never,
    });

    const result = await facade.approveAndExecute(
      {} as never,
      {
        userId: "user-1",
        workspaceId: "ws-1",
        tenantId: "t-1",
        roles: [],
        departments: [],
        permissions: [],
        authSource: "token",
      },
      "tc-1",
      "ws-1",
      "approved by reviewer",
    );

    expect(result.output).toMatchObject({
      events: [
        {
          event_id: "audit-1",
          action: "hermes.run.succeeded",
        },
      ],
      page: 1,
      page_size: 20,
    });
    expect(result.tool_call?.status).toBe("succeeded");
  });
});
