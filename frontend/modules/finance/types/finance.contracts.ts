import type {
  RiskLevel,
  CurrencyCode,
  Money,
  WorkbenchKpi,
  AnalysisTask,
  ReceivableRiskItem,
  ReceivableKpi,
  ReceivableDetail,
  CashflowForecastData,
  ForecastScenario,
  ForecastPeriod,
  AnomalyItem,
  AnomalyStatus,
  AnomalyDetail,
  RuleStatus,
  ReportItem,
  ReportDetail,
  ReportType,
  ReportStatus,
  ApprovalItem,
  ApprovalDetail,
  AuditEntry,
} from "./finance.types";

// ===== 工作台接口 =====

export type GetWorkbenchKpiRequest = {
  dateRange?: string; // "start,end" format
};

export type GetWorkbenchKpiResponse = WorkbenchKpi;

export type PostAnalyzeRequest = {
  query: string;
  filters?: Record<string, unknown>;
  templateId?: string;
};

export type PostAnalyzeResponse = {
  taskId: string;
  status: string;
};

export type GetTaskResponse = AnalysisTask;

export type PostStopTaskResponse = {
  taskId: string;
  status: "stopped";
};

// ===== 应收风险接口 =====

export type GetReceivablesRiskRequest = {
  client?: string;
  region?: string;
  owner?: string;
  riskLevel?: RiskLevel;
  aging?: string;
  currency?: CurrencyCode;
  page?: number;
  pageSize?: number;
};

export type GetReceivablesRiskResponse = {
  data: ReceivableRiskItem[];
  total: number;
  kpi: ReceivableKpi;
};

export type GetReceivableDetailResponse = ReceivableDetail;

// ===== 现金流预测接口 =====

export type GetCashflowForecastRequest = {
  period?: ForecastPeriod;
  scenario?: ForecastScenario;
};

export type GetCashflowForecastResponse = CashflowForecastData;

// ===== 发票异常接口 =====

export type GetInvoiceAnomaliesRequest = {
  type?: string;
  riskLevel?: RiskLevel;
  status?: AnomalyStatus;
  page?: number;
  pageSize?: number;
};

export type GetInvoiceAnomaliesResponse = {
  data: AnomalyItem[];
  total: number;
  ruleStatus: RuleStatus;
};

export type GetAnomalyDetailResponse = AnomalyDetail;

export type PatchAnomalyStatusRequest = {
  status: "confirmed" | "ignored" | "escalated";
};

export type PatchAnomalyStatusResponse = {
  id: string;
  status: AnomalyStatus;
};

// ===== 报告中心接口 =====

export type GetReportsRequest = {
  type?: ReportType;
  status?: ReportStatus;
  page?: number;
  pageSize?: number;
};

export type GetReportsResponse = {
  data: ReportItem[];
  total: number;
};

export type GetReportDetailResponse = ReportDetail;

export type PostCreateReportRequest = {
  name: string;
  type: ReportType;
  taskId?: string;
};

export type PostCreateReportResponse = {
  id: string;
  status: "draft";
};

export type PutUpdateReportRequest = {
  content: string;
  version?: number;
};

export type PutUpdateReportResponse = {
  id: string;
  version: number;
};

export type PostSubmitReportResponse = {
  id: string;
  status: "pending_approval";
};

// ===== 审批审计接口 =====

export type GetApprovalsRequest = {
  tab: "pending" | "done" | "all";
  page?: number;
  pageSize?: number;
};

export type GetApprovalsResponse = {
  data: ApprovalItem[];
  total: number;
};

export type GetApprovalDetailResponse = ApprovalDetail;

export type PostApprovalActionRequest = {
  action: "approve" | "reject";
  comment?: string;
};

export type PostApprovalActionResponse = {
  id: string;
  status: string;
};

export type GetAuditTrailRequest = {
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
};

export type GetAuditTrailResponse = {
  data: AuditEntry[];
};
