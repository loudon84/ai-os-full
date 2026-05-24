import type { TeamTaskStatus } from "@portal/shared";
import { HttpError } from "../../errors.js";

const TRANSITIONS: Record<TeamTaskStatus, TeamTaskStatus[]> = {
  draft: ["created", "cancelled"],
  created: ["assigned", "cancelled"],
  assigned: ["acknowledged", "rejected", "cancelled", "expired"],
  acknowledged: ["pending_approval", "running", "cancelled"],
  pending_approval: ["approved", "rejected"],
  approved: ["running"],
  running: ["succeeded", "failed", "cancelled"],
  succeeded: [],
  failed: ["retrying", "assigned"],
  cancelled: [],
  rejected: [],
  expired: [],
  retrying: ["assigned", "running"],
};

export function canTransition(from: TeamTaskStatus, to: TeamTaskStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: TeamTaskStatus, to: TeamTaskStatus): void {
  if (!canTransition(from, to)) {
    throw new HttpError(409, `Invalid task status transition: ${from} -> ${to}`, {
      code: "TEAM_TASK_INVALID_STATUS_TRANSITION",
      extra: { from, to },
    });
  }
}

export function isTerminalStatus(status: TeamTaskStatus): boolean {
  return ["succeeded", "failed", "cancelled", "rejected", "expired"].includes(status);
}

export function requiresApprovalForRisk(riskLevel: string): boolean {
  return riskLevel === "high" || riskLevel === "critical";
}
