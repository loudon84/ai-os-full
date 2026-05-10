/**
 * ForecastCard - Structured UI for forecast tool results
 * @deprecated Use `ForecastToolUiAdapter` + `ForecastSummaryCard` instead.
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export function ForecastCard({ data }: { data: unknown }) {
  const d = data as Record<string, unknown> | null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <CardTitle className="text-sm">Forecast Result</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Period</span>
          <span className="font-medium">{d?.period ?? "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Predicted Cash In</span>
          <span className="font-medium text-green-600">{d?.cashIn ?? "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Predicted Cash Out</span>
          <span className="font-medium text-red-600">{d?.cashOut ?? "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Confidence</span>
          <span className="font-medium">{d?.confidence ?? "-"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
