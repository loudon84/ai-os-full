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
import { ApprovalQueueTable } from "../components/approvals/ApprovalQueueTable";
import { ApprovalDetailPanel } from "../components/approvals/ApprovalDetailPanel";
import { AuditTrailPanel } from "../components/approvals/AuditTrailPanel";
import { useApprovalsAudit } from "../hooks/useApprovalsAudit";

export default function ApprovalsAuditPage() {
  const {
    activeTab,
    setActiveTab,
    listQuery,
    detailQuery,
    auditQuery,
    selectedId,
    setSelectedId,
    onApprove,
    onReject,
    onViewDetail,
  } = useApprovalsAudit();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Breadcrumbs>
          <BreadcrumbItem href="/">首页</BreadcrumbItem>
          <BreadcrumbItem href="/finance">财务</BreadcrumbItem>
          <BreadcrumbItem>审批中心</BreadcrumbItem>
        </Breadcrumbs>
        <h1 className="mt-2 text-2xl font-bold">审批与审计</h1>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "pending" | "done" | "all")}
      >
        <TabsList>
          <TabsTrigger value="pending">待审批</TabsTrigger>
          <TabsTrigger value="done">已审批</TabsTrigger>
          <TabsTrigger value="all">全部</TabsTrigger>
        </TabsList>

        {(["pending", "done", "all"] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            {/* Loading state */}
            {listQuery.isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64" />
              </div>
            )}

            {/* Error state */}
            {listQuery.isError && (
              <div className="space-y-2">
                <p className="text-sm text-destructive">
                  加载失败，请稍后重试
                </p>
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
              <div className="space-y-6">
                <ApprovalQueueTable
                  data={listQuery.data.data}
                  onApprove={(id) => onApprove(id)}
                  onReject={(id) => onReject(id)}
                  onViewDetail={onViewDetail}
                />

                {/* Audit trail - only in "all" tab */}
                {tab === "all" && auditQuery.data && (
                  <AuditTrailPanel entries={auditQuery.data.data} />
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Detail panel */}
      <ApprovalDetailPanel
        detail={detailQuery.data}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        onApprove={() => {
          if (selectedId) onApprove(selectedId);
        }}
        onReject={() => {
          if (selectedId) onReject(selectedId);
        }}
      />
    </div>
  );
}
