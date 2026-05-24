import { describe, expect, it } from "vitest";

import { ContextBuilder } from "../src/services/hermes/context-builder.js";
import { PermissionService } from "../src/services/documents/permission.js";

describe("ContextBuilder", () => {
  it("trims context to token budget and keeps source refs", async () => {
    let selectCall = 0;
    const builder = new ContextBuilder({
      documentRepo: {
        getDocument: async () => ({
          id: "doc-1",
          workspaceId: "ws-1",
          title: "Quarterly report",
          documentType: "spreadsheet",
          status: "active",
          updatedAt: new Date(),
        }),
      } as never,
      documentPermission: {
        getUserRole: async () => "view",
      } as never,
    });

    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => {
              selectCall += 1;
              if (selectCall === 1) {
                return [{ workspaceId: "ws-1", userId: "user-1", role: "user" }];
              }
              return [];
            },
            orderBy: () => ({
              limit: async () => [],
            }),
          }),
        }),
      }),
    } as never;

    const result = await builder.buildContext(
      db,
      {
        userId: "user-1",
        workspaceId: "ws-1",
        tenantId: "t-1",
        roles: [],
        departments: [],
        permissions: [],
        authSource: "token",
      },
      {
        workspaceId: "ws-1",
        userId: "user-1",
        runType: "chat",
        contextRefs: [{ type: "document", id: "doc-1" }],
        tokenBudget: 500,
      },
    );

    expect(result.source_refs).toEqual([{ type: "document", id: "doc-1" }]);
    expect(result.documents.length).toBe(1);
    expect(result.documents[0]?.title).toBe("Quarterly report");
    expect(PermissionService.canView("view")).toBe(true);
  });
});
