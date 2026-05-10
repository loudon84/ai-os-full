"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { RuleStatus } from "../../types/finance.types";

type AnomalyRuleStatusBarProps = {
  ruleStatus: RuleStatus;
};

export function AnomalyRuleStatusBar({
  ruleStatus,
}: AnomalyRuleStatusBarProps) {
  const stats = [
    { label: "启用规则数", value: ruleStatus.enabledRuleCount },
    { label: "异常总数", value: ruleStatus.totalAnomalyCount },
    { label: "高风险数", value: ruleStatus.highRiskCount },
    { label: "已处理数", value: ruleStatus.processedCount },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-xl font-semibold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
