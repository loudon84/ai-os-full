import { describe, expect, it } from "vitest";

import {
  buildWorkspacePolicyFromMergedRules,
  mergePolicyRules,
} from "../src/services/service-center/policy-rules.js";

describe("mergePolicyRules", () => {
  const workspaceId = "550e8400-e29b-41d4-a716-446655440000";
  const clientId = "550e8400-e29b-41d4-a716-446655440001";
  const ruleId = "550e8400-e29b-41d4-a716-446655440002";
  const clientRuleId = "550e8400-e29b-41d4-a716-446655440003";

  it("merges workspace rules and lets desktop_client override same rule_key", () => {
    const merged = mergePolicyRules({
      workspaceId,
      clientId,
      rules: [
        {
          id: ruleId,
          workspaceId,
          ruleKey: "require_approval_risk_level",
          ruleType: "risk",
          ruleValue: { level: "high" },
          createdByUserId: workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: clientRuleId,
          workspaceId,
          ruleKey: "allowed_workspace_roots",
          ruleType: "path",
          ruleValue: { roots: ["E:/client-only"] },
          createdByUserId: workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      bindings: [
        {
          ruleId,
          targetType: "workspace",
          targetId: workspaceId,
        },
        {
          ruleId: clientRuleId,
          targetType: "desktop_client",
          targetId: clientId,
        },
      ],
    });

    const policy = buildWorkspacePolicyFromMergedRules(merged);
    expect(policy.require_approval_risk_level).toBe("high");
    expect(policy.allowed_workspace_roots).toEqual(["E:/client-only"]);
    expect(policy.bound_rules).toHaveLength(2);
    expect(policy.bound_rules[1]?.source).toBe("desktop_client");
  });
});
