export type RiskAlertSummaryView = {
  title?: string;
  level?: "low" | "medium" | "high" | "critical";
  topic?: string;
  impact?: string;
  recommendation?: string;
};

export type RiskExposureRowView = {
  customerName: string;
  exposureAmount: number;
  overdueAmount?: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
};

export type OverdueCustomerRowView = {
  customerName: string;
  orderNo?: string;
  overdueDays: number;
  amount: number;
  owner?: string;
};

export type CreditLimitUsageView = {
  customerName: string;
  creditLimit: number;
  usedAmount: number;
  usageRatio: number;
  remainingAmount?: number;
};
