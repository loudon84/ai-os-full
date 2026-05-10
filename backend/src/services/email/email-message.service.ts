import type { Db, EmailAttachment, EmailMessage, NewEmailMessage } from "@portal/db";
import type {
  BatchEmailActionInput,
  EmailAttachmentResponse,
  EmailFolderResponse,
  EmailListQueryInput,
  EmailListResponse,
  EmailMessageResponse,
  SendEmailInput,
  UpdateEmailMessageInput,
} from "@portal/shared";

import type { RequestContext } from "../../middleware/auth.js";
import { EmailAccountService } from "./email-account.service.js";
import { EmailMessageNotFoundError } from "./errors.js";
import { EmailAttachmentRepository } from "./repository/email-attachment.repository.js";
import { EmailMessageRepository } from "./repository/email-message.repository.js";
import { SmtpSenderService } from "./smtp-sender.service.js";

type Tx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

export class EmailMessageService {
  constructor(
    private readonly db: Db,
    private readonly accountService: EmailAccountService,
    private readonly messageRepo: EmailMessageRepository,
    private readonly attachmentRepo: EmailAttachmentRepository,
    private readonly smtpSender: SmtpSenderService,
  ) {}

  async listMessages(
    ctx: RequestContext,
    query: EmailListQueryInput,
  ): Promise<EmailListResponse> {
    const account = await this.accountService.getCurrentAccountOr404(this.db, ctx);
    const { items, total } = await this.messageRepo.list(this.db, {
      ...query,
      emailAccountId: account.id,
    });
    const responses = await Promise.all(
      items.map((message) => this.toMessageResponse(this.db, message)),
    );
    return {
      items: responses,
      page: query.page,
      page_size: query.page_size,
      total,
    };
  }

  async getMessage(
    ctx: RequestContext,
    messageId: string,
  ): Promise<EmailMessageResponse> {
    const message = await this.ensureMessageOwner(this.db, ctx, messageId);
    return this.toMessageResponse(this.db, message);
  }

  async sendMessage(
    ctx: RequestContext,
    input: SendEmailInput,
  ): Promise<{ messageId: string }> {
    const account = await this.accountService.getCurrentAccountOr404(this.db, ctx);
    const password = this.accountService.decryptPassword(account);
    const sent = await this.smtpSender.send({
      config: this.accountService.toSmtpConfig(account, password),
      from: {
        name: account.displayName ?? undefined,
        address: account.emailAddress,
      },
      payload: input,
    });

    const message = await this.messageRepo.create(this.db, {
      workspaceId: ctx.workspaceId,
      emailAccountId: account.id,
      direction: "outbound",
      messageId: sent.messageId,
      threadId: input.in_reply_to ?? sent.messageId,
      fromAddress: account.emailAddress,
      fromName: account.displayName,
      toAddresses: input.to,
      ccAddresses: input.cc,
      bccAddresses: input.bcc,
      replyToAddresses: [],
      subject: input.subject,
      snippet: input.body_text?.slice(0, 500) ?? null,
      textBody: input.body_text ?? null,
      htmlBody: input.body_html,
      sentAt: new Date(),
      date: new Date(),
      folderPath: "Sent",
      folderType: "sent",
      isRead: true,
      inReplyTo: input.in_reply_to ?? null,
      referencesList: input.references,
      hasAttachments: input.attachment_ids.length > 0,
    });

    return { messageId: message.id };
  }

  async updateMessage(
    ctx: RequestContext,
    messageId: string,
    input: UpdateEmailMessageInput,
  ): Promise<EmailMessageResponse> {
    await this.ensureMessageOwner(this.db, ctx, messageId);
    const updated = await this.messageRepo.updateFlags(this.db, messageId, {
      isRead: input.is_read,
      isStarred: input.is_starred,
    });
    if (!updated) {
      throw new EmailMessageNotFoundError();
    }
    return this.toMessageResponse(this.db, updated);
  }

  async deleteMessage(
    ctx: RequestContext,
    messageId: string,
    permanent: boolean,
  ): Promise<void> {
    await this.ensureMessageOwner(this.db, ctx, messageId);
    if (permanent) {
      await this.messageRepo.deletePermanent(this.db, messageId);
      return;
    }
    await this.messageRepo.moveToTrash(this.db, messageId);
  }

  async batchAction(
    ctx: RequestContext,
    input: BatchEmailActionInput,
  ): Promise<number> {
    const account = await this.accountService.getCurrentAccountOr404(this.db, ctx);
    const ownedMessages = await Promise.all(
      input.message_ids.map((id) => this.messageRepo.findById(this.db, id)),
    );
    const ownedIds = ownedMessages
      .filter((message): message is EmailMessage =>
        Boolean(message && message.emailAccountId === account.id),
      )
      .map((message) => message.id);
    if (ownedIds.length === 0) return 0;

    const values: Partial<NewEmailMessage> = {};
    switch (input.action) {
      case "markRead":
        values.isRead = true;
        break;
      case "markUnread":
        values.isRead = false;
        break;
      case "star":
        values.isStarred = true;
        break;
      case "unstar":
        values.isStarred = false;
        break;
      case "trash":
        values.folderType = "trash";
        values.folderPath = "Trash";
        values.isDeleted = true;
        break;
      case "delete":
        values.isDeleted = true;
        break;
      case "archive":
        values.folderType = "archive";
        values.folderPath = "Archive";
        break;
      case "move":
        values.folderType = "custom";
        values.folderPath = input.target_folder;
        break;
      default: {
        const exhaustive: never = input.action;
        throw new Error(`Unsupported email action: ${exhaustive}`);
      }
    }
    return this.messageRepo.batchUpdate(this.db, ownedIds, values);
  }

  async listFolders(ctx: RequestContext): Promise<EmailFolderResponse[]> {
    const account = await this.accountService.getCurrentAccountOr404(this.db, ctx);
    const rows = await this.messageRepo.listFolders(this.db, account.id);
    return rows.map((row) => ({
      name: row.folderPath.split("/").at(-1) ?? row.folderPath,
      path: row.folderPath,
      type: row.folderType as EmailFolderResponse["type"],
      unread_count: row.unreadCount,
      total_count: row.totalCount,
    }));
  }

  async ensureMessageOwner(
    db: Tx,
    ctx: RequestContext,
    messageId: string,
  ): Promise<EmailMessage> {
    const account = await this.accountService.getCurrentAccountOr404(db, ctx);
    const message = await this.messageRepo.findById(db, messageId);
    if (!message || message.emailAccountId !== account.id) {
      throw new EmailMessageNotFoundError();
    }
    return message;
  }

  private async toMessageResponse(
    db: Tx,
    message: EmailMessage,
  ): Promise<EmailMessageResponse> {
    const attachments = await this.attachmentRepo.listByMessageId(db, message.id);
    return {
      id: message.id,
      email_account_id: message.emailAccountId,
      direction: message.direction as EmailMessageResponse["direction"],
      provider_uid: message.providerUid,
      message_id: message.messageId,
      thread_id: message.threadId,
      from: message.fromAddress
        ? { name: message.fromName ?? undefined, address: message.fromAddress }
        : null,
      to: message.toAddresses,
      cc: message.ccAddresses,
      bcc: message.bccAddresses,
      reply_to: message.replyToAddresses,
      subject: message.subject,
      snippet: message.snippet,
      text_body: message.textBody,
      html_body: message.htmlBody,
      date: message.date?.toISOString() ?? null,
      received_at: message.receivedAt?.toISOString() ?? null,
      sent_at: message.sentAt?.toISOString() ?? null,
      is_read: message.isRead,
      is_starred: message.isStarred,
      is_deleted: message.isDeleted,
      folder_path: message.folderPath,
      folder_type: message.folderType as EmailMessageResponse["folder_type"],
      has_attachments: message.hasAttachments,
      attachments: attachments.map((attachment) => this.toAttachmentResponse(attachment)),
      in_reply_to: message.inReplyTo,
      references: message.referencesList,
      related_task_id: message.relatedTaskId,
      created_at: message.createdAt.toISOString(),
    };
  }

  private toAttachmentResponse(
    attachment: EmailAttachment,
  ): EmailAttachmentResponse {
    return {
      id: attachment.id,
      email_message_id: attachment.emailMessageId,
      filename: attachment.filename,
      content_type: attachment.contentType,
      size_bytes: attachment.sizeBytes,
      storage_key: attachment.storageKey,
      sha256: attachment.sha256,
      content_id: attachment.contentId,
      is_inline: attachment.isInline,
      created_at: attachment.createdAt.toISOString(),
    };
  }
}
