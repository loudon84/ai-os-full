export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "cancelled",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const BOARD_TYPES = ["kanban", "list", "calendar"] as const;
export type BoardType = (typeof BOARD_TYPES)[number];

export const PROJECT_STATUSES = ["active", "archived", "completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

// ===== Documents domain =====

export const DOCUMENT_TYPES = ["spreadsheet", "markdown", "pdf", "html"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_ENGINES = ["univer", "tiptap", "pdf-viewer", "html-viewer"] as const;
export type DocumentEngine = (typeof DOCUMENT_ENGINES)[number];

export const DOCUMENT_STATUSES = [
  "draft",
  "active",
  "archived",
  "deleted",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_PROVIDERS = ["local", "wecom", "onlyoffice"] as const;
export type DocumentProvider = (typeof DOCUMENT_PROVIDERS)[number];

export const DOCUMENT_PERMISSION_ROLES = ["view", "edit", "owner"] as const;
export type DocumentPermissionRole =
  (typeof DOCUMENT_PERMISSION_ROLES)[number];

export const DOCUMENT_PERMISSION_SUBJECTS = [
  "user",
  "role",
  "department",
] as const;
export type DocumentPermissionSubject =
  (typeof DOCUMENT_PERMISSION_SUBJECTS)[number];

export const SNAPSHOT_SAVE_MODES = ["manual", "autosave", "system"] as const;
export type SnapshotSaveMode = (typeof SNAPSHOT_SAVE_MODES)[number];

export const VERSION_CREATED_FROM = ["manual_save", "ai_patch_apply"] as const;
export type VersionCreatedFrom = (typeof VERSION_CREATED_FROM)[number];

export const SNAPSHOT_DEFAULT_MAX_BYTES = 20 * 1024 * 1024;

// ===== Email domain =====

export const EMAIL_PROVIDER_TYPES = [
  "gmail",
  "netease_163",
  "aliyun_enterprise",
  "tencent_exmail",
  "custom",
] as const;
export type EmailProviderType = (typeof EMAIL_PROVIDER_TYPES)[number];

export const EMAIL_RECEIVE_PROTOCOLS = ["imap", "pop3"] as const;
export type EmailReceiveProtocol = (typeof EMAIL_RECEIVE_PROTOCOLS)[number];

export const EMAIL_ACCOUNT_STATUSES = [
  "active",
  "error",
  "syncing",
  "disconnected",
  "deleted",
] as const;
export type EmailAccountStatus = (typeof EMAIL_ACCOUNT_STATUSES)[number];

export const EMAIL_MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const;
export type EmailMessageDirection = (typeof EMAIL_MESSAGE_DIRECTIONS)[number];

export const EMAIL_FOLDER_TYPES = [
  "inbox",
  "sent",
  "drafts",
  "trash",
  "spam",
  "starred",
  "archive",
  "custom",
] as const;
export type EmailFolderType = (typeof EMAIL_FOLDER_TYPES)[number];

export const EMAIL_BATCH_ACTIONS = [
  "markRead",
  "markUnread",
  "star",
  "unstar",
  "trash",
  "delete",
  "archive",
  "move",
] as const;
export type EmailBatchAction = (typeof EMAIL_BATCH_ACTIONS)[number];

export const EMAIL_SORT_FIELDS = ["date", "from", "subject"] as const;
export type EmailSortField = (typeof EMAIL_SORT_FIELDS)[number];

export const EMAIL_SYNC_TYPES = ["manual", "scheduled", "initial"] as const;
export type EmailSyncType = (typeof EMAIL_SYNC_TYPES)[number];

export const EMAIL_SYNC_STATUSES = ["running", "success", "failure"] as const;
export type EmailSyncStatus = (typeof EMAIL_SYNC_STATUSES)[number];

// ===== Auth/RBAC domain =====

export const USER_STATUSES = ["active", "disabled"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const WORKSPACE_STATUSES = ["active", "deleted"] as const;
export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[number];

export const MEMBERSHIP_ROLES = [
  "super_admin",
  "admin",
  "owner",
  "user",
] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const AUDIT_RESULTS = ["success", "failure"] as const;
export type AuditResult = (typeof AUDIT_RESULTS)[number];

export const PERMISSION_CODES = [
  "workspace.create",
  "workspace.read",
  "workspace.update",
  "workspace.delete",
  "membership.invite",
  "membership.update",
  "membership.remove",
  "role.create",
  "role.update",
  "role.delete",
  "role.assign_permissions",
  "permission.read",
  "user.read",
  "user.update",
  "user.disable",
  "audit.read",
  "auth.manage",
] as const;
export type PermissionCode = (typeof PERMISSION_CODES)[number];

export const SYSTEM_ROLE_PERMISSIONS: Record<string, readonly PermissionCode[]> = {
  super_admin: PERMISSION_CODES,
  admin: [
    "workspace.read",
    "workspace.update",
    "membership.invite",
    "membership.update",
    "membership.remove",
    "role.create",
    "role.update",
    "role.delete",
    "role.assign_permissions",
    "permission.read",
    "user.read",
    "user.update",
    "user.disable",
    "audit.read",
  ],
  owner: [
    "workspace.read",
    "workspace.update",
    "workspace.delete",
    "membership.invite",
    "membership.update",
    "membership.remove",
    "role.create",
    "role.update",
    "role.delete",
    "role.assign_permissions",
    "permission.read",
    "user.read",
    "audit.read",
  ],
  user: [
    "workspace.read",
    "permission.read",
  ],
} as const;
