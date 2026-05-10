"use client";

import type { ForecastSummaryView } from "../types/forecast-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  item: ForecastSummaryView;
  onClick?: () => void;
};

export function ForecastSummaryCard({ item, onClick }: Props) {
  return (
    <Card
      className={onClick ? "cursor-pointer transition hover:bg-muted/40" : ""}
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle>Forecast Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>Period: {item.period}</div>
        <div>Cash In: {item.cashIn}</div>
        <div>Cash Out: {item.cashOut}</div>
        <div>Ending Cash: {item.endingCash}</div>
        <div>Confidence: {item.confidence ?? "-"}</div>
      </CardContent>
    </Card>
  );
}
