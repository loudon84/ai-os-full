import type { HermesToolHandler } from "./tool-context.js";

export function auditReplayToolHandlers(): Record<string, HermesToolHandler> {
  return {
    query: async (deps, input) => {
      const result = await deps.auditService.query({
        workspaceId: deps.ctx.workspaceId,
        action: typeof input.action === "string" ? input.action : undefined,
        targetType: typeof input.target_type === "string" ? input.target_type : undefined,
        fromDate: typeof input.from_date === "string" ? input.from_date : undefined,
        toDate: typeof input.to_date === "string" ? input.to_date : undefined,
        page: typeof input.page === "number" ? input.page : 1,
        pageSize: typeof input.page_size === "number" ? input.page_size : 20,
      });

      return {
        events: result.items.map((event) => ({
          event_id: event.id,
          action: event.action,
          target_type: event.targetType,
          target_id: event.targetId,
          result: event.result,
          metadata: event.metadata,
          created_at: event.createdAt.toISOString(),
        })),
        page: result.page,
        page_size: result.page_size,
      };
    },
  };
}
