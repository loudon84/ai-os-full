import { describe, expect, it } from "vitest";

import {
  auditEvents,
  hermesRunEvents,
  hermesRuns,
  teamTaskEvents,
} from "@portal/db";

import { TaskReplayService } from "../src/services/hermes/task-replay.service.js";

function chainLimit<T>(rows: T[]) {
  const chain = {
    where: () => chain,
    orderBy: () => chain,
    limit: async () => rows,
  };
  return chain;
}

describe("TaskReplayService", () => {
  it("includes only hermes events linked to the task", async () => {
    const taskId = "task-1";
    const workspaceId = "ws-1";

    const db = {
      select: () => ({
        from: (table: unknown) => {
          if (table === teamTaskEvents) {
            return chainLimit([
              {
                eventType: "status.changed",
                status: "running",
                message: "started",
                metadata: null,
                createdAt: new Date("2026-05-24T10:00:00.000Z"),
              },
            ]);
          }
          if (table === hermesRuns) {
            return chainLimit([
              {
                id: "run-linked",
                workspaceId,
                input: { task_id: taskId },
                contextRefs: [],
                createdAt: new Date("2026-05-24T10:01:00.000Z"),
              },
              {
                id: "run-other",
                workspaceId,
                input: { task_id: "task-other" },
                contextRefs: [],
                createdAt: new Date("2026-05-24T10:02:00.000Z"),
              },
              {
                id: "run-ref",
                workspaceId,
                input: {},
                contextRefs: [{ type: "team_task", id: taskId }],
                createdAt: new Date("2026-05-24T10:03:00.000Z"),
              },
            ]);
          }
          if (table === hermesRunEvents) {
            return chainLimit([
              {
                eventType: "message.delta",
                payload: { text: "linked" },
                createdAt: new Date("2026-05-24T10:04:00.000Z"),
              },
              {
                eventType: "message.delta",
                payload: { text: "also linked" },
                createdAt: new Date("2026-05-24T10:05:00.000Z"),
              },
            ]);
          }
          if (table === auditEvents) {
            return chainLimit([]);
          }
          throw new Error(`unexpected table: ${String(table)}`);
        },
      }),
    } as never;

    const service = new TaskReplayService();
    Object.assign(service, {
      teamTaskRepo: {
        getTask: async () => ({ id: taskId, workspaceId }),
      },
    });

    const replay = await service.getReplay(db, taskId, workspaceId, 50);

    const hermesTimeline = replay.timeline.filter((item) => item.source === "hermes_run");
    expect(hermesTimeline).toHaveLength(2);
    expect(hermesTimeline.every((item) => item.event_type === "message.delta")).toBe(true);
    expect(replay.timeline.some((item) => item.source === "team_task")).toBe(true);
  });
});
