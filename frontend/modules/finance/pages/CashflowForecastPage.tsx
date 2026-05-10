"use client";

import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FinanceMetricCard } from "../components/shared/FinanceMetricCard";
import { ForecastScenarioTabs } from "../components/forecast/ForecastScenarioTabs";
import { CashflowTrendPanel } from "../components/forecast/CashflowTrendPanel";
import { ForecastFactorTable } from "../components/forecast/ForecastFactorTable";
import { useCashflowForecast } from "../hooks/useCashflowForecast";
import { formatMoney } from "../services/finance.mappers";

export default function CashflowForecastPage() {
  const {
    period,
    setPeriod,
    scenario,
    setScenario,
    forecastQuery,
  } = useCashflowForecast();

  const data = forecastQuery.data;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Breadcrumbs>
          <BreadcrumbItem href="/">首页</BreadcrumbItem>
          <BreadcrumbItem href="/finance">财务</BreadcrumbItem>
          <BreadcrumbItem>现金流预测</BreadcrumbItem>
        </Breadcrumbs>
        <h1 className="mt-2 text-2xl font-bold">现金流预测</h1>
      </div>

      {/* Scenario tabs */}
      <ForecastScenarioTabs
        period={period}
        onPeriodChange={setPeriod}
        scenario={scenario}
        onScenarioChange={setScenario}
      />

      {/* Loading state */}
      {forecastQuery.isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      )}

      {/* Error state */}
      {forecastQuery.isError && (
        <div className="space-y-2">
          <p className="text-sm text-destructive">加载失败，请稍后重试</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => forecastQuery.refetch()}
          >
            重试
          </Button>
        </div>
      )}

      {/* Success state */}
      {forecastQuery.isSuccess && data && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <FinanceMetricCard
              title="净现金流"
              value={data.summary.netCashflow}
            />
            <FinanceMetricCard
              title="最低现金头寸"
              value={data.summary.minCashPosition}
            />
            <FinanceMetricCard
              title="缺口预警"
              value={{
                amount: data.summary.hasGapWarning ? 100 : 0,
                currency: "CNY",
              }}
            />
            <FinanceMetricCard
              title="峰值付款日"
              value={{
                amount: 0,
                currency: "CNY",
              }}
            />
          </div>

          {/* Trend chart */}
          <CashflowTrendPanel trend={data.trend} />

          {/* Factor tables */}
          <ForecastFactorTable factors={data.factors} />

          {/* AI Recommendations */}
          {data.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI 建议</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{rec.title}</span>
                        <span className="text-xs text-muted-foreground">
                          ({rec.type})
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {rec.description}
                      </p>
                      <p className="text-xs">
                        预计影响: {formatMoney(rec.impact)}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Assumptions (Collapsible) */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                ▶ 模型假设
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2">
                <CardContent className="p-4 space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">数据口径：</span>
                    {data.assumptions.dataCaliber}
                  </p>
                  <p>
                    <span className="text-muted-foreground">模型说明：</span>
                    {data.assumptions.modelDescription}
                  </p>
                  <p>
                    <span className="text-muted-foreground">审计备注：</span>
                    {data.assumptions.auditNote}
                  </p>
                  {data.assumptions.conditions.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">前提条件：</span>
                      <ul className="mt-1 list-inside list-disc">
                        {data.assumptions.conditions.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </div>
  );
}
