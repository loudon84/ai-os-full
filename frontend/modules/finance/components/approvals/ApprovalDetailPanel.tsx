"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RiskBadge } from "../shared/RiskBadge";
import { getApprovalTypeLabel } from "../../services/finance.mappers";
import type { ApprovalDetail } from "../../types/finance.types";

type ApprovalDetailPanelProps = {
  detail?: ApprovalDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
};

export function ApprovalDetailPanel({
  detail,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: ApprovalDetailPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>审批详情</SheetTitle>
        </SheetHeader>

        {!detail ? (
          <p className="mt-4 text-sm text-muted-foreground">暂无数据</p>
        ) : (
          <div className="mt-4 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{detail.taskName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">类型</span>
                  <span>{getApprovalTypeLabel(detail.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">提交人</span>
                  <span>{detail.submitter}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">提交时间</span>
                  <span>{detail.submittedAt}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">风险等级</span>
                  <RiskBadge level={detail.riskLevel} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">当前节点</span>
                  <span>{detail.currentNode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SLA</span>
                  <span>{detail.slaHours} 小时</span>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Business Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">业务摘要</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{detail.businessSummary}</p>
              </CardContent>
            </Card>

            {/* AI Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI 分析结果</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{detail.aiAnalysisResult}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action buttons */}
        <SheetFooter className="mt-6 flex-row gap-2">
          <Button
            color="primary"
            className="flex-1"
            onClick={onApprove}
            disabled={!detail}
          >
            通过
          </Button>
          <Button
            color="destructive"
            className="flex-1"
            onClick={onReject}
            disabled={!detail}
          >
            驳回
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
