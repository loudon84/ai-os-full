"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CurrencyCell } from "../shared/CurrencyCell";
import { RiskBadge } from "../shared/RiskBadge";
import { StatusPill } from "../shared/StatusPill";
import {
  getAnomalyTypeLabel,
  getAnomalyStatusLabel,
} from "../../services/finance.mappers";
import type { AnomalyDetail } from "../../types/finance.types";

type AnomalyDetailDrawerProps = {
  detail?: AnomalyDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AnomalyDetailDrawer({
  detail,
  open,
  onOpenChange,
}: AnomalyDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>异常详情</SheetTitle>
        </SheetHeader>

        {!detail ? (
          <p className="mt-4 text-sm text-muted-foreground">暂无数据</p>
        ) : (
          <div className="mt-4 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">单据号</span>
                  <span>{detail.documentNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">提交人</span>
                  <span>{detail.submitter}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">部门</span>
                  <span>{detail.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">金额</span>
                  <CurrencyCell value={detail.amount} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">异常类型</span>
                  <span>{getAnomalyTypeLabel(detail.anomalyType)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">风险等级</span>
                  <RiskBadge level={detail.riskLevel} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">状态</span>
                  <StatusPill
                    status={detail.status}
                    label={getAnomalyStatusLabel(detail.status)}
                  />
                </div>
                <div>
                  <span className="text-muted-foreground">原因</span>
                  <p className="mt-1">{detail.reason}</p>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Hit Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">命中规则</CardTitle>
              </CardHeader>
              <CardContent>
                {detail.hitRules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">无命中规则</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.hitRules.map((rule) => (
                      <li key={rule.ruleId} className="text-sm">
                        <div className="flex items-center gap-2">
                          <RiskBadge level={rule.severity} />
                          <span className="font-medium">{rule.ruleName}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {rule.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Similar Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">相似单据</CardTitle>
              </CardHeader>
              <CardContent>
                {detail.similarDocuments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">无相似单据</p>
                ) : (
                  <ul className="space-y-1">
                    {detail.similarDocuments.map((doc) => (
                      <li key={doc.id} className="flex items-center justify-between text-sm">
                        <span>{doc.documentNumber}</span>
                        <CurrencyCell value={doc.amount} compact />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* AI Explanation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI 解读</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{detail.aiExplanation}</p>
              </CardContent>
            </Card>

            {/* Suggested Action */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">建议操作</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{detail.suggestedAction}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
