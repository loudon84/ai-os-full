import type { ZodTypeAny } from "zod";
import { FinanceToolResultSchema } from "../tool-ui/schemas/finance-tool-result-schema";
import { RiskToolResultSchema } from "../tool-ui/schemas/risk-tool-result-schema";
import { ForecastToolResultSchema } from "../tool-ui/schemas/forecast-tool-result-schema";

/** Schema validation result */
export type SchemaValidationResult = {
  schemaName: string;
  success: boolean;
  errors: Array<{
    path: string;
    message: string;
  }>;
};

/** Map toolName to the corresponding Zod Schema */
export function resolveSchemaByToolName(toolName: string): {
  schema: ZodTypeAny;
  name: string;
} | null {
  if (toolName.startsWith("finance.")) {
    return { schema: FinanceToolResultSchema, name: "FinanceToolResultSchema" };
  }

  if (toolName.startsWith("risk.")) {
    return { schema: RiskToolResultSchema, name: "RiskToolResultSchema" };
  }

  if (toolName.startsWith("forecast.")) {
    return { schema: ForecastToolResultSchema, name: "ForecastToolResultSchema" };
  }

  return null;
}

/** Validate data against the schema for a given toolName */
export function validateWithSchema(
  toolName: string,
  data: unknown
): SchemaValidationResult | null {
  const resolved = resolveSchemaByToolName(toolName);
  if (!resolved) return null;

  // Construct the wrapper structure expected by union schemas
  const wrapped = { kind: toolName, payload: data };
  const result = resolved.schema.safeParse(wrapped);

  if (result.success) {
    return {
      schemaName: resolved.name,
      success: true,
      errors: [],
    };
  }

  return {
    schemaName: resolved.name,
    success: false,
    errors: result.error.errors.map((err) => ({
      path: err.path.join("."),
      message: err.message,
    })),
  };
}
