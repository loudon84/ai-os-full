import { describe, expect, it } from "vitest";

import {
  assertTransition,
  canTransition,
  isTerminalStatus,
  requiresApprovalForRisk,
} from "../src/services/team-tasks/team-task-status-machine.js";
import { HttpError } from "../src/errors.js";

describe("team task status machine", () => {
  it("allows created -> assigned -> acknowledged -> running -> succeeded", () => {
    expect(canTransition("created", "assigned")).toBe(true);
    expect(canTransition("assigned", "acknowledged")).toBe(true);
    expect(canTransition("acknowledged", "running")).toBe(true);
    expect(canTransition("running", "succeeded")).toBe(true);
  });

  it("allows pending_approval -> approved -> running", () => {
    expect(canTransition("acknowledged", "pending_approval")).toBe(true);
    expect(canTransition("pending_approval", "approved")).toBe(true);
    expect(canTransition("approved", "running")).toBe(true);
  });

  it("rejects invalid transition with error code", () => {
    expect(() => assertTransition("succeeded", "running")).toThrow(HttpError);
    try {
      assertTransition("succeeded", "running");
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).code).toBe("TEAM_TASK_INVALID_STATUS_TRANSITION");
    }
  });

  it("identifies terminal statuses", () => {
    expect(isTerminalStatus("succeeded")).toBe(true);
    expect(isTerminalStatus("running")).toBe(false);
  });

  it("requires approval for high/critical risk", () => {
    expect(requiresApprovalForRisk("high")).toBe(true);
    expect(requiresApprovalForRisk("critical")).toBe(true);
    expect(requiresApprovalForRisk("low")).toBe(false);
  });
});
