"use client";

import { useMemo } from "react";
import { validateWithSchema } from "../dev/schema-resolver";
import type { SchemaValidationResult } from "../dev/schema-resolver";
import { usePreviewScenario } from "./use-preview-scenario";
import { usePreviewToolPayload } from "./use-preview-tool-payload";

/** Validate current scenario payload against its Zod Schema */
export function useSchemaValidation(): {
  result: SchemaValidationResult | null;
  isValidating: boolean;
} {
  const scenario = usePreviewScenario();
  const { payload } = usePreviewToolPayload();

  const result = useMemo(() => {
    if (payload == null) return null;
    return validateWithSchema(scenario.toolName, payload);
  }, [scenario.toolName, payload]);

  // safeParse is synchronous, so isValidating is always false
  return { result, isValidating: false };
}
