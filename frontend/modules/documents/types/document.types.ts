import type {
  DocumentEngine,
  DocumentPermissionRole,
  DocumentProvider,
  DocumentStatus,
  DocumentType,
} from "@portal/shared";

export type { DocumentEngine, DocumentPermissionRole, DocumentProvider, DocumentStatus, DocumentType };

export interface DocumentMeta {
  id: string;
  title: string;
  document_type: DocumentType;
  engine: DocumentEngine;
  status: DocumentStatus;
  provider: DocumentProvider;
  current_version_no: number;
  owner_id: string;
  current_user_permission: DocumentPermissionRole;
  created_at: string;
  updated_at: string;
}

export interface SnapshotEnvelope {
  document_id: string;
  document_type: DocumentType;
  engine: DocumentEngine;
  engine_version: string;
  schema_version: number;
  version_no: number;
  saved_at: string;
  saved_by: string;
  snapshot: Record<string, unknown>;
}

export interface DocumentListResponse {
  items: DocumentMeta[];
  page: number;
  page_size: number;
  total: number;
}

export interface CreateDocumentRequest {
  title: string;
  document_type?: DocumentType;
  engine?: DocumentEngine;
}

export interface SnapshotSaveRequest {
  base_version_no: number;
  save_mode: "manual" | "autosave" | "system";
  engine_version: string;
  schema_version: number;
  snapshot: Record<string, unknown>;
  /** 与 ai-os-api §15.4 对齐：人工保存可省略，AI 批准写入后保存传 `ai_patch_apply` */
  created_from?: "manual_save" | "ai_patch_apply";
  related_interaction_id?: string;
  related_patch_id?: string;
}

export interface SnapshotSaveResponse {
  document_id: string;
  version_no: number;
  snapshot_size_bytes: number;
  snapshot_checksum_sha256: string;
  saved_at: string;
}

