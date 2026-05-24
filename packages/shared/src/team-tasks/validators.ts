import { z } from "zod";

import {
  TEAM_TASK_EVENT_TYPES,
  TEAM_TASK_RISK_LEVELS,
  TEAM_TASK_STATUSES,
  TEAM_TASK_TYPES,
} from "./constants";

export const teamTaskApproveSchema = z.object({
  reason: z.string().max(4096).optional().nullable(),
  auto_start: z.boolean().optional().default(false),
});

export const teamTaskRejectSchema = z.object({
  reason: z.string().min(1).max(4096),
});

export const teamTaskAssignedClientParamSchema = z.object({
  desktop_client_id: z.string().uuid(),
});

export const teamTaskCreateSchema = z.object({
  workspace_id: z.string().uuid(),
  project_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1).max(512),
  description: z.string().max(4096).optional().nullable(),
  task_type: z.enum(TEAM_TASK_TYPES),
  risk_level: z.enum(TEAM_TASK_RISK_LEVELS).default("low"),
  assignee_user_id: z.string().uuid().optional().nullable(),
  target_profile_id: z.string().max(128).optional().nullable(),
  target_agent_id: z.string().max(128).optional().nullable(),
  source_agent_id: z.string().max(128).optional().nullable(),
  workspace_path: z.string().max(1024).optional().nullable(),
  requires_approval: z.boolean().optional(),
  input: z.record(z.unknown()).optional().default({}),
  acceptance_criteria: z.array(z.string()).optional().default([]),
  context_refs: z
    .array(
      z.object({
        ref_type: z.string(),
        ref_id: z.string(),
      }),
    )
    .optional()
    .default([]),
});

export const teamTaskUpdateSchema = z.object({
  title: z.string().min(1).max(512).optional(),
  description: z.string().max(4096).optional().nullable(),
  task_type: z.enum(TEAM_TASK_TYPES).optional(),
  risk_level: z.enum(TEAM_TASK_RISK_LEVELS).optional(),
  workspace_path: z.string().max(1024).optional().nullable(),
  requires_approval: z.boolean().optional(),
  input: z.record(z.unknown()).optional(),
  acceptance_criteria: z.array(z.string()).optional(),
});

export const teamTaskAssignSchema = z.object({
  assignee_user_id: z.string().uuid(),
  target_profile_id: z.string().max(128).optional().nullable(),
  target_agent_id: z.string().max(128).optional().nullable(),
  desktop_client_id: z.string().uuid().optional().nullable(),
});

export const teamTaskAckSchema = z.object({
  desktop_client_id: z.string().uuid().optional().nullable(),
  profile_id: z.string().max(128).optional().nullable(),
});

export const teamTaskStatusSchema = z.object({
  status: z.enum(TEAM_TASK_STATUSES),
  profile_id: z.string().max(128).optional().nullable(),
  event_type: z.enum(TEAM_TASK_EVENT_TYPES).optional(),
  message: z.string().max(4096).optional().nullable(),
  progress: z.number().min(0).max(100).optional().nullable(),
  runtime: z.record(z.unknown()).optional().nullable(),
  desktop_client_id: z.string().uuid().optional().nullable(),
});

export const teamTaskResultSchema = z.object({
  status: z.enum(["succeeded", "failed"]),
  summary: z.string().max(4096).optional().nullable(),
  output_text: z.string().optional().nullable(),
  artifacts: z
    .array(
      z.object({
        type: z.string(),
        name: z.string(),
        storage_key: z.string().optional().nullable(),
        url: z.string().url().optional().nullable(),
      }),
    )
    .optional()
    .default([]),
  git_commit: z.string().optional().nullable(),
  pr_url: z.string().url().optional().nullable(),
  logs_summary: z.string().optional().nullable(),
  desktop_client_id: z.string().uuid().optional().nullable(),
});

export const teamTaskListQuerySchema = z.object({
  workspace_id: z.string().uuid(),
  status: z.enum(TEAM_TASK_STATUSES).optional(),
  assignee_user_id: z.string().uuid().optional(),
  task_type: z.enum(TEAM_TASK_TYPES).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  cursor: z.string().optional(),
});

export const teamTaskAssignedQuerySchema = z.object({
  workspace_id: z.string().uuid(),
  client_id: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  cursor: z.string().optional(),
});

export const teamTaskIdParamSchema = z.object({
  task_id: z.string().uuid(),
});
