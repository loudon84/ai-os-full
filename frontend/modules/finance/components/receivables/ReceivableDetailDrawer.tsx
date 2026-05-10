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
import { SourceRefList } from "../shared/SourceRefList";
import { formatMoney } from "../../services/finance.mappers";
import type { ReceivableDetail } from "../../types/finance.types";

type ReceivableDetailDrawerProps = {
  detail?: ReceivableDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReceivableDetailDrawer({
  detail,
  open,
  onOpenChange,
}: ReceivableDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>客户详情</SheetTitle>
        </SheetHeader>

        {!detail ? (
          <p className="mt-4 text-sm text-muted-foreground">暂无数据</p>
        ) : (
          <div className="mt-4 space-y-6">
            {/* 1. Client Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">客户信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">名称</span>
                  <span>{detail.clientProfile.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">区域</span>
                  <span>{detail.clientProfile.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">行业</span>
                  <span>{detail.clientProfile.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">信用额度</span>
                  <CurrencyCell value={detail.clientProfile.creditLimit} compact />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">付款条件</span>
                  <span>{detail.clientProfile.paymentTerms}</span>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* 2. Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">付款记录</CardTitle>
              </CardHeader>
              <CardContent>
                {detail.paymentHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无记录</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.paymentHistory.map((p, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span>{p.date}</span>
                        <CurrencyCell value={p.amount} compact />
                        <span className="text-xs text-muted-foreground">{p.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* 3. Order Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">订单明细</CardTitle>
              </CardHeader>
              <CardContent>
                {detail.orderDetails.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无订单</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.orderDetails.map((o, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span>{o.orderId}</span>
                        <CurrencyCell value={o.amount} compact />
                        <span className="text-xs text-muted-foreground">{o.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* 4. Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">发票明细</CardTitle>
              </CardHeader>
              <CardContent>
                {detail.invoiceDetails.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无发票</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.invoiceDetails.map((inv, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span>{inv.invoiceId}</span>
                        <CurrencyCell value={inv.amount} compact />
                        <span className="text-xs text-muted-foreground">
                          到期: {inv.dueDate}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* 5. AI Risk Explanation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI 风险解读</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{detail.aiRiskExplanation}</p>
              </CardContent>
            </Card>

            {/* 6. Audit Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">数据来源</CardTitle>
              </CardHeader>
              <CardContent>
                <SourceRefList sources={detail.auditSources} />
              </CardContent>
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
