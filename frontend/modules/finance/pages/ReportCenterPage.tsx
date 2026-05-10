"use client";

import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReportListTable } from "../components/reports/ReportListTable";
import { FinanceReportEditor } from "../components/reports/FinanceReportEditor";
import { ReportVersionPanel } from "../components/reports/ReportVersionPanel";
import { SourceRefList } from "../components/shared/SourceRefList";
import { StatusPill } from "../components/shared/StatusPill";
import { useReportCenter } from "../hooks/useReportCenter";
import {
  getReportTypeLabel,
  getReportStatusLabel,
} from "../services/finance.mappers";

export default function ReportCenterPage() {
  const {
    selectedId,
    onSelectReport,
    onBackToList,
    listQuery,
    detailQuery,
    editorMode,
    setEditorMode,
  } = useReportCenter();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Breadcrumbs>
          <BreadcrumbItem href="/">首页</BreadcrumbItem>
          <BreadcrumbItem href="/finance">财务</BreadcrumbItem>
          <BreadcrumbItem>报告管理</BreadcrumbItem>
        </Breadcrumbs>
        <h1 className="mt-2 text-2xl font-bold">报告中心</h1>
      </div>

      {/* List view */}
      {!selectedId && (
        <>
          {listQuery.isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64" />
            </div>
          )}

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

          {listQuery.isSuccess && (
            <ReportListTable
              data={listQuery.data.data}
              onSelectReport={onSelectReport}
            />
          )}
        </>
      )}

      {/* Detail view - left-right split */}
      {selectedId && (
        <>
          {detailQuery.isLoading && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-80" />
              </div>
              <Skeleton className="h-80" />
            </div>
          )}

          {detailQuery.isError && (
            <div className="space-y-2">
              <p className="text-sm text-destructive">加载报告详情失败</p>
              <Button variant="outline" size="sm" onClick={onBackToList}>
                返回列表
              </Button>
            </div>
          )}

          {detailQuery.isSuccess && detailQuery.data && (
            <div className="space-y-4">
              {/* Back button + report info */}
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={onBackToList}>
                  ← 返回列表
                </Button>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">
                    {detailQuery.data.name}
                  </h2>
                  <StatusPill
                    status={detailQuery.data.status}
                    label={getReportStatusLabel(detailQuery.data.status)}
                  />
                </div>
              </div>

              {/* Left-right split */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left: Editor */}
                <div className="space-y-4 lg:col-span-2">
                  <FinanceReportEditor
                    content={detailQuery.data.content}
                    mode={editorMode}
                    onModeChange={setEditorMode}
                    versions={detailQuery.data.versions}
                  />

                  {/* Approval flow */}
                  {detailQuery.data.approvalFlow.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">审批流程</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {detailQuery.data.approvalFlow.map((step) => (
                            <li
                              key={step.nodeId}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>
                                {step.name} - {step.assignee}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {step.status}
                                {step.timestamp && ` · ${step.timestamp}`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right: Versions + Sources */}
                <div className="space-y-4">
                  <ReportVersionPanel versions={detailQuery.data.versions} />

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">数据来源</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SourceRefList sources={detailQuery.data.sources} />
                    </CardContent>
                  </Card>

                  {detailQuery.data.reviewComments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">审阅意见</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {detailQuery.data.reviewComments.map((c, i) => (
                            <li key={i} className="text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{c.author}</span>
                                <span className="text-xs text-muted-foreground">
                                  {c.timestamp}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {c.comment}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
