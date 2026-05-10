"use client";

import type { RiskAlertSummaryView } from "../types/risk-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  item: RiskAlertSummaryView;
  onClick?: () => void;
};

export function RiskAlertSummaryCard({ item, onClick }: Props) {
  return (
    <Card
      className={onClick ? "cursor-pointer transition hover:bg-muted/40" : ""}
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle>{item.title ?? "Risk Alert"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>Level: {item.level ?? "-"}</div>
        <div>Topic: {item.topic ?? "-"}</div>
        <div>Impact: {item.impact ?? "-"}</div>
        <div>Recommendation: {item.recommendation ?? "-"}</div>
      </CardContent>
    </Card>
  );
}
