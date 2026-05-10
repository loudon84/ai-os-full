/**
 * useToolRenderModel - Hook for determining which tool UI component
 * to render based on tool name and result data.
 *
 * @deprecated Use `mapToolResultToViewModel` from `modules/hermes/tool-ui/registry.ts` instead.
 */
"use client";

import { useMemo } from "react";

type ToolRenderModel = {
  variant: "finance" | "risk" | "forecast" | "json" | "plain";
};

export function useToolRenderModel(toolName?: string, data?: unknown): ToolRenderModel {
  const variant = useMemo(() => {
    if (!toolName) return "plain";

    if (toolName.includes("finance")) return "finance";
    if (toolName.includes("risk")) return "risk";
    if (toolName.includes("forecast")) return "forecast";
    if (typeof data === "object" && data !== null) return "json";

    return "plain";
  }, [toolName, data]);

  return { variant };
}
