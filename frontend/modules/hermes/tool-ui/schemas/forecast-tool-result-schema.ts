import { z } from "zod";

export const ForecastSummarySchema = z.object({
  period: z.string(),
  cashIn: z.number(),
  cashOut: z.number(),
  endingCash: z.number(),
  confidence: z.string().optional(),
});

export const ForecastCashflowPointSchema = z.object({
  period: z.string(),
  cashIn: z.number(),
  cashOut: z.number(),
  endingCash: z.number(),
});

export const ScenarioComparisonRowSchema = z.object({
  scenario: z.string(),
  revenue: z.number().optional(),
  endingCash: z.number(),
  riskLabel: z.string().optional(),
});

export const LiquidityWarningSchema = z.object({
  level: z.enum(["low", "medium", "high", "critical"]),
  message: z.string(),
  suggestedAction: z.string().optional(),
  threshold: z.number().optional(),
  actualValue: z.number().optional(),
});

export const ForecastToolResultSchema = z.union([
  z.object({
    kind: z.literal("forecast.summary"),
    payload: ForecastSummarySchema,
  }),
  z.object({
    kind: z.literal("forecast.cashflow.trend"),
    payload: z.object({
      title: z.string().optional(),
      points: z.array(ForecastCashflowPointSchema),
    }),
  }),
  z.object({
    kind: z.literal("forecast.scenario.comparison"),
    payload: z.object({
      title: z.string().optional(),
      rows: z.array(ScenarioComparisonRowSchema),
    }),
  }),
  z.object({
    kind: z.literal("forecast.liquidity.warning"),
    payload: LiquidityWarningSchema,
  }),
]);

export type ForecastToolResult = z.infer<typeof ForecastToolResultSchema>;
