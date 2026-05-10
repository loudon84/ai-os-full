import type {
  WorkbenchKpi,
  AnalysisTask,
  ReceivableRiskItem,
  ReceivableKpi,
  ReceivableDetail,
  CashflowForecastData,
  AnomalyItem,
  RuleStatus,
  AnomalyDetail,
  ReportItem,
  ReportDetail,
  ApprovalItem,
  ApprovalDetail,
  AuditEntry,
} from "../types/finance.types";
import {
  seedWorkbenchKpi,
  seedReceivableKpi,
  seedReceivableItems,
  seedReceivableDetail,
  seedCashflowForecast,
  seedRuleStatus,
  seedAnomalyItems,
  seedAnomalyDetail,
  seedReportItems,
  seedReportDetail,
  seedApprovalItems,
  seedApprovalDetail,
  seedAuditEntries,
} from "./finance.seed";

// Simulate async delay
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// ===== 工作台 =====
export async function mockGetWorkbenchKpi(): Promise<WorkbenchKpi> {
  await delay();
  return seedWorkbenchKpi;
}

export async function mockStartAnalysis(query: string): Promise<AnalysisTask> {
  await delay(500);
  return {
    taskId: `task-${Date.now()}`,
    status: "running",
    steps: [
      { stepId: "s1", name: "解析查询意图", status: "success", startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
      { stepId: "s2", name: "获取数据", status: "running", startedAt: new Date().toISOString() },
      { stepId: "s3", name: "执行分析", status: "pending" },
      { stepId: "s4", name: "生成结果", status: "pending" },
    ],
  };
}

export async function mockGetTask(taskId: string): Promise<AnalysisTask> {
  await delay();
  return {
    taskId,
    status: "success",
    steps: [
      { stepId: "s1", name: "解析查询意图", status: "success", startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
      { stepId: "s2", name: "获取数据", status: "success", startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
      { stepId: "s3", name: "执行分析", status: "success", startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
      { stepId: "s4", name: "生成结果", status: "success", startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
    ],
    result: { summary: `分析完成: ${taskId}`, data: {} },
  };
}

// ===== 应收风险 =====
export async function mockGetReceivablesRisk(): Promise<{
  data: ReceivableRiskItem[];
  total: number;
  kpi: ReceivableKpi;
}> {
  await delay();
  return { data: seedReceivableItems, total: seedReceivableItems.length, kpi: seedReceivableKpi };
}

export async function mockGetReceivableDetail(clientId: string): Promise<ReceivableDetail> {
  await delay();
  return { ...seedReceivableDetail, clientProfile: { ...seedReceivableDetail.clientProfile, clientId } };
}

// ===== 现金流预测 =====
export async function mockGetCashflowForecast(): Promise<CashflowForecastData> {
  await delay();
  return seedCashflowForecast;
}

// ===== 发票异常 =====
export async function mockGetInvoiceAnomalies(): Promise<{
  data: AnomalyItem[];
  total: number;
  ruleStatus: RuleStatus;
}> {
  await delay();
  return { data: seedAnomalyItems, total: seedAnomalyItems.length, ruleStatus: seedRuleStatus };
}

export async function mockGetAnomalyDetail(id: string): Promise<AnomalyDetail> {
  await delay();
  return { ...seedAnomalyDetail, id };
}

export async function mockUpdateAnomalyStatus(id: string, status: "confirmed" | "ignored" | "escalated"): Promise<{ id: string; status: "confirmed" | "ignored" | "escalated" }> {
  await delay();
  return { id, status };
}

// ===== 报告 =====
export async function mockGetReports(): Promise<{ data: ReportItem[]; total: number }> {
  await delay();
  return { data: seedReportItems, total: seedReportItems.length };
}

export async function mockGetReportDetail(id: string): Promise<ReportDetail> {
  await delay();
  return { ...seedReportDetail, id };
}

export async function mockCreateReport(name: string, type: string): Promise<{ id: string; status: "draft" }> {
  await delay();
  return { id: `r-${Date.now()}`, status: "draft" };
}

// ===== 审批 =====
export async function mockGetApprovals(): Promise<{ data: ApprovalItem[]; total: number }> {
  await delay();
  return { data: seedApprovalItems, total: seedApprovalItems.length };
}

export async function mockGetApprovalDetail(id: string): Promise<ApprovalDetail> {
  await delay();
  return { ...seedApprovalDetail, id };
}

export async function mockSubmitApproval(id: string, action: string): Promise<{ id: string; status: string }> {
  await delay();
  return { id, status: action === "approve" ? "approved" : "rejected" };
}

export async function mockGetAuditTrail(): Promise<{ data: AuditEntry[] }> {
  await delay();
  return { data: seedAuditEntries };
}
