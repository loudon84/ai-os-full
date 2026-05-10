"use client";

import type { RiskExposureRowView } from "../types/risk-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  title?: string;
  rows: RiskExposureRowView[];
  onRowClick?: (row: RiskExposureRowView) => void;
};

export function RiskExposureTable({ title = "Risk Exposure", rows, onRowClick }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-3">Customer</th>
              <th className="py-2 pr-3">Exposure</th>
              <th className="py-2 pr-3">Overdue</th>
              <th className="py-2 pr-3">Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.customerName}
                className={onRowClick ? "border-b cursor-pointer hover:bg-muted/40" : "border-b"}
                onClick={() => onRowClick?.(row)}
              >
                <td className="py-3 pr-3">{row.customerName}</td>
                <td className="py-3 pr-3">{row.exposureAmount}</td>
                <td className="py-3 pr-3">{row.overdueAmount ?? "-"}</td>
                <td className="py-3 pr-3">{row.riskLevel ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
