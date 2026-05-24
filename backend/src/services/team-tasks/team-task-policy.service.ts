import type { RequestContext } from "../../middleware/auth.js";
import { forbidden, notFound } from "../../errors.js";
import { type TeamTask, teamTaskAssignments } from "@portal/db";

type TeamTaskAssignment = typeof teamTaskAssignments.$inferSelect;

export class TeamTaskPolicyService {
  hasPermission(ctx: RequestContext, code: string): boolean {
    if (ctx.roles.includes("super_admin")) return true;
    if (ctx.permissions.includes("*")) return true;
    return ctx.permissions.includes(code);
  }

  canRead(ctx: RequestContext, task: TeamTask): void {
    if (ctx.roles.includes("super_admin")) return;
    if (this.hasPermission(ctx, "team_task:read")) return;
    if (task.workspaceId !== ctx.workspaceId) {
      throw forbidden("Workspace mismatch");
    }
    throw forbidden("Permission denied: team_task:read");
  }

  canList(ctx: RequestContext, workspaceId: string): void {
    if (ctx.roles.includes("super_admin")) return;
    if (this.hasPermission(ctx, "team_task:read")) return;
    if (workspaceId !== ctx.workspaceId) {
      throw forbidden("Workspace mismatch");
    }
    throw forbidden("Permission denied: team_task:read");
  }

  canCreate(ctx: RequestContext, workspaceId: string): void {
    if (ctx.roles.includes("super_admin")) return;
    if (this.hasPermission(ctx, "team_task:create")) return;
    if (workspaceId !== ctx.workspaceId) {
      throw forbidden("Cannot create task in another workspace");
    }
    throw forbidden("Permission denied: team_task:create");
  }

  canUpdate(ctx: RequestContext, task: TeamTask): void {
    this.canRead(ctx, task);
    if (ctx.roles.includes("super_admin") || ctx.roles.includes("admin")) return;
    if (this.hasPermission(ctx, "team_task:cancel")) return;
    if (task.createdByUserId !== ctx.userId && task.assigneeUserId !== ctx.userId) {
      throw forbidden("Not allowed to update this task");
    }
  }

  canAssign(ctx: RequestContext, task: TeamTask): void {
    this.canRead(ctx, task);
    if (ctx.roles.includes("super_admin") || ctx.roles.includes("admin")) return;
    if (this.hasPermission(ctx, "team_task:assign")) return;
    if (task.createdByUserId !== ctx.userId) {
      throw forbidden("Not allowed to assign this task");
    }
  }

  canApprove(ctx: RequestContext, task: TeamTask): void {
    this.canRead(ctx, task);
    if (ctx.roles.includes("super_admin") || ctx.roles.includes("admin")) return;
    if (this.hasPermission(ctx, "team_task:approve")) return;
    throw forbidden("Permission denied: team_task:approve");
  }

  canExecute(ctx: RequestContext, task: TeamTask): void {
    this.canRead(ctx, task);
    if (ctx.roles.includes("super_admin")) return;
    if (this.hasPermission(ctx, "team_task:execute")) {
      if (task.assigneeUserId && task.assigneeUserId !== ctx.userId) {
        throw forbidden("Task is assigned to another user");
      }
      return;
    }
    if (task.assigneeUserId && task.assigneeUserId !== ctx.userId) {
      throw forbidden("Task is assigned to another user");
    }
    throw forbidden("Permission denied: team_task:execute");
  }

  canListAssigned(ctx: RequestContext, workspaceId: string): void {
    if (ctx.roles.includes("super_admin")) return;
    if (this.hasPermission(ctx, "team_task:execute")) {
      if (workspaceId !== ctx.workspaceId) {
        throw forbidden("Workspace mismatch");
      }
      return;
    }
    throw forbidden("Permission denied: team_task:execute");
  }

  assertAssignmentClient(
    assignment: TeamTaskAssignment | null,
    desktopClientId: string,
  ): void {
    if (!assignment?.desktopClientId) return;
    if (assignment.desktopClientId !== desktopClientId) {
      throw forbidden("Desktop client does not match task assignment");
    }
  }

  assertTaskExists<T>(task: T | null | undefined): asserts task is T {
    if (!task) {
      notFound("Task not found");
    }
  }
}
