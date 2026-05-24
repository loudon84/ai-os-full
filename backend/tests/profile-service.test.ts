import { describe, expect, it } from "vitest";

import { buildProfileManifest } from "../src/services/service-center/profiles/profile.service.js";

describe("buildProfileManifest", () => {
  it("builds manifest without local runtime fields", () => {
    const manifest = buildProfileManifest({
      profile: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        workspaceId: "550e8400-e29b-41d4-a716-446655440001",
        roleKey: "analyst",
        roleName: "Analyst",
        displayName: "Finance Analyst",
        description: "Handles finance tasks",
      },
      modelConfig: {
        provider: "openai",
        planner_model: "gpt-4",
        pid: 12345,
        port: 8765,
        gateway_port: 9000,
      },
      tools: [
        {
          tool_key: "documents.read",
          enabled: true,
          permission_scope: ["documents:read"],
        },
      ],
      skills: [
        {
          skill_id: "550e8400-e29b-41d4-a716-446655440002",
          version_id: "550e8400-e29b-41d4-a716-446655440003",
          enabled: true,
        },
      ],
      mcpServers: [
        {
          server_id: "550e8400-e29b-41d4-a716-446655440004",
          enabled: true,
        },
      ],
      policy: {
        allow_file_write: false,
        allow_shell: false,
        require_approval_risk_level: "high",
      },
    });

    expect(manifest.profile_id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(manifest.model_config).toEqual({
      provider: "openai",
      planner_model: "gpt-4",
    });
    expect(manifest.model_config).not.toHaveProperty("pid");
    expect(manifest.model_config).not.toHaveProperty("port");
    expect(manifest.tools).toHaveLength(1);
    expect(manifest.policy.require_approval_risk_level).toBe("high");
  });
});
