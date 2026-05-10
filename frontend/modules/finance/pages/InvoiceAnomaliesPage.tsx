"use client";

import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { AnomalyRuleStatusBar } from "../components/anomalies/AnomalyRuleStatusBar";
import { InvoiceAnomalyTable } from "../components/anomalies/InvoiceAnomalyTable";
import { AnomalyDetailDrawer } from "../components/anomalies/AnomalyDetailDrawer";
import { useInvoiceAnomalies } from "../hooks/useInvoiceAnomalies";
import { getAnomalyTypeLabel } from "../services/finance.mappers";
import type { AnomalyType } from "../types/finance.types";

const anomalyTypeTabs: { value: AnomalyType | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "duplicate_reimbursement", label: "重复报销" },
  { value: "tax_rate_anomaly", label: "税率异常" },
  { value: "large_expense", label: "大额费用" },
  { value: "missing_attachment", label: "附件缺失" },
  { value: "compliance_risk", label: "合规风险" },
];

export default function InvoiceAnomaliesPage() {
  const {
    activeType,
    setActiveType,
    listQuery,
    detailQuery,
    selectedId,
    setSelectedId,
    onStatusUpdate,
    onViewDetail,
  } = useInvoiceAnomalies();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Breadcrumbs>
          <BreadcrumbItem href="/">首页</BreadcrumbItem>
          <BreadcrumbItem href="/finance">财务</BreadcrumbItem>
          <BreadcrumbItem>发票异常</BreadcrumbItem>
        </Breadcrumbs>
        <h1 className="mt-2 text-2xl font-bold">发票异常检测</h1>
      </div>

      {/* Loading state */}
      {listQuery.isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
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
          {/* Rule status bar */}
          <AnomalyRuleStatusBar ruleStatus={listQuery.data.ruleStatus} />

          {/* Type tabs */}
          <Tabs
            value={activeType}
            onValueChange={(v) => setActiveType(v as AnomalyType | "all")}
          >
            <TabsList>
              {anomalyTypeTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {anomalyTypeTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                <InvoiceAnomalyTable
                  data={listQuery.data.data}
                  onStatusUpdate={onStatusUpdate}
                  onViewDetail={onViewDetail}
                />
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}

      {/* Detail drawer */}
      <AnomalyDetailDrawer
        detail={detailQuery.data}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}
