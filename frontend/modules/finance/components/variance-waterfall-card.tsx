"use client";

import type { VarianceItemView } from "../types/finance-view";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  title?: string;
  items: VarianceItemView[];
  onBarClick?: (item: VarianceItemView) => void;
};

export function VarianceWaterfallCard({
  title = "Variance Waterfall",
  items,
  onBarClick,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={items}
              onClick={(state: any) => {
                const row = state?.activePayload?.[0]?.payload as
                  | VarianceItemView
                  | undefined;
                if (row && onBarClick) onBarClick(row);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {items.map((item, index) => (
                  <Cell
                    key={index}
                    fill={item.isPositive ? "#10b981" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
