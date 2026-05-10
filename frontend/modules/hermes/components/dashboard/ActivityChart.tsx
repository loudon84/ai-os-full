"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useHermesActivity } from "../../hooks/useHermesActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ActivityChart() {
  const { activity, query } = useHermesActivity(14);

  if (query.isLoading) {
    return <Skeleton className="h-[380px]" />;
  }

  const formattedData = activity.map((point) => ({
    ...point,
    date: point.date.slice(5), // YYYY-MM-DD → MM-DD
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Activity (14 days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="messages"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Messages"
              />
              <Line
                type="monotone"
                dataKey="toolCalls"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                name="Tool Calls"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
