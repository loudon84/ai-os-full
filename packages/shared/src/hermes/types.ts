import type {
  HermesGatewayAuthMode,
  HermesGatewayStatus,
  HermesGatewayType,
  HermesRiskLevel,
  HermesRunEventType,
  HermesRunStatus,
  HermesRunType,
  HermesToolCallStatus,
  PromptTemplateScene,
} from "./constants";

export interface HermesContextRef {
  type: string;
  id: string;
}

export interface HermesGatewayInstanceDto {
  gateway_id: string;
  workspace_id: string | null;
  name: string;
  gateway_type: HermesGatewayType;
  base_url: string;
  auth_mode: HermesGatewayAuthMode;
  status: HermesGatewayStatus;
  model_capabilities: Record<string, unknown>;
  tool_capabilities: Record<string, unknown>;
  last_health_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HermesRunDto {
  run_id: string;
  workspace_id: string;
  user_id: string;
  session_id: string | null;
  run_type: HermesRunType;
  gateway_instance_id: string | null;
  prompt_template_id: string | null;
  status: HermesRunStatus;
  input: Record<string, unknown>;
  context_refs: HermesContextRef[];
  output_text: string | null;
  error_code: string | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HermesRunEventDto {
  event_id: string;
  run_id: string;
  workspace_id: string;
  seq: number;
  event_type: HermesRunEventType | string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface HermesToolCallDto {
  tool_call_id: string;
  run_id: string;
  workspace_id: string;
  tool_name: string;
  tool_action: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status: HermesToolCallStatus;
  risk_level: HermesRiskLevel;
  approval_required: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromptTemplateDto {
  template_id: string;
  workspace_id: string;
  name: string;
  scene: PromptTemplateScene | string;
  description: string | null;
  latest_version_id: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromptTemplateVersionDto {
  version_id: string;
  template_id: string;
  version: number;
  body: string;
  variables: string[];
  created_at: string;
}

export interface ContextPackage {
  workspace: Record<string, unknown>;
  user: Record<string, unknown>;
  task: Record<string, unknown> | null;
  documents: Array<Record<string, unknown>>;
  emails: Array<Record<string, unknown>>;
  profiles: Array<Record<string, unknown>>;
  skills: Array<Record<string, unknown>>;
  plugins: Array<Record<string, unknown>>;
  audit_summary: Array<Record<string, unknown>>;
  source_refs: HermesContextRef[];
}

export interface TaskReplayTimelineItem {
  seq: number;
  source: "team_task" | "hermes_run" | "audit";
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface TaskReplayDto {
  task_id: string;
  workspace_id: string;
  timeline: TaskReplayTimelineItem[];
}
