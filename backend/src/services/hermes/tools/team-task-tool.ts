import type { TeamTaskStatus, TeamTaskType } from "@portal/shared";
import { TEAM_TASK_TYPES } from "@portal/shared";

import type { HermesToolHandler } from "./tool-context.js";

function parseTaskType(value: unknown): TeamTaskType {
  if (typeof value === "string" && TEAM_TASK_TYPES.includes(value as TeamTaskType)) {
    return value as TeamTaskType;
  }
  return "custom";
}

export function teamTaskToolHandlers(): Record<string, HermesToolHandler> {
  return {
    create: async (deps, input) => {
      const workspaceId =
        typeof input.workspace_id === "string" ? input.workspace_id : deps.ctx.workspaceId;
      const task = await deps.teamTaskService.createTask(deps.ctx, {
        workspace_id: workspaceId,
        title: String(input.title ?? "Untitled task"),
        description: typeof input.description === "string" ? input.description : null,
        task_type: parseTaskType(input.task_type),
        risk_level: String(input.risk_level ?? "low"),
        assignee_user_id:
          typeof input.assignee_user_id === "string" ? input.assignee_user_id : null,
        target_profile_id:
          typeof input.target_profile_id === "string" ? input.target_profile_id : null,
        input: (input.input as Record<string, unknown>) ?? {},
      });
      return { task_id: task.task_id, status: task.status };
    },

    update_status: async (deps, input) => {
      const taskId = String(input.task_id ?? "");
      const status = String(input.status ?? "") as TeamTaskStatus;
      const workspaceId =
        typeof input.workspace_id === "string" ? input.workspace_id : deps.ctx.workspaceId;
      if (!taskId || !status) {
        return { error: "task_id and status are required" };
      }

      const task = await deps.teamTaskService.updateStatus(
        deps.ctx,
        taskId,
        workspaceId,
        {
          status,
          message: typeof input.message === "string" ? input.message : null,
        },
      );
      return { updated: true, task_id: task.task_id, status: task.status };
    },
  };
}
