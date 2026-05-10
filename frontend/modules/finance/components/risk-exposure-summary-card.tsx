"use client";

import type { RiskExposureItemView } from "../types/finance-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  title?: string;
  items: RiskExposureItemView[];
  onRowClick?: (item: RiskExposureItemView) => void;
};

const levelColorMap: Record<string, string> = {
  high: "text-red-600",
  medium: "text-amber-600",
  low: "text-green-600",
};

export function RiskExposureSummaryCard({
  title = "Risk Exposure Summary",
  items,
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
              <th className="py-2 pr-3">Category</th>
              <th className="py-2 pr-3">Exposure</th>
              <th className="py-2 pr-3">Limit</th>
              <th className="py-2 pr-3">Utilization</th>
              <th className="py-2 pr-3">Level</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.category}
                className={
                  onRowClick
                    ? "border-b cursor-pointer hover:bg-muted/40"
                    : "border-b"
                }
                onClick={() => onRowClick?.(item)}
              >
                <td className="py-3 pr-3">{item.category}</td>
                <td className="py-3 pr-3">{item.exposure}</td>
                <td className="py-3 pr-3">{item.limit}</td>
                <td className="py-3 pr-3">{item.utilization}</td>
                <td
                  className={`py-3 pr-3 font-medium ${levelColorMap[item.level] ?? ""}`}
                >
                  {item.level}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
