import type {
  EmailAccountStatus,
  EmailBatchAction,
  EmailFolderType,
  EmailMessageDirection,
  EmailProviderType,
  EmailReceiveProtocol,
  EmailSortField,
  EmailSyncStatus,
} from "../constants";

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface EmailAccountResponse {
  id: string;
  user_id: string;
  workspace_id: string;
  email_address: string;
  display_name: string | null;
  provider_type: EmailProviderType;
  receive_protocol: EmailReceiveProtocol;
  imap_host: string | null;
  imap_port: number | null;
  imap_secure: boolean;
  pop3_host: string | null;
  pop3_port: number | null;
  pop3_secure: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_require_starttls: boolean;
  username: string;
  status: EmailAccountStatus;
  sync_enabled: boolean;
  sync_interval_seconds: number;
  last_sync_at: string | null;
  last_sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEmailAccountRequest {
  email_address: string;
  display_name?: string | null;
  provider_type: EmailProviderType;
  receive_protocol: EmailReceiveProtocol;
  imap_host?: string | null;
  imap_port?: number | null;
  imap_secure?: boolean;
  pop3_host?: string | null;
  pop3_port?: number | null;
  pop3_secure?: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure?: boolean;
  smtp_require_starttls?: boolean;
  username: string;
  password: string;
  sync_interval_seconds?: number;
}

export type UpdateEmailAccountRequest = Partial<CreateEmailAccountRequest>;

export interface TestConnectionRequest extends CreateEmailAccountRequest {}

export interface TestConnectionResult {
  receive: {
    protocol: EmailReceiveProtocol;
    success: boolean;
    error?: string;
  };
  smtp: {
    success: boolean;
    error?: string;
  };
}

export interface EmailAttachmentResponse {
  id: string;
  email_message_id: string;
  filename: string | null;
  content_type: string | null;
  size_bytes: number | null;
  storage_key: string;
  sha256: string | null;
  content_id: string | null;
  is_inline: boolean;
  created_at: string;
}

export interface EmailMessageResponse {
  id: string;
  email_account_id: string;
  direction: EmailMessageDirection;
  provider_uid: string | null;
  message_id: string | null;
  thread_id: string | null;
  from: EmailAddress | null;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  reply_to: EmailAddress[];
  subject: string | null;
  snippet: string | null;
  text_body: string | null;
  html_body: string | null;
  date: string | null;
  received_at: string | null;
  sent_at: string | null;
  is_read: boolean;
  is_starred: boolean;
  is_deleted: boolean;
  folder_path: string;
  folder_type: EmailFolderType;
  has_attachments: boolean;
  attachments: EmailAttachmentResponse[];
  in_reply_to: string | null;
  references: string[];
  related_task_id: string | null;
  created_at: string;
}

export interface EmailFolderResponse {
  name: string;
  path: string;
  type: EmailFolderType;
  unread_count: number;
  total_count: number;
}

export interface EmailListParams {
  folder_path?: string;
  folder_type?: EmailFolderType;
  search?: string;
  is_read?: boolean;
  is_starred?: boolean;
  has_attachments?: boolean;
  page?: number;
  page_size?: number;
  sort_by?: EmailSortField;
  sort_order?: "asc" | "desc";
}

export interface EmailListResponse {
  items: EmailMessageResponse[];
  page: number;
  page_size: number;
  total: number;
}

export interface SendEmailRequest {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body_html: string;
  body_text?: string | null;
  in_reply_to?: string | null;
  references?: string[];
  attachment_ids?: string[];
}

export interface SendEmailResponse {
  message_id: string;
}

export interface UpdateEmailMessageRequest {
  is_read?: boolean;
  is_starred?: boolean;
}

export interface BatchEmailActionRequest {
  message_ids: string[];
  action: EmailBatchAction;
  target_folder?: string;
}

export interface BatchEmailActionResponse {
  affected: number;
}

export interface EmailSyncResponse {
  synced_count: number;
  status: EmailSyncStatus | EmailAccountStatus;
}

export interface EmailSyncStatusResponse {
  last_sync_at: string | null;
  status: EmailAccountStatus;
  error?: string | null;
}
