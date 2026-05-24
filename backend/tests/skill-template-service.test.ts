import { describe, expect, it } from "vitest";

import { buildSkillManifest } from "../src/services/service-center/skills/skill-template.service.js";

describe("buildSkillManifest", () => {
  it("builds skill manifest from template and version", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const manifest = buildSkillManifest({
      template: {
        id: "550e8400-e29b-41d4-a716-446655440010",
        name: "Email Draft",
        description: "Draft emails",
        category: "email",
        skillType: "email_skill",
      },
      version: {
        id: "550e8400-e29b-41d4-a716-446655440011",
        entryFile: "SKILL.md",
        variablesSchema: { tone: { type: "string" } },
        requiredPermissions: ["email:write"],
        compatibleProfiles: ["analyst"],
        createdAt,
      },
      files: [
        {
          path: "SKILL.md",
          checksum: "abc123",
          content_type: "text/markdown",
        },
      ],
    });

    expect(manifest.skill_id).toBe("550e8400-e29b-41d4-a716-446655440010");
    expect(manifest.version_id).toBe("550e8400-e29b-41d4-a716-446655440011");
    expect(manifest.entry_file).toBe("SKILL.md");
    expect(manifest.files[0]?.checksum).toBe("abc123");
    expect(manifest.created_at).toBe(createdAt.toISOString());
  });
});
