/**
 * FinanceAnalysisCard - Structured UI for finance tool results
 * @deprecated Use `FinanceToolUiAdapter` + `MetricKpiCard` instead.
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export function FinanceAnalysisCard({ data }: { data: unknown }) {
  const d = data as Record<string, unknown> | null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-sm">Finance Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Summary</span>
          <span className="font-medium">{d?.summary ?? "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Revenue</span>
          <span className="font-medium">{d?.revenue ?? "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Margin</span>
          <span className="font-medium">{d?.margin ?? "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cash Position</span>
          <span className="font-medium">{d?.cashPosition ?? "-"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
