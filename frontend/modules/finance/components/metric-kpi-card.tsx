"use client";

import type { FinanceKpiView } from "../types/finance-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  item: FinanceKpiView;
  onClick?: () => void;
};

export function MetricKpiCard({ item, onClick }: Props) {
  return (
    <Card
      className={onClick ? "cursor-pointer transition hover:bg-muted/40" : ""}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-3xl font-semibold">{item.value}</div>
        {item.trend ? (
          <div className="text-xs text-muted-foreground">{item.trend}</div>
        ) : null}
        {item.hint ? (
          <div className="text-xs text-muted-foreground">{item.hint}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
