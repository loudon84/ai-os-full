import type { EmailAddress, EmailReceiveProtocol } from "@portal/shared";

export interface FetchedAttachment {
  filename: string | null;
  contentType: string | null;
  size: number;
  content: Buffer;
  contentId: string | null;
  isInline: boolean;
}

export interface FetchedMessage {
  uid: string;
  messageId: string | null;
  from: EmailAddress | null;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  replyTo: EmailAddress[];
  subject: string | null;
  textBody: string | null;
  htmlBody: string | null;
  date: Date | null;
  inReplyTo: string | null;
  references: string[];
  attachments: FetchedAttachment[];
  flags: string[];
  folderPath: string;
  folderSpecialUse: string | null;
}

export interface FolderInfo {
  name: string;
  path: string;
  specialUse: string | null;
  totalMessages: number;
  unseenMessages: number;
}

export interface ReceiveConfig {
  protocol: EmailReceiveProtocol;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface MailboxProvider {
  connect(config: ReceiveConfig): Promise<void>;
  disconnect(): Promise<void>;
  listFolders(): Promise<FolderInfo[]>;
  fetchNewMessages(since: Date | null): Promise<FetchedMessage[]>;
  fetchMessageByUid(uid: string): Promise<FetchedMessage | null>;
  markAsRead(uids: string[]): Promise<void>;
  markAsStarred(uids: string[]): Promise<void>;
  moveToFolder(uids: string[], targetFolder: string): Promise<void>;
  deleteMessages(uids: string[]): Promise<void>;
}
