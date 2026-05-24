import { describe, expect, it } from "vitest";

import { buildBootstrapResponse } from "../src/services/service-center/desktop-sync/bootstrap.service.js";

describe("buildBootstrapResponse", () => {
  it("assembles bootstrap payload for desktop clients", () => {
    const response = buildBootstrapResponse({
      workspaceId: "550e8400-e29b-41d4-a716-446655440030",
      workspaceName: "Default Workspace",
      backendBaseUrl: "http://127.0.0.1:8000",
      teamTaskPollIntervalSec: 15,
      profiles: [{ profile_id: "p1" }],
      skills: [{ skill_id: "s1" }],
      plugins: [{ plugin_id: "pl1" }],
      mcpServers: [{ server_id: "m1" }],
      workspacePolicy: {
        allowed_workspace_roots: ["/workspace"],
        require_approval_risk_level: "high",
      },
      syncCursor: "cursor_abc",
    });

    expect(response.workspace.workspace_id).toBe(
      "550e8400-e29b-41d4-a716-446655440030",
    );
    expect(response.api.backend_base_url).toBe("http://127.0.0.1:8000");
    expect(response.api.team_task_poll_interval_seconds).toBe(15);
    expect(response.profiles).toHaveLength(1);
    expect(response.sync_cursor).toBe("cursor_abc");
    expect(response.workspace_policy.require_approval_risk_level).toBe("high");
  });
});
