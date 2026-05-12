import type { Db, EmailAccount, NewEmailMessage } from "@portal/db";
import type { EmailAddress } from "@portal/shared";

import { logger } from "../../middleware/logger.js";
import type { RequestContext } from "../../middleware/auth.js";
import { EmailAccountService } from "./email-account.service.js";
import { EmailSyncInProgressError } from "./errors.js";
import { type FetchedMessage, type ReceiveConfig } from "./providers/mailbox-provider.js";
import { ImapProvider } from "./providers/imap-provider.js";
import { EmailAccountRepository } from "./repository/email-account.repository.js";
import { EmailMessageRepository } from "./repository/email-message.repository.js";
import { EmailAttachmentRepository } from "./repository/email-attachment.repository.js";
import { EmailSyncLogRepository } from "./repository/email-sync-log.repository.js";

export interface SyncResult {
  syncedCount: number;
  status: "success" | "failure";
}

const DEFAULT_SINCE_DAYS = 30;

const FOLDER_PATH_TYPE_MAP: Record<string, string> = {
  inbox: "inbox",
  sent: "sent",
  drafts: "drafts",
  trash: "trash",
  junk: "spam",
  spam: "spam",
  archive: "archive",
  starred: "starred",
  "已发送": "sent",
  "草稿": "drafts",
  "垃圾邮件": "spam",
  "已删除邮件": "trash",
};

function inferFolderType(folderPath: string, specialUse?: string | null): string {
  if (specialUse) {
    const su = specialUse.toLowerCase();
    if (su.includes("\\inbox")) return "inbox";
    if (su.includes("\\sent")) return "sent";
    if (su.includes("\\drafts")) return "drafts";
    if (su.includes("\\junk")) return "spam";
    if (su.includes("\\trash")) return "trash";
    if (su.includes("\\archive")) return "archive";
    if (su.includes("\\flagged")) return "starred";
  }
  if (FOLDER_PATH_TYPE_MAP[folderPath]) return FOLDER_PATH_TYPE_MAP[folderPath];
  const lower = folderPath.toLowerCase();
  for (const [key, value] of Object.entries(FOLDER_PATH_TYPE_MAP)) {
    if (lower.includes(key)) return value;
  }
  return "custom";
}

function inferDirection(folderType: string): "inbound" | "outbound" {
  return folderType === "sent" || folderType === "drafts" ? "outbound" : "inbound";
}

function truncate(str: string | null | undefined, max: number): string | null {
  if (!str) return null;
  return str.length > max ? str.slice(0, max) : str;
}

export class EmailSyncService {
  private readonly runningAccounts = new Set<string>();

  constructor(
    private readonly db: Db,
    private readonly accountService: EmailAccountService,
    private readonly accountRepo: EmailAccountRepository,
    private readonly messageRepo: EmailMessageRepository,
    private readonly attachmentRepo: EmailAttachmentRepository,
    private readonly syncLogRepo: EmailSyncLogRepository,
  ) {}

  async triggerForCurrentAccount(ctx: RequestContext): Promise<SyncResult> {
    const account = await this.accountService.getCurrentAccountOr404(this.db, ctx);
    if (this.runningAccounts.has(account.id)) {
      throw new EmailSyncInProgressError();
    }

    this.runningAccounts.add(account.id);
    const startedAt = new Date();
    const log = await this.syncLogRepo.create(this.db, {
      emailAccountId: account.id,
      syncType: "manual",
      startedAt,
      status: "running",
    });

    try {
      const since = this.computeSince(account);
      logger.info(
        { accountId: account.id, since: since.toISOString(), emailAddress: account.emailAddress },
        "Email sync started",
      );

      const password = this.accountService.decryptPassword(account);
      const receiveConfig = this.toReceiveConfig(account, password);
      const provider = new ImapProvider();

      let syncedCount = 0;
      let messagesFound = 0;

      await provider.connect(receiveConfig);
      try {
        const fetchedMessages = await provider.fetchNewMessages(since);
        messagesFound = fetchedMessages.length;
        logger.info(
          { accountId: account.id, messagesFound, since: since.toISOString() },
          "Fetched messages from IMAP",
        );

        const persisted = await this.persistMessages(account, fetchedMessages);
        syncedCount = persisted;
      } finally {
        await provider.disconnect().catch(() => undefined);
      }

      await this.accountRepo.update(this.db, account.id, {
        status: "active",
        lastSyncAt: new Date(),
        lastSyncError: null,
        consecutiveSyncFailures: 0,
      });
      await this.syncLogRepo.complete(this.db, log.id, {
        status: "success",
        messagesFound,
        messagesSynced: syncedCount,
      });
      logger.info(
        { accountId: account.id, syncedCount },
        "Email sync completed",
      );
      return { syncedCount, status: "success" };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Email sync failed";
      logger.error(
        { err, accountId: account.id },
        "Email sync failed",
      );
      await this.accountRepo.update(this.db, account.id, {
        status: "error",
        lastSyncError: truncate(message, 500),
        consecutiveSyncFailures: account.consecutiveSyncFailures + 1,
      });
      await this.syncLogRepo.complete(this.db, log.id, {
        status: "failure",
        errorMessage: truncate(message, 500),
      });
      return { syncedCount: 0, status: "failure" };
    } finally {
      this.runningAccounts.delete(account.id);
    }
  }

  private computeSince(account: EmailAccount): Date {
    if (account.lastSyncAt) {
      const since = new Date(account.lastSyncAt);
      since.setDate(since.getDate() - 1);
      return since;
    }
    const since = new Date();
    since.setDate(since.getDate() - DEFAULT_SINCE_DAYS);
    return since;
  }

  private toReceiveConfig(account: EmailAccount, password: string): ReceiveConfig {
    if (account.receiveProtocol === "imap") {
      return {
        protocol: "imap",
        host: account.imapHost!,
        port: account.imapPort!,
        secure: account.imapSecure,
        username: account.username,
        password,
      };
    }
    return {
      protocol: "pop3",
      host: account.pop3Host!,
      port: account.pop3Port!,
      secure: account.pop3Secure,
      username: account.username,
      password,
    };
  }

  private async persistMessages(
    account: EmailAccount,
    messages: FetchedMessage[],
  ): Promise<number> {
    let syncedCount = 0;

    for (const msg of messages) {
      try {
        const folderType = inferFolderType(msg.folderPath, msg.folderSpecialUse);
        const direction = inferDirection(folderType);
        const isRead = msg.flags.includes("\\Seen");
        const isStarred = msg.flags.includes("\\Flagged");
        const snippet = msg.textBody
          ? msg.textBody.slice(0, 500).replace(/\r?\n/g, " ")
          : null;

        const addressToJsonb = (addrs: EmailAddress[]) =>
          addrs.map((a) => ({ name: a.name ?? undefined, address: a.address }));

        const values: NewEmailMessage = {
          workspaceId: account.workspaceId,
          emailAccountId: account.id,
          direction,
          providerUid: msg.uid,
          messageId: truncate(msg.messageId, 998),
          threadId: null,
          fromAddress: msg.from?.address ?? null,
          fromName: msg.from?.name ?? null,
          toAddresses: addressToJsonb(msg.to),
          ccAddresses: addressToJsonb(msg.cc),
          bccAddresses: addressToJsonb(msg.bcc),
          replyToAddresses: addressToJsonb(msg.replyTo),
          subject: msg.subject,
          snippet,
          textBody: msg.textBody,
          htmlBody: msg.htmlBody,
          date: msg.date,
          receivedAt: msg.date,
          sentAt: folderType === "sent" || folderType === "drafts" ? msg.date : null,
          isRead,
          isStarred,
          isDeleted: false,
          folderPath: msg.folderPath,
          folderType,
          hasAttachments: msg.attachments.length > 0,
          inReplyTo: truncate(msg.inReplyTo, 998),
          referencesList: msg.references,
        };

        await this.messageRepo.create(this.db, values);
        syncedCount++;
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes("uq_email_messages_account_uid")
        ) {
          continue;
        }
        logger.warn(
          { err, uid: msg.uid, accountId: account.id },
          "Failed to persist message, skipping",
        );
      }
    }

    return syncedCount;
  }
}
