import type { HermesToolViewModel } from "../../types/tool-view-model";
import { FinanceToolResultSchema } from "../schemas/finance-tool-result-schema";

export function mapFinanceToolResult(
  toolName: string,
  raw: unknown
): HermesToolViewModel {
  const parsed = FinanceToolResultSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      kind: "generic.error",
      title: "Finance Tool Result",
      message: "Data format mismatch: unable to parse finance tool result",
    };
  }

  const result = parsed.data;

  switch (result.kind) {
    case "finance.kpi.summary":
      return {
        kind: "finance.kpi-list",
        title: result.payload.title ?? "Finance KPIs",
        items: result.payload.items.map((item) => ({
          key: item.key,
          label: item.label,
          value: item.value,
          trend: item.trend,
          hint: item.hint,
        })),
      };

    case "finance.cashflow.trend":
      return {
        kind: "finance.cashflow-trend",
        title: result.payload.title ?? "Cashflow Trend",
        data: result.payload.points.map((p) => ({
          period: p.period,
          inflow: p.inflow,
          outflow: p.outflow,
          net: p.net,
        })),
      };

    case "finance.receivable.aging":
      return {
        kind: "finance.aging-table",
        rows: result.payload.rows.map((row) => ({
          bucket: row.bucket,
          amount: row.amount,
          ratio: row.ratio,
        })),
      };

    case "finance.receivable.status":
      return {
        kind: "finance.receivable-status",
        rows: result.payload.rows.map((row) => ({
          orderNo: row.orderNo,
          customerName: row.customerName,
          amount: row.amount,
          status: row.status,
          dueDate: row.dueDate,
        })),
      };

    default:
      return {
        kind: "generic.json",
        title: toolName,
        data: raw,
      };
  }
}
