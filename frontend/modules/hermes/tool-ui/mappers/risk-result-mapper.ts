import type { HermesToolViewModel } from "../../types/tool-view-model";
import { RiskToolResultSchema } from "../schemas/risk-tool-result-schema";

export function mapRiskToolResult(raw: unknown): HermesToolViewModel {
  const parsed = RiskToolResultSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      kind: "generic.error",
      title: "Risk Tool Result",
      message: "Data format mismatch: unable to parse risk tool result",
    };
  }

  const result = parsed.data;

  switch (result.kind) {
    case "risk.alert.summary":
      return {
        kind: "risk.summary",
        title: result.payload.title,
        level: result.payload.level,
        topic: result.payload.topic,
        impact: result.payload.impact,
        recommendation: result.payload.recommendation,
      };

    case "risk.exposure.table":
      return {
        kind: "generic.json",
        title: result.payload.title ?? "Risk Exposure",
        data: result.payload,
      };

    case "risk.overdue.customer-list":
      return {
        kind: "generic.json",
        title: result.payload.title ?? "Overdue Customers",
        data: result.payload,
      };

    case "risk.credit.limit-usage":
      return {
        kind: "generic.json",
        title: "Credit Limit Usage",
        data: result.payload,
      };

    default:
      return {
        kind: "generic.json",
        title: "Risk Tool Result",
        data: raw,
      };
  }
}
