/**
 * Finance API - Unified API call layer
 * Currently uses mock data. Switch to real API calls by changing USE_MOCK to false.
 */
import type {
  RiskLevel,
  CurrencyCode,
  ForecastScenario,
  ForecastPeriod,
  AnomalyStatus,
  ReportType,
  ReportStatus,
} from "../types/finance.types";
import type {
  GetWorkbenchKpiResponse,
  PostAnalyzeRequest,
  PostAnalyzeResponse,
  GetTaskResponse,
  GetReceivablesRiskResponse,
  GetReceivableDetailResponse,
  GetCashflowForecastResponse,
  GetInvoiceAnomaliesResponse,
  GetAnomalyDetailResponse,
  PatchAnomalyStatusResponse,
  GetReportsResponse,
  GetReportDetailResponse,
  PostCreateReportResponse,
  PutUpdateReportResponse,
  PostSubmitReportResponse,
  GetApprovalsResponse,
  GetApprovalDetailResponse,
  PostApprovalActionResponse,
  GetAuditTrailResponse,
} from "../types/finance.contracts";
import * as mock from "../mocks/finance.mock";

const USE_MOCK = true;

// ===== 工作台 =====

export async function getWorkbenchKpi(dateRange?: string): Promise<GetWorkbenchKpiResponse> {
  if (USE_MOCK) return mock.mockGetWorkbenchKpi();
  // TODO: real API call
  throw new Error("Real API not implemented");
}

export async function startAnalysis(request: PostAnalyzeRequest): Promise<PostAnalyzeResponse> {
  if (USE_MOCK) {
    const task = await mock.mockStartAnalysis(request.query);
    return { taskId: task.taskId, status: task.status };
  }
  throw new Error("Real API not implemented");
}

export async function getTask(taskId: string): Promise<GetTaskResponse> {
  if (USE_MOCK) return mock.mockGetTask(taskId);
  throw new Error("Real API not implemented");
}

export async function stopTask(taskId: string): Promise<{ taskId: string; status: "stopped" }> {
  if (USE_MOCK) return { taskId, status: "stopped" };
  throw new Error("Real API not implemented");
}

// ===== 应收风险 =====

export async function getReceivablesRisk(params?: {
  client?: string;
  region?: string;
  owner?: string;
  riskLevel?: RiskLevel;
  aging?: string;
  currency?: CurrencyCode;
  page?: number;
  pageSize?: number;
}): Promise<GetReceivablesRiskResponse> {
  if (USE_MOCK) return mock.mockGetReceivablesRisk();
  throw new Error("Real API not implemented");
}

export async function getReceivableDetail(clientId: string): Promise<GetReceivableDetailResponse> {
  if (USE_MOCK) return mock.mockGetReceivableDetail(clientId);
  throw new Error("Real API not implemented");
}

// ===== 现金流预测 =====

export async function getCashflowForecast(params?: {
  period?: ForecastPeriod;
  scenario?: ForecastScenario;
}): Promise<GetCashflowForecastResponse> {
  if (USE_MOCK) return mock.mockGetCashflowForecast();
  throw new Error("Real API not implemented");
}

// ===== 发票异常 =====

export async function getInvoiceAnomalies(params?: {
  type?: string;
  riskLevel?: RiskLevel;
  status?: AnomalyStatus;
  page?: number;
  pageSize?: number;
}): Promise<GetInvoiceAnomaliesResponse> {
  if (USE_MOCK) return mock.mockGetInvoiceAnomalies();
  throw new Error("Real API not implemented");
}

export async function getAnomalyDetail(id: string): Promise<GetAnomalyDetailResponse> {
  if (USE_MOCK) return mock.mockGetAnomalyDetail(id);
  throw new Error("Real API not implemented");
}

export async function updateAnomalyStatus(id: string, status: "confirmed" | "ignored" | "escalated"): Promise<PatchAnomalyStatusResponse> {
  if (USE_MOCK) return mock.mockUpdateAnomalyStatus(id, status);
  throw new Error("Real API not implemented");
}

// ===== 报告 =====

export async function getReports(params?: {
  type?: ReportType;
  status?: ReportStatus;
  page?: number;
  pageSize?: number;
}): Promise<GetReportsResponse> {
  if (USE_MOCK) return mock.mockGetReports();
  throw new Error("Real API not implemented");
}

export async function getReportDetail(id: string): Promise<GetReportDetailResponse> {
  if (USE_MOCK) return mock.mockGetReportDetail(id);
  throw new Error("Real API not implemented");
}

export async function createReport(name: string, type: ReportType): Promise<PostCreateReportResponse> {
  if (USE_MOCK) return mock.mockCreateReport(name, type);
  throw new Error("Real API not implemented");
}

export async function updateReport(id: string, content: string): Promise<PutUpdateReportResponse> {
  if (USE_MOCK) return { id, version: 1 };
  throw new Error("Real API not implemented");
}

export async function submitReport(id: string): Promise<PostSubmitReportResponse> {
  if (USE_MOCK) return { id, status: "pending_approval" };
  throw new Error("Real API not implemented");
}

// ===== 审批 =====

export async function getApprovals(params?: {
  tab?: "pending" | "done" | "all";
  page?: number;
  pageSize?: number;
}): Promise<GetApprovalsResponse> {
  if (USE_MOCK) return mock.mockGetApprovals();
  throw new Error("Real API not implemented");
}

export async function getApprovalDetail(id: string): Promise<GetApprovalDetailResponse> {
  if (USE_MOCK) return mock.mockGetApprovalDetail(id);
  throw new Error("Real API not implemented");
}

export async function submitApproval(id: string, action: "approve" | "reject", comment?: string): Promise<PostApprovalActionResponse> {
  if (USE_MOCK) return mock.mockSubmitApproval(id, action);
  throw new Error("Real API not implemented");
}

export async function getAuditTrail(params?: {
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
}): Promise<GetAuditTrailResponse> {
  if (USE_MOCK) return mock.mockGetAuditTrail();
  throw new Error("Real API not implemented");
}
