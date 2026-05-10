export type RuntimeSession = {
  session_id: string;
  title: string;
  workspace: string;
  model: string;
  message_count: number;
  created_at?: string | number;
  updated_at?: string | number;
  pinned?: boolean;
  archived?: boolean;
  project_id?: string | null;
  profile?: string;
  source_tag?: string;
  is_cli_session?: boolean;
  active_stream_id?: string | null;
  pending_user_message?: string | null;
  /** 会话详情接口可能返回，用于 Composer 上下文环等 */
  last_usage?: Record<string, unknown>;
};

export type RuntimeMessage = {
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  attachments?: string[];
  reasoning?: string;
  timestamp?: number;
  _ts?: number;
  _error?: boolean;
  tool_calls?: unknown[];
};

export type RuntimeToolCall = {
  name: string;
  preview?: string;
  args?: Record<string, string>;
  snippet?: string;
  done: boolean;
  is_error?: boolean;
  duration?: number;
  tid: string;
  /** 关联到 messages 数组里哪条 assistant（回填用，用于将工具卡片渲染在对应气泡后） */
  assistant_msg_idx?: number;
};

export type RuntimeApproval = {
  command: string;
  description?: string;
  pattern_keys?: string[];
  pattern_key?: string;
  approval_id?: string | null;
  _session_id?: string;
};

export type RuntimeClarify = {
  question?: string;
  description?: string;
  choices_offered?: string[];
  choices?: string[];
  session_id?: string;
  _session_id?: string;
  kind?: "clarify";
};

export type RuntimeUsage = {
  input_tokens?: number;
  output_tokens?: number;
  estimated_cost?: number | null;
  context_length?: number;
  threshold_tokens?: number;
  last_prompt_tokens?: number;
};

export type RuntimeFsEntry = {
  name: string;
  path: string;
  type: "dir" | "file";
  size: number | null;
};

export type RuntimeFileContent = {
  path: string;
  content: string;
  size: number;
  lines: number;
};

