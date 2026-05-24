import { describe, expect, it, vi, beforeEach } from "vitest";

import type { RequestContext } from "../src/middleware/auth.js";
import { TeamTaskService } from "../src/services/team-tasks/team-task.service.js";
import { TeamTaskRepository } from "../src/services/team-tasks/team-task.repository.js";

const ctx: RequestContext = {
  tenantId: "ws-1",
  workspaceId: "ws-1",
  userId: "user-1",
  roles: ["super_admin"],
  departments: [],
  authSource: "token",
  permissions: ["*"],
};

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: "task-1",
    workspaceId: "ws-1",
    projectId: null,
    title: "Test task",
    description: null,
    taskType: "custom",
    riskLevel: "low",
    status: "created",
    assigneeUserId: "user-1",
    targetProfileId: null,
    targetAgentId: null,
    sourceAgentId: null,
    createdByUserId: "user-1",
    workspacePath: null,
    requiresApproval: false,
    input: {},
    acceptanceCriteria: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("TeamTaskService", () => {
  let service: TeamTaskService;

  beforeEach(() => {
    service = new TeamTaskService({} as never, { emit: vi.fn() } as never);
    vi.restoreAllMocks();
  });

  it("blocks direct approved status updates", async () => {
    vi.spyOn(TeamTaskRepository.prototype, "getTask").mockResolvedValue(
      makeTask({ status: "pending_approval", requiresApproval: true }) as never,
    );

    await expect(
      service.updateStatus(ctx, "task-1", "ws-1", { status: "approved" }),
    ).rejects.toMatchObject({
      status: 409,
      code: "TEAM_TASK_USE_APPROVAL_ENDPOINT",
    });
  });

  it("approves pending task and optionally auto-starts", async () => {
    vi.spyOn(TeamTaskRepository.prototype, "getTask")
      .mockResolvedValueOnce(
        makeTask({ status: "pending_approval", requiresApproval: true }) as never,
      )
      .mockResolvedValueOnce(makeTask({ status: "running", requiresApproval: true }) as never);
    vi.spyOn(TeamTaskRepository.prototype, "updateTask").mockResolvedValue(
      makeTask({ status: "running", requiresApproval: true }) as never,
    );
    vi.spyOn(TeamTaskRepository.prototype, "insertApproval").mockResolvedValue({
      id: "approval-1",
    } as never);
    vi.spyOn(TeamTaskRepository.prototype, "insertEvent").mockResolvedValue({
      id: "event-1",
    } as never);

    const result = await service.approveTask(ctx, "task-1", "ws-1", {
      auto_start: true,
      reason: "Looks good",
    });

    expect(result.status).toBe("running");
    expect(TeamTaskRepository.prototype.insertApproval).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "approved", approverUserId: "user-1" }),
    );
  });

  it("rejects pending task with reason", async () => {
    vi.spyOn(TeamTaskRepository.prototype, "getTask").mockResolvedValue(
      makeTask({ status: "pending_approval", requiresApproval: true }) as never,
    );
    vi.spyOn(TeamTaskRepository.prototype, "updateTask").mockResolvedValue(
      makeTask({ status: "rejected" }) as never,
    );
    vi.spyOn(TeamTaskRepository.prototype, "insertApproval").mockResolvedValue({
      id: "approval-1",
    } as never);
    vi.spyOn(TeamTaskRepository.prototype, "insertEvent").mockResolvedValue({
      id: "event-1",
    } as never);

    const result = await service.rejectTask(ctx, "task-1", "ws-1", {
      reason: "Too risky",
    });

    expect(result.status).toBe("rejected");
  });

  it("passes desktop client filter to listAssigned repository query", async () => {
    const desktopClientService = {
      assertClientActive: vi.fn(async () => ({
        id: "client-1",
        userId: "user-1",
      })),
    };
    service = new TeamTaskService(
      {} as never,
      { emit: vi.fn() } as never,
      desktopClientService as never,
    );

    const listSpy = vi
      .spyOn(TeamTaskRepository.prototype, "listAssignedTasks")
      .mockResolvedValue({
        items: [],
        nextCursor: null,
      });

    await service.listAssigned(ctx, {
      workspace_id: "ws-1",
      client_id: "client-1",
      limit: 20,
    });

    expect(listSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        desktopClientId: "client-1",
        assigneeUserId: "user-1",
      }),
    );
  });

  it("redirects high-risk running request to pending_approval and creates pending record", async () => {
    vi.spyOn(TeamTaskRepository.prototype, "getTask").mockResolvedValue(
      makeTask({ status: "acknowledged", requiresApproval: true, riskLevel: "high" }) as never,
    );
    vi.spyOn(TeamTaskRepository.prototype, "updateTask").mockResolvedValue(
      makeTask({ status: "pending_approval", requiresApproval: true }) as never,
    );
    vi.spyOn(TeamTaskRepository.prototype, "insertApproval").mockResolvedValue({
      id: "approval-1",
    } as never);
    vi.spyOn(TeamTaskRepository.prototype, "insertEvent").mockResolvedValue({
      id: "event-1",
    } as never);

    const result = await service.updateStatus(ctx, "task-1", "ws-1", {
      status: "running",
    });

    expect(result.status).toBe("pending_approval");
    expect(TeamTaskRepository.prototype.insertApproval).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "pending" }),
    );
  });

  it("retries failed task back to assigned", async () => {
    vi.spyOn(TeamTaskRepository.prototype, "getTask").mockResolvedValue(
      makeTask({ status: "failed" }) as never,
    );
    vi.spyOn(TeamTaskRepository.prototype, "updateTask").mockResolvedValue(
      makeTask({ status: "assigned" }) as never,
    );
    vi.spyOn(TeamTaskRepository.prototype, "insertEvent").mockResolvedValue({
      id: "event-1",
    } as never);

    const result = await service.retryTask(ctx, "task-1", "ws-1");
    expect(result.status).toBe("assigned");
  });
});
