"use client";

import type { ScenarioComparisonRowView } from "../types/forecast-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  title?: string;
  rows: ScenarioComparisonRowView[];
  onRowClick?: (row: ScenarioComparisonRowView) => void;
};

export function ScenarioComparisonTable({
  title = "Scenario Comparison",
  rows,
  onRowClick,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-3">Scenario</th>
              <th className="py-2 pr-3">Revenue</th>
              <th className="py-2 pr-3">Ending Cash</th>
              <th className="py-2 pr-3">Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.scenario}
                className={onRowClick ? "border-b cursor-pointer hover:bg-muted/40" : "border-b"}
                onClick={() => onRowClick?.(row)}
              >
                <td className="py-3 pr-3">{row.scenario}</td>
                <td className="py-3 pr-3">{row.revenue ?? "-"}</td>
                <td className="py-3 pr-3">{row.endingCash}</td>
                <td className="py-3 pr-3">{row.riskLabel ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
