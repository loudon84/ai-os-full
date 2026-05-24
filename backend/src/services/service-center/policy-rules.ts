import type { PolicyRule } from "@portal/db";

export type PolicyRuleSource = "workspace" | "desktop_client";

export interface MergedPolicyRule {
  rule_key: string;
  rule_type: string;
  rule_value: Record<string, unknown>;
  source: PolicyRuleSource;
}

export function mergePolicyRules(input: {
  rules: PolicyRule[];
  bindings: Array<{
    ruleId: string;
    targetType: string;
    targetId: string;
  }>;
  workspaceId: string;
  clientId: string;
}): MergedPolicyRule[] {
  const ruleById = new Map(input.rules.map((rule) => [rule.id, rule]));
  const merged = new Map<string, MergedPolicyRule>();

  for (const binding of input.bindings) {
    if (
      binding.targetType === "workspace" &&
      binding.targetId === input.workspaceId
    ) {
      const rule = ruleById.get(binding.ruleId);
      if (!rule) continue;
      merged.set(rule.ruleKey, {
        rule_key: rule.ruleKey,
        rule_type: rule.ruleType,
        rule_value: rule.ruleValue,
        source: "workspace",
      });
    }
  }

  for (const binding of input.bindings) {
    if (
      binding.targetType === "desktop_client" &&
      binding.targetId === input.clientId
    ) {
      const rule = ruleById.get(binding.ruleId);
      if (!rule) continue;
      merged.set(rule.ruleKey, {
        rule_key: rule.ruleKey,
        rule_type: rule.ruleType,
        rule_value: rule.ruleValue,
        source: "desktop_client",
      });
    }
  }

  for (const rule of input.rules) {
    if (merged.has(rule.ruleKey)) continue;
    merged.set(rule.ruleKey, {
      rule_key: rule.ruleKey,
      rule_type: rule.ruleType,
      rule_value: rule.ruleValue,
      source: "workspace",
    });
  }

  return [...merged.values()];
}

export function buildWorkspacePolicyFromMergedRules(
  mergedRules: MergedPolicyRule[],
): {
  allowed_workspace_roots: string[];
  require_approval_risk_level: string;
  bound_rules: Array<{
    rule_key: string;
    rule_type: string;
    source: PolicyRuleSource;
  }>;
} {
  const policy = {
    allowed_workspace_roots: [] as string[],
    require_approval_risk_level: "high",
    bound_rules: mergedRules.map((rule) => ({
      rule_key: rule.rule_key,
      rule_type: rule.rule_type,
      source: rule.source,
    })),
  };

  for (const rule of mergedRules) {
    if (rule.rule_key === "allowed_workspace_roots") {
      const value = rule.rule_value.roots;
      if (Array.isArray(value)) {
        policy.allowed_workspace_roots = value as string[];
      }
    }
    if (rule.rule_key === "require_approval_risk_level") {
      policy.require_approval_risk_level = String(
        rule.rule_value.level ?? "high",
      );
    }
  }

  return policy;
}
