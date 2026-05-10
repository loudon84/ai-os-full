/**
 * Generated UI Registry
 * Maps tool names to their corresponding UI card components.
 * This is the central registry for structured tool result rendering.
 *
 * @deprecated Use `modules/hermes/tool-ui/registry.ts` + `modules/hermes/tool-ui/adapters/` instead.
 */
"use client";

import { FinanceAnalysisCard } from "../components/copilot/tool-ui/finance-analysis-card";
import { RiskAlertCard } from "../components/copilot/tool-ui/risk-alert-card";
import { ForecastCard } from "../components/copilot/tool-ui/forecast-card";
import { JsonResultCard } from "../components/copilot/tool-ui/json-result-card";
import { PlainToolResult } from "../components/copilot/tool-ui/plain-tool-result";
import type { ComponentType } from "react";

type ToolUiEntry = {
  component: ComponentType<{ data: unknown }>;
  match: (toolName: string) => boolean;
};

const registry: ToolUiEntry[] = [
  {
    component: FinanceAnalysisCard as ComponentType<{ data: unknown }>,
    match: (name) => name.includes("finance"),
  },
  {
    component: RiskAlertCard as ComponentType<{ data: unknown }>,
    match: (name) => name.includes("risk"),
  },
  {
    component: ForecastCard as ComponentType<{ data: unknown }>,
    match: (name) => name.includes("forecast"),
  },
];

/**
 * Resolve a tool name to its UI component.
 * Falls back to JsonResultCard for objects, PlainToolResult for strings.
 */
export function resolveToolUi(toolName: string, data: unknown): ComponentType<{ data: unknown }> {
  for (const entry of registry) {
    if (entry.match(toolName)) {
      return entry.component;
    }
  }

  if (typeof data === "object" && data !== null) {
    return JsonResultCard;
  }

  return PlainToolResult;
}
