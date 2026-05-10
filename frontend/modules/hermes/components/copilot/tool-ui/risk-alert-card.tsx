/**
 * RiskAlertCard - Structured UI for risk tool results
 * @deprecated Use `RiskToolUiAdapter` instead.
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function RiskAlertCard({ data }: { data: unknown }) {
  const d = data as Record<string, unknown> | null;

  const levelVariant = (d?.level as string) === "high" ? "destructive" : "secondary";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <CardTitle className="text-sm">Risk Alert</CardTitle>
          {d?.level && <Badge variant={levelVariant}>{d.level as string}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Topic</span>
          <span className="font-medium">{d?.topic ?? "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Impact</span>
          <span className="font-medium">{d?.impact ?? "-"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Recommendation</span>
          <p className="mt-1 font-medium">{d?.recommendation ?? "-"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
