"use client";

import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FinanceModuleShell } from "../components/layout/FinanceModuleShell";
import { FinanceSidebarNav } from "../components/layout/FinanceSidebarNav";
import { FinanceContextPanel } from "../components/layout/FinanceContextPanel";
import { FinanceQueryBar } from "../components/workbench/FinanceQueryBar";
import { FinanceKpiSummary } from "../components/workbench/FinanceKpiSummary";
import { FinanceResultTabs } from "../components/workbench/FinanceResultTabs";
import { FinanceExecutionTimeline } from "../components/workbench/FinanceExecutionTimeline";
import { useFinanceWorkbench } from "../hooks/useFinanceWorkbench";

function WorkbenchSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export default function FinanceWorkbenchPage() {
  const {
    kpi,
    kpiQuery,
    task,
    startAnalysis,
    stopTask,
    activeTab,
    setActiveTab,
    pageState,
  } = useFinanceWorkbench();

  const isRunning = pageState === "running";

  // Center content
  const centerContent = (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Breadcrumbs>
          <BreadcrumbItem href="/">首页</BreadcrumbItem>
          <BreadcrumbItem>财务</BreadcrumbItem>
        </Breadcrumbs>
        <h1 className="mt-2 text-2xl font-bold">财务工作台</h1>
      </div>

      {/* Loading state */}
      {kpiQuery.isLoading && <WorkbenchSkeleton />}

      {/* Error state */}
      {kpiQuery.isError && (
        <div className="space-y-2">
          <p className="text-sm text-destructive">
            加载失败，请稍后重试
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => kpiQuery.refetch()}
          >
            重试
          </Button>
        </div>
      )}

      {/* Success / Running state */}
      {kpiQuery.isSuccess && (
        <>
          <FinanceQueryBar
            onRun={startAnalysis}
            onStop={stopTask}
            isRunning={isRunning}
          />

          {kpi && <FinanceKpiSummary kpi={kpi} />}

          <FinanceResultTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            kpi={kpi}
          />

          <FinanceExecutionTimeline task={task} />
        </>
      )}

      {/* Empty state */}
      {pageState === "no-data" && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">暂无数据，请运行分析查询</p>
        </div>
      )}
    </div>
  );

  return (
    <FinanceModuleShell
      left={<FinanceSidebarNav />}
      center={centerContent}
      right={
        <FinanceContextPanel
          executionStatus={task?.status}
          filters={kpi ? { 模块: "工作台" } : undefined}
        />
      }
    />
  );
}
