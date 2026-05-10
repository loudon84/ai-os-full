"use client";

import type { LiquidityWarningView } from "../types/forecast-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  item: LiquidityWarningView;
  onClick?: () => void;
};

export function LiquidityWarningCard({ item, onClick }: Props) {
  return (
    <Card
      className={onClick ? "cursor-pointer transition hover:bg-muted/40" : ""}
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle>Liquidity Warning</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>Level: {item.level}</div>
        <div>{item.message}</div>
        <div>Suggested Action: {item.suggestedAction ?? "-"}</div>
        <div>Threshold: {item.threshold ?? "-"}</div>
        <div>Actual: {item.actualValue ?? "-"}</div>
      </CardContent>
    </Card>
  );
}
