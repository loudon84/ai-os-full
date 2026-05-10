/**
 * Finance Mappers - API response to business model transformations
 */
import type { Money, RiskLevel } from "../types/finance.types";

/** Format Money to display string: "¥1,234,567.89" or "$1,234,567.89" */
export function formatMoney(value: Money, compact?: boolean): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    CNY: "¥",
    JPY: "¥",
  };
  const symbol = symbols[value.currency] || value.currency;
  const amount = value.amount / 100; // convert from cents

  if (compact && Math.abs(amount) >= 1_000_000) {
    return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (compact && Math.abs(amount) >= 1_000) {
    return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  }

  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Get risk level display label */
export function getRiskLevelLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    high: "高风险",
    medium: "中风险",
    low: "低风险",
  };
  return labels[level];
}

/** Get risk level badge variant */
export function getRiskLevelVariant(level: RiskLevel): "destructive" | "warning" | "secondary" {
  const variants: Record<RiskLevel, "destructive" | "warning" | "secondary"> = {
    high: "destructive",
    medium: "warning",
    low: "secondary",
  };
  return variants[level];
}

/** Get anomaly type display label */
export function getAnomalyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    duplicate_reimbursement: "重复报销",
    tax_rate_anomaly: "税率异常",
    large_expense: "大额费用",
    missing_attachment: "附件缺失",
    compliance_risk: "合规风险",
  };
  return labels[type] || type;
}

/** Get anomaly status display label */
export function getAnomalyStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    unprocessed: "未处理",
    ignored: "已忽略",
    confirmed: "已确认",
    escalated: "已升级",
  };
  return labels[status] || status;
}

/** Get report type display label */
export function getReportTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    risk_analysis: "风险分析",
    cashflow_forecast: "现金流预测",
    anomaly_report: "异常报告",
    custom: "自定义",
  };
  return labels[type] || type;
}

/** Get report status display label */
export function getReportStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "草稿",
    pending_approval: "待审批",
    under_review: "审批中",
    approved: "已通过",
    rejected: "已驳回",
  };
  return labels[status] || status;
}

/** Get approval type display label */
export function getApprovalTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    report_approval: "报告审批",
    anomaly_escalation: "异常升级",
    collection_approval: "催收审批",
  };
  return labels[type] || type;
}

/** Get recommended action display label */
export function getRecommendedActionLabel(action: string): string {
  const labels: Record<string, string> = {
    collect: "催收",
    negotiate: "协商",
    escalate: "升级",
    monitor: "监控",
  };
  return labels[action] || action;
}
