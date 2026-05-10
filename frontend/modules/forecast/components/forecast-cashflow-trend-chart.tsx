"use client";

import type { ForecastCashflowPointView } from "../types/forecast-view";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  title?: string;
  data: ForecastCashflowPointView[];
  onPointClick?: (point: ForecastCashflowPointView) => void;
};

export function ForecastCashflowTrendChart({
  title = "Forecast Cashflow Trend",
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
                const row = state?.activePayload?.[0]?.payload as ForecastCashflowPointView | undefined;
                if (row && onPointClick) onPointClick(row);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="cashIn" strokeWidth={2} />
              <Line type="monotone" dataKey="cashOut" strokeWidth={2} />
              <Line type="monotone" dataKey="endingCash" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
