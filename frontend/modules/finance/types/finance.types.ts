// ===== 通用类型 =====

export type RiskLevel = "high" | "medium" | "low";

export type CurrencyCode = "USD" | "EUR" | "CNY" | "JPY" | string; // ISO 4217

export type Money = {
  amount: number; // 以分为单位
  currency: CurrencyCode;
};

// ===== 工作台 =====

export type WorkbenchKpi = {
  totalReceivables: Money;
  totalPayables: Money;
  overdueAmount: Money;
  cashflowForecast30d: Money;
  highRiskClientCount: number;
};

export type AnalysisTaskStatus = "pending" | "running" | "success" | "failed" | "stopped";

export type AnalysisStepStatus = "pending" | "running" | "success" | "failed";

export type AnalysisStep = {
  stepId: string;
  name: string;
  status: AnalysisStepStatus;
  startedAt?: string;
  completedAt?: string;
};

export type AnalysisResult = {
  summary: string;
  data: Record<string, unknown>;
};

export type AnalysisTask = {
  taskId: string;
  status: AnalysisTaskStatus;
  steps: AnalysisStep[];
  result?: AnalysisResult;
};

// ===== 应收风险 =====

export type RecommendedAction = "collect" | "negotiate" | "escalate" | "monitor";

export type ReceivableRiskItem = {
  clientId: string;
  clientName: string;
  receivableBalance: Money;
  overdueAmount: Money;
  maxOverdueDays: number;
  riskLevel: RiskLevel;
  riskReasons: string[];
  recommendedAction: RecommendedAction;
};

export type ReceivableKpi = {
  totalReceivables: Money;
  totalOverdue: Money;
  highRiskClientCount: number;
  badDebtEstimate: Money;
};

export type ClientProfile = {
  clientId: string;
  name: string;
  region: string;
  industry: string;
  creditLimit: Money;
  paymentTerms: string;
};

export type PaymentRecord = {
  date: string;
  amount: Money;
  status: "paid" | "partial" | "overdue";
};

export type OrderItem = {
  orderId: string;
  date: string;
  amount: Money;
  status: string;
};

export type InvoiceItem = {
  invoiceId: string;
  date: string;
  amount: Money;
  dueDate: string;
  status: string;
};

export type AuditSource = {
  name: string;
  href?: string;
  timestamp?: string;
};

export type ReceivableDetail = {
  clientProfile: ClientProfile;
  paymentHistory: PaymentRecord[];
  orderDetails: OrderItem[];
  invoiceDetails: InvoiceItem[];
  aiRiskExplanation: string;
  auditSources: AuditSource[];
};

// ===== 现金流预测 =====

export type ForecastScenario = "optimistic" | "baseline" | "pessimistic";

export type ForecastPeriod = 30 | 60 | 90;

export type CashflowForecastSummary = {
  netCashflow: Money;
  minCashPosition: Money;
  hasGapWarning: boolean;
  peakPaymentDate: string | null;
};

export type TrendPoint = {
  date: string;
  inflow: number;
  outflow: number;
  net: number;
  isGap: boolean;
};

export type ForecastFactor = {
  name: string;
  amount: Money;
  impact: "positive" | "negative";
  dueDate: string;
};

export type ForecastRecommendation = {
  type: "payment_adjustment" | "collection" | "transfer";
  title: string;
  description: string;
  impact: Money;
};

export type ForecastAssumptions = {
  dataCaliber: string;
  conditions: string[];
  modelDescription: string;
  auditNote: string;
};

export type CashflowForecastData = {
  summary: CashflowForecastSummary;
  trend: TrendPoint[];
  factors: {
    clients: ForecastFactor[];
    suppliers: ForecastFactor[];
    largePayments: ForecastFactor[];
    largeReceipts: ForecastFactor[];
  };
  recommendations: ForecastRecommendation[];
  assumptions: ForecastAssumptions;
};

// ===== 发票异常 =====

export type AnomalyType =
  | "duplicate_reimbursement"
  | "tax_rate_anomaly"
  | "large_expense"
  | "missing_attachment"
  | "compliance_risk";

export type AnomalyStatus = "unprocessed" | "ignored" | "confirmed" | "escalated";

export type AnomalyItem = {
  id: string;
  documentNumber: string;
  submitter: string;
  department: string;
  amount: Money;
  anomalyType: AnomalyType;
  riskLevel: RiskLevel;
  reason: string;
  status: AnomalyStatus;
};

export type RuleStatus = {
  enabledRuleCount: number;
  totalAnomalyCount: number;
  highRiskCount: number;
  processedCount: number;
};

export type HitRule = {
  ruleId: string;
  ruleName: string;
  severity: RiskLevel;
  description: string;
};

export type AnomalyDetail = {
  id: string;
  documentNumber: string;
  submitter: string;
  department: string;
  amount: Money;
  anomalyType: AnomalyType;
  riskLevel: RiskLevel;
  reason: string;
  status: AnomalyStatus;
  documentDetails: Record<string, unknown>;
  hitRules: HitRule[];
  similarDocuments: AnomalyItem[];
  aiExplanation: string;
  suggestedAction: string;
  auditTrail: AuditEntry[];
};

// ===== 报告 =====

export type ReportType = "risk_analysis" | "cashflow_forecast" | "anomaly_report" | "custom";

export type ReportStatus = "draft" | "pending_approval" | "under_review" | "approved" | "rejected";

export type ReportItem = {
  id: string;
  name: string;
  type: ReportType;
  linkedTaskId?: string;
  createdBy: string;
  updatedAt: string;
  status: ReportStatus;
  currentApprovalNode?: string;
};

export type ReportVersion = {
  version: number;
  content: string;
  createdBy: string;
  createdAt: string;
  changeNote?: string;
};

export type ApprovalStep = {
  nodeId: string;
  name: string;
  assignee: string;
  status: "pending" | "approved" | "rejected";
  comment?: string;
  timestamp?: string;
};

export type ReportDetail = {
  id: string;
  name: string;
  type: ReportType;
  status: ReportStatus;
  content: string;
  versions: ReportVersion[];
  approvalFlow: ApprovalStep[];
  linkedDatasets: AuditSource[];
  reviewComments: { author: string; comment: string; timestamp: string }[];
  sources: AuditSource[];
};

export type EditorMode = "readonly" | "edit" | "version_review" | "insert_ai";

// ===== 审批 =====

export type ApprovalType = "report_approval" | "anomaly_escalation" | "collection_approval";

export type ApprovalItem = {
  id: string;
  taskName: string;
  type: ApprovalType;
  submitter: string;
  submittedAt: string;
  riskLevel: RiskLevel;
  currentNode: string;
  slaHours: number;
  isSlaWarning: boolean;
};

export type ApprovalDetail = {
  id: string;
  taskName: string;
  type: ApprovalType;
  submitter: string;
  submittedAt: string;
  riskLevel: RiskLevel;
  businessSummary: string;
  aiAnalysisResult: string;
  currentNode: string;
  slaHours: number;
};

export type AuditEntry = {
  id: string;
  entityType: string;
  entityId: string;
  operator: string;
  action: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  timestamp: string;
};

// ===== 页面状态 =====

export type FinancePageState = "empty" | "loading" | "running" | "success" | "error" | "forbidden" | "no-data";
