"use client";

import type { CashflowPointView } from "../types/finance-view";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  title?: string;
  data: CashflowPointView[];
  onPointClick?: (point: CashflowPointView) => void;
};

export function CashflowTrendChart({
  title = "Cashflow Trend",
  data,
  onPointClick,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              onClick={(state: any) => {
                const row = state?.activePayload?.[0]?.payload as
                  | CashflowPointView
                  | undefined;
                if (row && onPointClick) onPointClick(row);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="inflow"
                strokeWidth={2}
                stroke="#10b981"
              />
              <Line
                type="monotone"
                dataKey="outflow"
                strokeWidth={2}
                stroke="#ef4444"
              />
              <Line
                type="monotone"
                dataKey="net"
                strokeWidth={2}
                stroke="#3b82f6"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
