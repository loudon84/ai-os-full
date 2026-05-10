"use client";

import type { AgingRowView } from "../types/finance-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  rows: AgingRowView[];
  onRowClick?: (row: AgingRowView) => void;
};

export function AgingTable({ rows, onRowClick }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>A/R Aging</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-3">Bucket</th>
              <th className="py-2 pr-3">Amount</th>
              <th className="py-2 pr-3">Ratio</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.bucket}
                className={
                  onRowClick
                    ? "border-b cursor-pointer hover:bg-muted/40"
                    : "border-b"
                }
                onClick={() => onRowClick?.(row)}
              >
                <td className="py-3 pr-3">{row.bucket}</td>
                <td className="py-3 pr-3">{row.amount}</td>
                <td className="py-3 pr-3">{row.ratio ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
