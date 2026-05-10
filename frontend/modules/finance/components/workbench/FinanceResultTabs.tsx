"use client";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { FinanceAiExplanation } from "./FinanceAiExplanation";
import type { WorkbenchKpi } from "../../types/finance.types";

type WorkbenchTab = "overview" | "detail" | "risk" | "ai-explain" | "report";

type FinanceResultTabsProps = {
  activeTab: WorkbenchTab;
  onTabChange: (tab: WorkbenchTab) => void;
  kpi?: WorkbenchKpi | null;
};

export function FinanceResultTabs({
  activeTab,
  onTabChange,
  kpi,
}: FinanceResultTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as WorkbenchTab)}>
      <TabsList>
        <TabsTrigger value="overview">概览</TabsTrigger>
        <TabsTrigger value="detail">明细</TabsTrigger>
        <TabsTrigger value="risk">风险</TabsTrigger>
        <TabsTrigger value="ai-explain">AI 解读</TabsTrigger>
        <TabsTrigger value="report">报告</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <Card>
          <CardContent className="p-6">
            {kpi ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">分析概览</p>
                <p className="text-lg font-medium">
                  应收 {kpi.totalReceivables.amount / 100} | 应付{" "}
                  {kpi.totalPayables.amount / 100} | 逾期{" "}
                  {kpi.overdueAmount.amount / 100}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                暂无数据，请运行分析查询
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="detail">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              明细数据表格（待分析完成后展示）
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="risk">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              风险分析视图（待分析完成后展示）
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ai-explain">
        <FinanceAiExplanation />
      </TabsContent>

      <TabsContent value="report">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              报告生成（待分析完成后展示）
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
