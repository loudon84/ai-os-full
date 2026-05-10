import type { HermesToolViewModel } from "../types/tool-view-model";
import { mapFinanceToolResult } from "./mappers/finance-result-mapper";
import { mapRiskToolResult } from "./mappers/risk-result-mapper";
import { mapForecastToolResult } from "./mappers/forecast-result-mapper";
import { isHermesMockModeEnabled } from "../dev/mock-mode";
import { createToolMockByName } from "./mocks/mock-factory";

/** Mock Mode fallback: 当 payload 为空且 Mock Mode 启用时，使用 Mock 工厂数据 */
export function resolveToolPayload(toolName: string, raw: unknown) {
  if (isHermesMockModeEnabled() && (raw == null || raw === "")) {
    return createToolMockByName(toolName);
  }
  return raw;
}

/** 按 toolName 前缀分发到对应 Mapper，未知前缀返回 generic.json */
export function mapToolResultToViewModel(
  toolName: string,
  data: unknown
): HermesToolViewModel {
  const payload = resolveToolPayload(toolName, data);

  if (toolName.startsWith("finance.")) {
    return mapFinanceToolResult(toolName, payload);
  }

  if (toolName.startsWith("risk.")) {
    return mapRiskToolResult(payload);
  }

  if (toolName.startsWith("forecast.")) {
    return mapForecastToolResult(payload);
  }

  return {
    kind: "generic.json",
    title: "Tool Result",
    data: payload,
  };
}
