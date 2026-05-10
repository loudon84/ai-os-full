"use client";

import type { CreditLimitUsageView } from "../types/risk-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  rows: CreditLimitUsageView[];
  onRowClick?: (row: CreditLimitUsageView) => void;
};

export function CreditLimitUsageCard({ rows, onRowClick }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Limit Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.customerName}
            className={onRowClick ? "rounded-md border p-3 cursor-pointer hover:bg-muted/40" : "rounded-md border p-3"}
            onClick={() => onRowClick?.(row)}
          >
            <div className="font-medium text-sm">{row.customerName}</div>
            <div className="mt-2 text-sm">
              Limit: {row.creditLimit} · Used: {row.usedAmount}
            </div>
            <div className="text-xs text-muted-foreground">
              Usage: {row.usageRatio}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
