"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type FinanceContextPanelProps = {
  filters?: Record<string, string>;
  riskTags?: string[];
  sources?: { name: string }[];
  executionStatus?: string;
  approvalStatus?: string;
};

function ContextSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

export function FinanceContextPanel({
  filters,
  riskTags,
  sources,
  executionStatus,
  approvalStatus,
}: FinanceContextPanelProps) {
  const hasFilters = filters && Object.keys(filters).length > 0;
  const hasRiskTags = riskTags && riskTags.length > 0;
  const hasSources = sources && sources.length > 0;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-1">
        {/* Current Filters */}
        <ContextSection title="当前筛选">
          {hasFilters ? (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(filters).map(([key, value]) => (
                <Badge key={key} variant="outline" color="secondary" className="text-xs">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">无筛选条件</p>
          )}
        </ContextSection>

        {/* Risk Tags */}
        <ContextSection title="风险标签">
          {hasRiskTags ? (
            <div className="flex flex-wrap gap-1.5">
              {riskTags.map((tag) => (
                <Badge key={tag} color="warning" variant="soft" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">无风险标签</p>
          )}
        </ContextSection>

        {/* Data Sources */}
        <ContextSection title="数据来源">
          {hasSources ? (
            <ul className="space-y-1">
              {sources.map((source, index) => (
                <li key={`${source.name}-${index}`} className="text-sm text-foreground">
                  {source.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">无数据来源</p>
          )}
        </ContextSection>

        {/* Execution Status */}
        <ContextSection title="执行状态">
          {executionStatus ? (
            <Badge
              color={
                executionStatus === "success"
                  ? "success"
                  : executionStatus === "failed"
                    ? "destructive"
                    : executionStatus === "running"
                      ? "info"
                      : "secondary"
              }
              variant="soft"
            >
              {executionStatus}
            </Badge>
          ) : (
            <p className="text-sm text-muted-foreground">未执行</p>
          )}
        </ContextSection>

        {/* Approval Status */}
        <ContextSection title="审批状态">
          {approvalStatus ? (
            <Badge
              color={
                approvalStatus === "approved"
                  ? "success"
                  : approvalStatus === "rejected"
                    ? "destructive"
                    : approvalStatus === "pending"
                      ? "info"
                      : "secondary"
              }
              variant="soft"
            >
              {approvalStatus}
            </Badge>
          ) : (
            <p className="text-sm text-muted-foreground">无审批</p>
          )}
        </ContextSection>
      </div>
    </ScrollArea>
  );
}
