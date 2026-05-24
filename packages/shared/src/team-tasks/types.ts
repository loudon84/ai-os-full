import type {
  TeamTaskArtifactType,
  TeamTaskEventType,
  TeamTaskRiskLevel,
  TeamTaskStatus,
  TeamTaskType,
} from "./constants";

export interface TeamTaskDto {
  task_id: string;
  workspace_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  task_type: TeamTaskType;
  risk_level: TeamTaskRiskLevel;
  status: TeamTaskStatus;
  assignee_user_id: string | null;
  target_profile_id: string | null;
  target_agent_id: string | null;
  source_agent_id: string | null;
  created_by_user_id: string;
  workspace_path: string | null;
  requires_approval: boolean;
  input: Record<string, unknown>;
  acceptance_criteria: string[];
  created_at: string;
  updated_at: string;
}

export interface TeamTaskEventDto {
  id: string;
  task_id: string;
  workspace_id: string;
  event_type: TeamTaskEventType;
  status: TeamTaskStatus | null;
  message: string | null;
  actor_user_id: string | null;
  actor_agent_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface TeamTaskResultDto {
  task_id: string;
  status: TeamTaskStatus;
  summary: string | null;
  output_text: string | null;
  git_commit: string | null;
  pr_url: string | null;
  logs_summary: string | null;
  created_at: string;
}

export interface TeamTaskArtifactDto {
  id: string;
  task_id: string;
  type: TeamTaskArtifactType;
  name: string;
  storage_key: string | null;
  url: string | null;
  created_at: string;
}

export interface TeamTaskAssignedItemDto {
  task_id: string;
  workspace_id: string;
  project_id: string | null;
  title: string;
  task_type: TeamTaskType;
  risk_level: TeamTaskRiskLevel;
  status: TeamTaskStatus;
  assignee_user_id: string | null;
  target_profile_id: string | null;
  workspace_path: string | null;
  requires_approval: boolean;
  input: Record<string, unknown>;
  acceptance_criteria: string[];
  created_at: string;
}
