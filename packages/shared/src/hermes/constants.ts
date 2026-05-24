export const HERMES_RUN_TYPES = [
  "chat",
  "team_task",
  "document",
  "email",
  "skill",
  "plugin",
] as const;
export type HermesRunType = (typeof HERMES_RUN_TYPES)[number];

export const HERMES_RUN_STATUSES = [
  "queued",
  "running",
  "waiting_approval",
  "succeeded",
  "failed",
  "cancelled",
] as const;
export type HermesRunStatus = (typeof HERMES_RUN_STATUSES)[number];

export const HERMES_RUN_EVENT_TYPES = [
  "run.created",
  "run.started",
  "message.delta",
  "reasoning.delta",
  "tool.call.created",
  "tool.call.completed",
  "approval.requested",
  "approval.resolved",
  "run.succeeded",
  "run.failed",
  "run.cancelled",
  "stream.end",
] as const;
export type HermesRunEventType = (typeof HERMES_RUN_EVENT_TYPES)[number];

export const HERMES_TOOL_CALL_STATUSES = [
  "pending",
  "running",
  "succeeded",
  "failed",
  "blocked",
] as const;
export type HermesToolCallStatus = (typeof HERMES_TOOL_CALL_STATUSES)[number];

export const HERMES_RISK_LEVELS = ["low", "medium", "high"] as const;
export type HermesRiskLevel = (typeof HERMES_RISK_LEVELS)[number];

export const HERMES_GATEWAY_TYPES = ["local", "remote"] as const;
export type HermesGatewayType = (typeof HERMES_GATEWAY_TYPES)[number];

export const HERMES_GATEWAY_STATUSES = [
  "unknown",
  "healthy",
  "unhealthy",
  "disabled",
] as const;
export type HermesGatewayStatus = (typeof HERMES_GATEWAY_STATUSES)[number];

export const HERMES_GATEWAY_AUTH_MODES = ["none", "bearer", "service_token"] as const;
export type HermesGatewayAuthMode = (typeof HERMES_GATEWAY_AUTH_MODES)[number];

export const PROMPT_TEMPLATE_SCENES = [
  "chat.default",
  "team_task.dispatch",
  "team_task.review",
  "document.summarize",
  "document.generate",
  "email.reply_draft",
  "skill_template.generate",
  "plugin_registry.evaluate",
  "audit_replay.summarize",
] as const;
export type PromptTemplateScene = (typeof PROMPT_TEMPLATE_SCENES)[number];

export const HERMES_CONTEXT_REF_TYPES = [
  "document",
  "email_thread",
  "skill_template",
  "team_task",
  "profile",
] as const;
export type HermesContextRefType = (typeof HERMES_CONTEXT_REF_TYPES)[number];
