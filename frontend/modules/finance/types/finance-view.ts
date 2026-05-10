/** KPI 指标视图 */
export type FinanceKpiView = {
  key: string;
  label: string;
  value: string | number;
  trend?: string;
  hint?: string;
};

/** 现金流数据点视图 */
export type CashflowPointView = {
  period: string;
  inflow: number;
  outflow: number;
  net: number;
};

/** 账龄行视图 */
export type AgingRowView = {
  bucket: string;
  amount: number;
  ratio?: number;
};

/** 应收状态视图 */
export type ReceivableStatusView = {
  orderNo: string;
  customerName: string;
  amount: number;
  status: string;
  dueDate?: string;
};

/** 预测摘要视图 */
export type ForecastSummaryView = {
  period: string;
  cashIn: number;
  cashOut: number;
  endingCash: number;
  confidence?: string;
};

/** 方差项视图 */
export type VarianceItemView = {
  label: string;
  value: number;
  isPositive: boolean;
};

/** 风险敞口项视图 */
export type RiskExposureItemView = {
  category: string;
  exposure: number;
  limit: number;
  utilization: number;
  level: "low" | "medium" | "high";
};
