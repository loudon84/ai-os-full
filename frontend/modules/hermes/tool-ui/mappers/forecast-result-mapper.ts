import type { HermesToolViewModel } from "../../types/tool-view-model";
import { ForecastToolResultSchema } from "../schemas/forecast-tool-result-schema";

export function mapForecastToolResult(raw: unknown): HermesToolViewModel {
  const parsed = ForecastToolResultSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      kind: "generic.error",
      title: "Forecast Tool Result",
      message: "Data format mismatch: unable to parse forecast tool result",
    };
  }

  const result = parsed.data;

  switch (result.kind) {
    case "forecast.summary":
      return {
        kind: "forecast.summary",
        item: {
          period: result.payload.period,
          cashIn: result.payload.cashIn,
          cashOut: result.payload.cashOut,
          endingCash: result.payload.endingCash,
          confidence: result.payload.confidence,
        },
      };

    case "forecast.cashflow.trend":
      return {
        kind: "generic.json",
        title: result.payload.title ?? "Forecast Cashflow Trend",
        data: result.payload,
      };

    case "forecast.scenario.comparison":
      return {
        kind: "generic.json",
        title: result.payload.title ?? "Scenario Comparison",
        data: result.payload,
      };

    case "forecast.liquidity.warning":
      return {
        kind: "generic.json",
        title: "Liquidity Warning",
        data: result.payload,
      };

    default:
      return {
        kind: "generic.json",
        title: "Forecast Tool Result",
        data: raw,
      };
  }
}
