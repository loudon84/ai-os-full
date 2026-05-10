import { z } from "zod";

export const RiskAlertSummarySchema = z.object({
  title: z.string().optional(),
  level: z.enum(["low", "medium", "high", "critical"]).optional(),
  topic: z.string().optional(),
  impact: z.string().optional(),
  recommendation: z.string().optional(),
});

export const RiskExposureRowSchema = z.object({
  customerName: z.string(),
  exposureAmount: z.number(),
  overdueAmount: z.number().optional(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
});

export const RiskExposureTableSchema = z.object({
  title: z.string().optional(),
  rows: z.array(RiskExposureRowSchema),
});

export const OverdueCustomerRowSchema = z.object({
  customerName: z.string(),
  orderNo: z.string().optional(),
  overdueDays: z.number(),
  amount: z.number(),
  owner: z.string().optional(),
});

export const OverdueCustomerListSchema = z.object({
  title: z.string().optional(),
  rows: z.array(OverdueCustomerRowSchema),
});

export const CreditLimitUsageSchema = z.object({
  customerName: z.string(),
  creditLimit: z.number(),
  usedAmount: z.number(),
  usageRatio: z.number(),
  remainingAmount: z.number().optional(),
});

export const RiskToolResultSchema = z.union([
  z.object({
    kind: z.literal("risk.alert.summary"),
    payload: RiskAlertSummarySchema,
  }),
  z.object({
    kind: z.literal("risk.exposure.table"),
    payload: RiskExposureTableSchema,
  }),
  z.object({
    kind: z.literal("risk.overdue.customer-list"),
    payload: OverdueCustomerListSchema,
  }),
  z.object({
    kind: z.literal("risk.credit.limit-usage"),
    payload: z.array(CreditLimitUsageSchema),
  }),
]);

export type RiskToolResult = z.infer<typeof RiskToolResultSchema>;
