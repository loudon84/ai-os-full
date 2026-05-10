import type { SheetRangeContext, SpreadsheetPatch } from "./documentAiSpreadsheet.types";

export type { SheetRangeContext, SpreadsheetPatch } from "./documentAiSpreadsheet.types";

/** POST /document-ai/interactions — wire shape matches os-facade `CreateDocumentAIInteractionRequestDTO`. */
export type CreateDocumentAiInteractionRequest = {
  document_id: string;
  workbook_id: string;
  version_id: string;
  session_id: string;
  mode: string;
  prompt: string;
  actor?: Record<string, unknown>;
  org_scope?: Record<string, unknown>;
  sheet_context: SheetRangeContext;
};

export type CreateDocumentAiInteractionResponse = {
  interaction_id: string;
  task_id: string | null;
  execution_id: string | null;
  status: string;
  stream_url: string;
  proposed_patch_id?: string | null;
};

export type DocumentAiInteraction = {
  interaction_id: string;
  document_id: string;
  workbook_id: string;
  version_id: string;
  session_id: string;
  mode: string;
  prompt: string;
  status: string;
  sheet_context?: Record<string, unknown> | null;
  task_id?: string | null;
  execution_id?: string | null;
  result_summary?: string | null;
  error?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PatchValidateRequest = {
  interaction_id: string;
  patch: SpreadsheetPatch;
};

export type PatchValidateResponse = {
  valid: boolean;
  patch_id: string;
  risk_level: "low" | "medium" | "high";
  affected_cells: number;
  warnings: string[];
};

export type PatchDecisionRequest = {
  decision: "approved" | "rejected";
  actor_user_id: string;
  client_applied: boolean;
  applied_at_client_version?: string | null;
  result?: Record<string, unknown> | null;
};

export type PatchDecisionResponse = {
  patch_id: string;
  apply_status: string;
  audit_event_id?: string | null;
};

export type DocumentAiPatchWire = {
  patch_id: string;
  interaction_id: string;
  document_id: string;
  workbook_id: string;
  version_id: string;
  patch_type: string;
  patch_json: Record<string, unknown>;
  risk_level: string;
  validation_status: string;
  apply_status: string;
  before_selection_hash?: string | null;
  after_selection_hash?: string | null;
  actor_user_id?: string | null;
  decision_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};
