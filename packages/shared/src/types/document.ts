import type {
  DocumentEngine,
  DocumentPermissionRole,
  DocumentPermissionSubject,
  DocumentProvider,
  DocumentStatus,
  DocumentType,
  SnapshotSaveMode,
} from "../constants";

export interface DocumentCreateRequest {
  title: string;
  document_type?: DocumentType;
  engine?: DocumentEngine;
}

export interface DocumentUpdateRequest {
  title?: string | null;
  status?: DocumentStatus | null;
}

export interface DocumentResponse {
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

export interface PaginatedSnakeResponse {
  page: number;
  page_size: number;
  total: number;
}

export interface DocumentListResponse extends PaginatedSnakeResponse {
  items: DocumentResponse[];
}

export interface SnapshotSaveRequest {
  base_version_no: number;
  save_mode?: SnapshotSaveMode;
  engine_version: string;
  schema_version?: number;
  snapshot: Record<string, unknown>;
  created_from?: string | null;
  related_interaction_id?: string | null;
  related_patch_id?: string | null;
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

export interface SnapshotSaveResponse {
  document_id: string;
  version_no: number;
  snapshot_size_bytes: number;
  snapshot_checksum_sha256: string;
  saved_at: string;
}

export interface DocumentVersionResponse {
  id: string;
  document_id: string;
  version_no: number;
  snapshot_bucket: string;
  snapshot_key: string;
  snapshot_size_bytes: number;
  snapshot_checksum_sha256: string;
  engine: DocumentEngine;
  engine_version: string;
  schema_version: number;
  save_mode: SnapshotSaveMode;
  created_by: string;
  created_at: string;
  created_from?: string | null;
  related_interaction_id?: string | null;
  related_patch_id?: string | null;
}

export interface DocumentVersionListResponse extends PaginatedSnakeResponse {
  items: DocumentVersionResponse[];
}

export interface DocumentPermissionItem {
  subject_type: DocumentPermissionSubject;
  subject_id: string;
  role: DocumentPermissionRole;
}

export interface DocumentPermissionsResponse {
  items: DocumentPermissionItem[];
}

export interface DocumentPermissionsReplaceRequest {
  items: DocumentPermissionItem[];
}

export interface DocumentEventResponse {
  id: string;
  document_id: string;
  event_type: string;
  actor_id: string;
  version_no?: number | null;
  payload?: Record<string, unknown> | null;
  created_at: string;
}

export interface DocumentEventListResponse extends PaginatedSnakeResponse {
  items: DocumentEventResponse[];
}
