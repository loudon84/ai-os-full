import { z } from "zod";
import { FinanceToolResultSchema } from "./finance-tool-result-schema";
import { RiskToolResultSchema } from "./risk-tool-result-schema";
import { ForecastToolResultSchema } from "./forecast-tool-result-schema";

export const ToolResultUnionSchema = z.union([
  FinanceToolResultSchema,
  RiskToolResultSchema,
  ForecastToolResultSchema,
]);

export type ToolResultUnion = z.infer<typeof ToolResultUnionSchema>;
