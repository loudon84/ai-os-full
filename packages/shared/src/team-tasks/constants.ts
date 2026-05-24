export const TEAM_TASK_STATUSES = [
  "draft",
  "created",
  "assigned",
  "acknowledged",
  "pending_approval",
  "approved",
  "running",
  "succeeded",
  "failed",
  "cancelled",
  "rejected",
  "expired",
  "retrying",
] as const;
export type TeamTaskStatus = (typeof TEAM_TASK_STATUSES)[number];

export const TEAM_TASK_TERMINAL_STATUSES = [
  "succeeded",
  "failed",
  "cancelled",
  "rejected",
  "expired",
] as const;
export type TeamTaskTerminalStatus = (typeof TEAM_TASK_TERMINAL_STATUSES)[number];

export const TEAM_TASK_TYPES = [
  "content_generation",
  "code_change",
  "code_review",
  "document_edit",
  "email_draft",
  "research",
  "finance_analysis",
  "sales_analysis",
  "hr_screening",
  "plugin_install",
  "skill_install",
  "mcp_tool_call",
  "deployment",
  "custom",
] as const;
export type TeamTaskType = (typeof TEAM_TASK_TYPES)[number];

export const TEAM_TASK_RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export type TeamTaskRiskLevel = (typeof TEAM_TASK_RISK_LEVELS)[number];

export const TEAM_TASK_EVENT_TYPES = [
  "task_created",
  "task_assigned",
  "task_acknowledged",
  "approval_requested",
  "approval_granted",
  "approval_rejected",
  "gateway_run_started",
  "status_updated",
  "result_submitted",
  "task_cancelled",
  "task_retried",
  "task_expired",
] as const;
export type TeamTaskEventType = (typeof TEAM_TASK_EVENT_TYPES)[number];

export const TEAM_TASK_ARTIFACT_TYPES = [
  "document",
  "file",
  "url",
  "git_commit",
  "pr",
] as const;
export type TeamTaskArtifactType = (typeof TEAM_TASK_ARTIFACT_TYPES)[number];
