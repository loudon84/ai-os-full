import { describe, expect, it } from "vitest";

import { HermesEventService } from "../src/services/hermes/hermes-event.service.js";

describe("HermesEventService", () => {
  it("increments seq when appending events", async () => {
    let maxSeq = 0;
    const service = new HermesEventService();
    const repo = {
      getMaxEventSeq: async () => maxSeq,
      appendRunEvent: async (_db: unknown, data: { seq: number }) => {
        maxSeq = data.seq;
        return {
          id: `evt-${data.seq}`,
          runId: "run-1",
          workspaceId: "ws-1",
          seq: data.seq,
          eventType: "message.delta",
          payload: { text: "hi" },
          createdAt: new Date(),
        };
      },
    };

    Object.assign(service, { repo });

    const first = await service.appendEvent({} as never, {
      runId: "run-1",
      workspaceId: "ws-1",
      eventType: "message.delta",
      payload: { text: "hi" },
    });
    const second = await service.appendEvent({} as never, {
      runId: "run-1",
      workspaceId: "ws-1",
      eventType: "message.delta",
      payload: { text: "there" },
    });

    expect(first.seq).toBe(1);
    expect(second.seq).toBe(2);
  });

  it("detects terminal events", () => {
    const service = new HermesEventService();
    expect(service.isTerminalEvent("run.succeeded")).toBe(true);
    expect(service.isTerminalEvent("message.delta")).toBe(false);
  });
});
