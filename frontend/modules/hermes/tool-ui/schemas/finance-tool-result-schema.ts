import { z } from "zod";

export const FinanceKpiItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  trend: z.string().optional(),
  hint: z.string().optional(),
});

export const FinanceCashflowPointSchema = z.object({
  period: z.string(),
  inflow: z.number(),
  outflow: z.number(),
  net: z.number(),
});

export const FinanceAgingRowSchema = z.object({
  bucket: z.string(),
  amount: z.number(),
  ratio: z.number().optional(),
});

export const FinanceReceivableStatusRowSchema = z.object({
  orderNo: z.string(),
  customerName: z.string(),
  amount: z.number(),
  status: z.string(),
  dueDate: z.string().optional(),
});

export const FinanceToolResultSchema = z.union([
  z.object({
    kind: z.literal("finance.kpi.summary"),
    payload: z.object({
      title: z.string().optional(),
      items: z.array(FinanceKpiItemSchema),
    }),
  }),
  z.object({
    kind: z.literal("finance.cashflow.trend"),
    payload: z.object({
      title: z.string().optional(),
      points: z.array(FinanceCashflowPointSchema),
    }),
  }),
  z.object({
    kind: z.literal("finance.receivable.aging"),
    payload: z.object({
      rows: z.array(FinanceAgingRowSchema),
    }),
  }),
  z.object({
    kind: z.literal("finance.receivable.status"),
    payload: z.object({
      rows: z.array(FinanceReceivableStatusRowSchema),
    }),
  }),
]);

export type FinanceToolResult = z.infer<typeof FinanceToolResultSchema>;
