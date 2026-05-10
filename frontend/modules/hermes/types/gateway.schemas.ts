import { z } from "zod";

export const GatewayHealthSchema = z.object({
  status: z.string(),
});

export const GatewayHealthDetailedSchema = z
  .object({
    status: z.string().optional(),
    active_sessions: z.number().optional(),
    running_agents: z.number().optional(),
    resource_usage: z
      .object({
        cpu_percent: z.number().optional(),
        memory_mb: z.number().optional(),
        memory_percent: z.number().optional(),
      })
      .optional(),
  })
  .passthrough();

export const GatewayModelSchema = z.object({
  id: z.string(),
  object: z.string().optional(),
  owned_by: z.string().optional(),
});

export const GatewayModelsResponseSchema = z.object({
  object: z.string().optional(),
  data: GatewayModelSchema.array(),
});

