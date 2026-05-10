"use client";

import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FinanceMetricCard } from "../components/shared/FinanceMetricCard";
import { ReceivableFilterBar } from "../components/receivables/ReceivableFilterBar";
import { ReceivableRiskTable } from "../components/receivables/ReceivableRiskTable";
import { ReceivableDetailDrawer } from "../components/receivables/ReceivableDetailDrawer";
import { useReceivablesRisk } from "../hooks/useReceivablesRisk";

export default function ReceivablesRiskPage() {
  const {
    filters,
    onFiltersChange,
    listQuery,
    detailQuery,
    selectedClient,
    setSelectedClient,
  } = useReceivablesRisk();

  const kpi = listQuery.data?.kpi;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Breadcrumbs>
          <BreadcrumbItem href="/">首页</BreadcrumbItem>
          <BreadcrumbItem href="/finance">财务</BreadcrumbItem>
          <BreadcrumbItem>应收风险</BreadcrumbItem>
        </Breadcrumbs>
        <h1 className="mt-2 text-2xl font-bold">应收风险分析</h1>
      </div>

      {/* Filter bar */}
      <ReceivableFilterBar filters={filters} onFiltersChange={onFiltersChange} />

      {/* Loading state */}
      {listQuery.isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      )}

      {/* Error state */}
      {listQuery.isError && (
        <div className="space-y-2">
          <p className="text-sm text-destructive">加载失败，请稍后重试</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => listQuery.refetch()}
          >
            重试
          </Button>
        </div>
      )}

      {/* Success state */}
      {listQuery.isSuccess && (
        <>
          {/* KPI Strip */}
          {kpi && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <FinanceMetricCard title="应收总额" value={kpi.totalReceivables} />
              <FinanceMetricCard title="逾期总额" value={kpi.totalOverdue} />
              <FinanceMetricCard
                title="高风险客户"
                value={{ amount: kpi.highRiskClientCount * 100, currency: "CNY" }}
              />
              <FinanceMetricCard title="坏账预估" value={kpi.badDebtEstimate} />
            </div>
          )}

          {/* Risk table */}
          <ReceivableRiskTable
            data={listQuery.data.data}
            onViewDetail={(clientId) => setSelectedClient(clientId)}
          />
        </>
      )}

      {/* Detail drawer */}
      <ReceivableDetailDrawer
        detail={detailQuery.data}
        open={selectedClient !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedClient(null);
        }}
      />
    </div>
  );
}
