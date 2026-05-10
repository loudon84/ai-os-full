import type {
  Money,
  WorkbenchKpi,
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

// ===== 通用工具 =====
const usd = (amount: number): Money => ({ amount, currency: "USD" });
const cny = (amount: number): Money => ({ amount, currency: "CNY" });

// ===== 工作台 KPI =====
export const seedWorkbenchKpi: WorkbenchKpi = {
  totalReceivables: usd(125000000),
  totalPayables: usd(89000000),
  overdueAmount: usd(23400000),
  cashflowForecast30d: usd(15600000),
  highRiskClientCount: 12,
};

// ===== 应收风险 =====
export const seedReceivableKpi: ReceivableKpi = {
  totalReceivables: usd(125000000),
  totalOverdue: usd(23400000),
  highRiskClientCount: 12,
  badDebtEstimate: usd(3500000),
};

export const seedReceivableItems: ReceivableRiskItem[] = [
  {
    clientId: "c001",
    clientName: "Acme Corporation",
    receivableBalance: usd(5200000),
    overdueAmount: usd(1800000),
    maxOverdueDays: 92,
    riskLevel: "high",
    riskReasons: ["长期逾期", "回款率下降"],
    recommendedAction: "collect",
  },
  {
    clientId: "c002",
    clientName: "Globex Inc",
    receivableBalance: usd(3800000),
    overdueAmount: usd(950000),
    maxOverdueDays: 45,
    riskLevel: "medium",
    riskReasons: ["账龄偏长"],
    recommendedAction: "negotiate",
  },
  {
    clientId: "c003",
    clientName: "Initech LLC",
    receivableBalance: usd(1200000),
    overdueAmount: usd(0),
    maxOverdueDays: 0,
    riskLevel: "low",
    riskReasons: [],
    recommendedAction: "monitor",
  },
  {
    clientId: "c004",
    clientName: "Hooli Technologies",
    receivableBalance: usd(8900000),
    overdueAmount: usd(4200000),
    maxOverdueDays: 120,
    riskLevel: "high",
    riskReasons: ["严重逾期", "多次催收未果"],
    recommendedAction: "escalate",
  },
  {
    clientId: "c005",
    clientName: "Pied Piper",
    receivableBalance: usd(2100000),
    overdueAmount: usd(600000),
    maxOverdueDays: 30,
    riskLevel: "medium",
    riskReasons: ["短期逾期"],
    recommendedAction: "collect",
  },
  {
    clientId: "c006",
    clientName: "Stark Industries",
    receivableBalance: usd(15000000),
    overdueAmount: usd(0),
    maxOverdueDays: 0,
    riskLevel: "low",
    riskReasons: [],
    recommendedAction: "monitor",
  },
  {
    clientId: "c007",
    clientName: "Wayne Enterprises",
    receivableBalance: usd(7600000),
    overdueAmount: usd(2800000),
    maxOverdueDays: 67,
    riskLevel: "high",
    riskReasons: ["逾期超60天", "行业风险"],
    recommendedAction: "escalate",
  },
  {
    clientId: "c008",
    clientName: "Umbrella Corp",
    receivableBalance: usd(4300000),
    overdueAmount: usd(1100000),
    maxOverdueDays: 38,
    riskLevel: "medium",
    riskReasons: ["回款延迟"],
    recommendedAction: "negotiate",
  },
];

export const seedReceivableDetail: ReceivableDetail = {
  clientProfile: {
    clientId: "c001",
    name: "Acme Corporation",
    region: "North America",
    industry: "Manufacturing",
    creditLimit: usd(10000000),
    paymentTerms: "Net 30",
  },
  paymentHistory: [
    { date: "2026-03-15", amount: usd(500000), status: "paid" },
    { date: "2026-02-28", amount: usd(300000), status: "partial" },
    { date: "2026-01-20", amount: usd(800000), status: "overdue" },
  ],
  orderDetails: [
    { orderId: "ORD-2026-001", date: "2026-03-01", amount: usd(1200000), status: "delivered" },
    { orderId: "ORD-2026-002", date: "2026-02-15", amount: usd(800000), status: "delivered" },
  ],
  invoiceDetails: [
    { invoiceId: "INV-2026-001", date: "2026-03-01", amount: usd(1200000), dueDate: "2026-03-31", status: "overdue" },
    { invoiceId: "INV-2026-002", date: "2026-02-15", amount: usd(800000), dueDate: "2026-03-15", status: "overdue" },
  ],
  aiRiskExplanation: "该客户逾期金额持续增长，回款率从上季度的85%下降至62%。建议加强催收力度，并考虑调整信用额度。",
  auditSources: [
    { name: "ERP 应收模块", timestamp: "2026-04-18T10:30:00Z" },
    { name: "CRM 客户档案", timestamp: "2026-04-18T10:30:00Z" },
  ],
};

// ===== 现金流预测 =====
export const seedCashflowForecast: CashflowForecastData = {
  summary: {
    netCashflow: usd(15600000),
    minCashPosition: usd(3200000),
    hasGapWarning: true,
    peakPaymentDate: "2026-05-15",
  },
  trend: Array.from({ length: 30 }, (_, i) => {
    const date = new Date(2026, 3, i + 1);
    const inflow = 800000 + Math.random() * 400000;
    const outflow = 600000 + Math.random() * 500000;
    const net = inflow - outflow;
    return {
      date: date.toISOString().split("T")[0],
      inflow: Math.round(inflow),
      outflow: Math.round(outflow),
      net: Math.round(net),
      isGap: i >= 12 && i <= 15,
    };
  }),
  factors: {
    clients: [
      { name: "Acme Corporation", amount: usd(5200000), impact: "positive", dueDate: "2026-05-01" },
      { name: "Stark Industries", amount: usd(15000000), impact: "positive", dueDate: "2026-05-15" },
    ],
    suppliers: [
      { name: "Raw Materials Co", amount: usd(3800000), impact: "negative", dueDate: "2026-05-10" },
    ],
    largePayments: [
      { name: "设备采购款", amount: usd(5000000), impact: "negative", dueDate: "2026-05-15" },
    ],
    largeReceipts: [
      { name: "Stark Industries 回款", amount: usd(8000000), impact: "positive", dueDate: "2026-05-20" },
    ],
  },
  recommendations: [
    { type: "payment_adjustment", title: "延迟设备采购", description: "建议将5月15日设备采购款延迟至5月25日，避免现金流缺口。", impact: usd(5000000) },
    { type: "collection", title: "加速 Acme 回款", description: "Acme Corporation 逾期92天，建议启动催收流程。", impact: usd(1800000) },
    { type: "transfer", title: "调拨备用金", description: "从运营账户调拨200万至主账户，覆盖5月中旬缺口。", impact: usd(2000000) },
  ],
  assumptions: {
    dataCaliber: "基于过去12个月实际收付款数据",
    conditions: ["假设无新增大额应收", "假设供应商付款日不变", "汇率按当前牌价计算"],
    modelDescription: "采用时间序列ARIMA模型，结合季节性调整",
    auditNote: "模型参数每季度校准一次，上次校准时间2026-01-15",
  },
};

// ===== 发票异常 =====
export const seedRuleStatus: RuleStatus = {
  enabledRuleCount: 15,
  totalAnomalyCount: 47,
  highRiskCount: 8,
  processedCount: 32,
};

export const seedAnomalyItems: AnomalyItem[] = [
  { id: "a001", documentNumber: "EXP-2026-0451", submitter: "张三", department: "市场部", amount: usd(15000), anomalyType: "duplicate_reimbursement", riskLevel: "high", reason: "与EXP-2026-0449金额和日期相同", status: "unprocessed" },
  { id: "a002", documentNumber: "EXP-2026-0452", submitter: "李四", department: "研发部", amount: usd(8500), anomalyType: "tax_rate_anomaly", riskLevel: "medium", reason: "税率从13%变为6%，差异超阈值", status: "unprocessed" },
  { id: "a003", documentNumber: "EXP-2026-0453", submitter: "王五", department: "销售部", amount: usd(120000), anomalyType: "large_expense", riskLevel: "high", reason: "单笔金额超10万阈值", status: "confirmed" },
  { id: "a004", documentNumber: "EXP-2026-0454", submitter: "赵六", department: "行政部", amount: usd(3200), anomalyType: "missing_attachment", riskLevel: "low", reason: "缺少发票扫描件", status: "ignored" },
  { id: "a005", documentNumber: "EXP-2026-0455", submitter: "钱七", department: "采购部", amount: usd(45000), anomalyType: "compliance_risk", riskLevel: "high", reason: "供应商不在合格供应商名录中", status: "escalated" },
  { id: "a006", documentNumber: "EXP-2026-0456", submitter: "孙八", department: "财务部", amount: usd(6700), anomalyType: "duplicate_reimbursement", riskLevel: "medium", reason: "与上月报销项目重复", status: "unprocessed" },
];

export const seedAnomalyDetail: AnomalyDetail = {
  id: "a001",
  documentNumber: "EXP-2026-0451",
  submitter: "张三",
  department: "市场部",
  amount: usd(15000),
  anomalyType: "duplicate_reimbursement",
  riskLevel: "high",
  reason: "与EXP-2026-0449金额和日期相同",
  status: "unprocessed",
  documentDetails: { submitDate: "2026-04-10", category: "差旅费", description: "北京出差住宿费" },
  hitRules: [{ ruleId: "R001", ruleName: "重复报销检测", severity: "high", description: "检测同一人同日同金额的报销单据" }],
  similarDocuments: [],
  aiExplanation: "该报销单与EXP-2026-0449在金额(¥15,000)、日期(2026-04-08)和类别(差旅费)上完全一致，极可能为重复提交。",
  suggestedAction: "建议与EXP-2026-0449比对后，确认是否为重复提交。如确认重复，建议驳回。",
  auditTrail: [
    { id: "at001", entityType: "anomaly", entityId: "a001", operator: "系统", action: "created", changes: { status: { from: null, to: "unprocessed" } }, timestamp: "2026-04-10T08:00:00Z" },
  ],
};

// ===== 报告 =====
export const seedReportItems: ReportItem[] = [
  { id: "r001", name: "Q1 应收风险分析报告", type: "risk_analysis", linkedTaskId: "t001", createdBy: "财务分析师A", updatedAt: "2026-04-18T10:00:00Z", status: "approved", currentApprovalNode: undefined },
  { id: "r002", name: "4月现金流预测报告", type: "cashflow_forecast", createdBy: "财务分析师B", updatedAt: "2026-04-17T15:30:00Z", status: "pending_approval", currentApprovalNode: "财务经理审批" },
  { id: "r003", name: "3月发票异常检测报告", type: "anomaly_report", createdBy: "财务分析师A", updatedAt: "2026-04-15T09:00:00Z", status: "draft" },
  { id: "r004", name: "年度财务综合分析", type: "custom", createdBy: "财务经理C", updatedAt: "2026-04-12T14:00:00Z", status: "under_review", currentApprovalNode: "CFO审批" },
];

export const seedReportDetail: ReportDetail = {
  id: "r002",
  name: "4月现金流预测报告",
  type: "cashflow_forecast",
  status: "pending_approval",
  content: "# 4月现金流预测报告\n\n## 摘要\n\n基于过去12个月数据，预测未来30天净现金流为¥1,560万。\n\n## 风险点\n\n- 5月中旬存在现金流缺口\n- 建议延迟设备采购以缓解压力\n\n## 建议\n\n1. 加速Acme Corporation回款\n2. 延迟5月15日设备采购至5月25日\n3. 从运营账户调拨200万至主账户",
  versions: [
    { version: 1, content: "# 4月现金流预测报告\n\n## 初稿\n\n预测数据待补充。", createdBy: "财务分析师B", createdAt: "2026-04-16T10:00:00Z", changeNote: "创建初稿" },
    { version: 2, content: "# 4月现金流预测报告\n\n## 摘要\n\n基于过去12个月数据，预测未来30天净现金流为¥1,560万。", createdBy: "财务分析师B", createdAt: "2026-04-17T15:30:00Z", changeNote: "补充预测数据和建议" },
  ],
  approvalFlow: [
    { nodeId: "n1", name: "财务经理审批", assignee: "财务经理C", status: "pending" },
    { nodeId: "n2", name: "CFO审批", assignee: "CFO", status: "pending" },
  ],
  linkedDatasets: [{ name: "现金流预测数据集", href: "/finance/cashflow-forecast" }],
  reviewComments: [],
  sources: [{ name: "现金流预测模型", timestamp: "2026-04-17T15:00:00Z" }],
};

// ===== 审批 =====
export const seedApprovalItems: ApprovalItem[] = [
  { id: "ap001", taskName: "4月现金流预测报告", type: "report_approval", submitter: "财务分析师B", submittedAt: "2026-04-17T15:30:00Z", riskLevel: "low", currentNode: "财务经理审批", slaHours: 48, isSlaWarning: false },
  { id: "ap002", taskName: "供应商合规风险升级", type: "anomaly_escalation", submitter: "系统", submittedAt: "2026-04-16T08:00:00Z", riskLevel: "high", currentNode: "财务经理审批", slaHours: 24, isSlaWarning: true },
  { id: "ap003", taskName: "Acme催收方案审批", type: "collection_approval", submitter: "财务分析师A", submittedAt: "2026-04-15T10:00:00Z", riskLevel: "medium", currentNode: "财务经理审批", slaHours: 72, isSlaWarning: false },
];

export const seedApprovalDetail: ApprovalDetail = {
  id: "ap002",
  taskName: "供应商合规风险升级",
  type: "anomaly_escalation",
  submitter: "系统",
  submittedAt: "2026-04-16T08:00:00Z",
  riskLevel: "high",
  businessSummary: "采购部钱七提交的EXP-2026-0455报销单(¥45,000)中，供应商不在合格供应商名录中，已自动升级至财务经理审批。",
  aiAnalysisResult: "该供应商近3个月首次出现，且单笔金额较大。建议核实供应商资质后再行审批。",
  currentNode: "财务经理审批",
  slaHours: 24,
};

export const seedAuditEntries: AuditEntry[] = [
  { id: "ae001", entityType: "anomaly", entityId: "a005", operator: "系统", action: "escalate", changes: { status: { from: "unprocessed", to: "escalated" } }, timestamp: "2026-04-16T08:00:00Z" },
  { id: "ae002", entityType: "report", entityId: "r002", operator: "财务分析师B", action: "submit", changes: { status: { from: "draft", to: "pending_approval" } }, timestamp: "2026-04-17T15:30:00Z" },
  { id: "ae003", entityType: "anomaly", entityId: "a003", operator: "财务分析师A", action: "confirm", changes: { status: { from: "unprocessed", to: "confirmed" } }, timestamp: "2026-04-14T11:00:00Z" },
];
