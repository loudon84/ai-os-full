"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrendPoint } from "../../types/finance.types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type CashflowTrendPanelProps = {
  trend: TrendPoint[];
};

export function CashflowTrendPanel({ trend }: CashflowTrendPanelProps) {
  const categories = trend.map((p) => p.date);
  const inflowData = trend.map((p) => p.inflow);
  const outflowData = trend.map((p) => Math.abs(p.outflow));

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "area",
      stacked: false,
      toolbar: { show: false },
    },
    xaxis: {
      categories,
      labels: { rotate: -45, style: { fontSize: "10px" } },
    },
    yaxis: {
      labels: {
        formatter: (val: number) =>
          val >= 1_000_000
            ? `${(val / 1_000_000).toFixed(1)}M`
            : val >= 1_000
              ? `${(val / 1_000).toFixed(0)}K`
              : `${val}`,
      },
    },
    colors: ["#10b981", "#ef4444"],
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.6, opacityTo: 0.1 } },
    dataLabels: { enabled: false },
    tooltip: { shared: true, intersect: false },
    legend: { position: "top" },
  };

  const chartSeries: ApexCharts.ApexOptions["series"] = [
    { name: "流入", data: inflowData },
    { name: "流出", data: outflowData },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">现金流趋势</CardTitle>
      </CardHeader>
      <CardContent>
        {trend.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无趋势数据</p>
        ) : (
          <Chart options={chartOptions} series={chartSeries} type="area" height={320} />
        )}
      </CardContent>
    </Card>
  );
}
