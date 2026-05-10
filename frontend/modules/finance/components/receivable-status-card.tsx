"use client";

import type { ReceivableStatusView } from "../types/finance-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  rows: ReceivableStatusView[];
  onRowClick?: (row: ReceivableStatusView) => void;
};

export function ReceivableStatusCard({ rows, onRowClick }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receivable Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.orderNo}
            className={
              onRowClick
                ? "rounded-md border p-3 cursor-pointer hover:bg-muted/40"
                : "rounded-md border p-3"
            }
            onClick={() => onRowClick?.(row)}
          >
            <div className="text-sm font-medium">{row.orderNo}</div>
            <div className="text-xs text-muted-foreground">
              {row.customerName}
            </div>
            <div className="mt-2 text-sm">
              {row.amount} · {row.status}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
