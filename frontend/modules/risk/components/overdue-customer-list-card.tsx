"use client";

import type { OverdueCustomerRowView } from "../types/risk-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  title?: string;
  rows: OverdueCustomerRowView[];
  onRowClick?: (row: OverdueCustomerRowView) => void;
};

export function OverdueCustomerListCard({
  title = "Overdue Customers",
  rows,
  onRowClick,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div
            key={`${row.customerName}-${row.orderNo ?? ""}`}
            className={onRowClick ? "rounded-md border p-3 cursor-pointer hover:bg-muted/40" : "rounded-md border p-3"}
            onClick={() => onRowClick?.(row)}
          >
            <div className="font-medium text-sm">{row.customerName}</div>
            <div className="text-xs text-muted-foreground">{row.orderNo ?? "-"}</div>
            <div className="mt-2 text-sm">
              {row.amount} · {row.overdueDays} days overdue
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
