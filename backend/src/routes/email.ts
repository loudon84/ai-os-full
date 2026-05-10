import type { Db, EmailAccount } from "@portal/db";
import {
  batchEmailActionSchema,
  createEmailAccountSchema,
  emailAttachmentIdParamSchema,
  emailListQuerySchema,
  emailMessageIdParamSchema,
  sendEmailSchema,
  testConnectionSchema,
  updateEmailAccountSchema,
  updateEmailMessageSchema,
  type BatchEmailActionResponse,
  type EmailAccountResponse,
  type EmailSyncResponse,
  type EmailSyncStatusResponse,
  type SendEmailResponse,
} from "@portal/shared";
import { Router, type Router as ExpressRouter } from "express";

import type { AppConfig } from "../config.js";
import type { AuditService } from "../services/audit/audit-service.js";
import type {
  EmailAccountService,
  EmailAttachmentRepository,
  EmailMessageService,
  EmailSyncService,
} from "../services/email/index.js";
import type { SnapshotStorage } from "../storage/snapshot-storage.js";

export interface EmailRouteDeps {
  db: Db;
  accountService: EmailAccountService;
  messageService: EmailMessageService;
  syncService: EmailSyncService;
  attachmentRepo: EmailAttachmentRepository;
  storage: SnapshotStorage;
  auditService: AuditService;
  config: AppConfig;
}

function toAccountResponse(account: EmailAccount): EmailAccountResponse {
  return {
    id: account.id,
    user_id: account.userId,
    workspace_id: account.workspaceId,
    email_address: account.emailAddress,
    display_name: account.displayName,
    provider_type: account.providerType as EmailAccountResponse["provider_type"],
    receive_protocol:
      account.receiveProtocol as EmailAccountResponse["receive_protocol"],
    imap_host: account.imapHost,
    imap_port: account.imapPort,
    imap_secure: account.imapSecure,
    pop3_host: account.pop3Host,
    pop3_port: account.pop3Port,
    pop3_secure: account.pop3Secure,
    smtp_host: account.smtpHost,
    smtp_port: account.smtpPort,
    smtp_secure: account.smtpSecure,
    smtp_require_starttls: account.smtpRequireStartTls,
    username: account.username,
    status: account.status as EmailAccountResponse["status"],
    sync_enabled: account.syncEnabled,
    sync_interval_seconds: account.syncIntervalSeconds,
    last_sync_at: account.lastSyncAt?.toISOString() ?? null,
    last_sync_error: account.lastSyncError,
    created_at: account.createdAt.toISOString(),
    updated_at: account.updatedAt.toISOString(),
  };
}

function emitAudit(
  deps: EmailRouteDeps,
  params: {
    workspaceId: string;
    userId: string;
    action: string;
    targetType: string;
    targetId: string | null;
    metadata?: Record<string, unknown> | null;
  },
): void {
  deps.auditService.emit({
    workspaceId: params.workspaceId,
    actorUserId: params.userId,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    result: "success",
    metadata: params.metadata ?? null,
  });
}

export function emailRoutes(deps: EmailRouteDeps): ExpressRouter {
  const router = Router();

  router.get("/account", async (req, res) => {
    const account = await deps.accountService.getCurrentAccount(req.ctx);
    res.json(account ? toAccountResponse(account) : null);
  });

  router.post("/account", async (req, res) => {
    const payload = createEmailAccountSchema.parse(req.body);
    const account = await deps.accountService.createAccount(req.ctx, payload);
    emitAudit(deps, {
      workspaceId: req.ctx.workspaceId,
      userId: req.ctx.userId,
      action: "email.account.create",
      targetType: "email_account",
      targetId: account.id,
      metadata: {
        provider: account.providerType,
        emailAddress: account.emailAddress,
      },
    });
    res.status(201).json(toAccountResponse(account));
  });

  router.patch("/account", async (req, res) => {
    const payload = updateEmailAccountSchema.parse(req.body);
    const account = await deps.accountService.updateAccount(req.ctx, payload);
    res.json(toAccountResponse(account));
  });

  router.delete("/account", async (req, res) => {
    const account = await deps.accountService.getCurrentAccountOr404(
      deps.db,
      req.ctx,
    );
    await deps.accountService.deleteAccount(req.ctx);
    emitAudit(deps, {
      workspaceId: req.ctx.workspaceId,
      userId: req.ctx.userId,
      action: "email.account.delete",
      targetType: "email_account",
      targetId: account.id,
      metadata: { emailAddress: account.emailAddress },
    });
    res.json({ ok: true });
  });

  router.post("/account/test", async (req, res) => {
    const payload = testConnectionSchema.parse(req.body);
    const result = await deps.accountService.testConnection(payload);
    res.json(result);
  });

  router.get("/messages", async (req, res) => {
    const query = emailListQuerySchema.parse(req.query);
    const result = await deps.messageService.listMessages(req.ctx, query);
    res.json(result);
  });

  router.get("/messages/:messageId", async (req, res) => {
    const { messageId } = emailMessageIdParamSchema.parse(req.params);
    const result = await deps.messageService.getMessage(req.ctx, messageId);
    res.json(result);
  });

  router.post("/messages/send", async (req, res) => {
    const payload = sendEmailSchema.parse(req.body);
    const result = await deps.messageService.sendMessage(req.ctx, payload);
    emitAudit(deps, {
      workspaceId: req.ctx.workspaceId,
      userId: req.ctx.userId,
      action: "email.message.send",
      targetType: "email_message",
      targetId: result.messageId,
      metadata: {
        to: payload.to.map((address) => address.address),
        subject: payload.subject,
      },
    });
    const body: SendEmailResponse = { message_id: result.messageId };
    res.status(201).json(body);
  });

  router.patch("/messages/:messageId", async (req, res) => {
    const { messageId } = emailMessageIdParamSchema.parse(req.params);
    const payload = updateEmailMessageSchema.parse(req.body);
    const result = await deps.messageService.updateMessage(
      req.ctx,
      messageId,
      payload,
    );
    res.json(result);
  });

  router.delete("/messages/:messageId", async (req, res) => {
    const { messageId } = emailMessageIdParamSchema.parse(req.params);
    const permanent = req.query.permanent === "true";
    await deps.messageService.deleteMessage(req.ctx, messageId, permanent);
    res.json({ ok: true });
  });

  router.post("/messages/actions", async (req, res) => {
    const payload = batchEmailActionSchema.parse(req.body);
    const affected = await deps.messageService.batchAction(req.ctx, payload);
    emitAudit(deps, {
      workspaceId: req.ctx.workspaceId,
      userId: req.ctx.userId,
      action: "email.message.batch_action",
      targetType: "email_message",
      targetId: null,
      metadata: { action: payload.action, count: affected },
    });
    const body: BatchEmailActionResponse = { affected };
    res.json(body);
  });

  router.get("/folders", async (req, res) => {
    const result = await deps.messageService.listFolders(req.ctx);
    res.json(result);
  });

  router.post("/sync", async (req, res) => {
    const result = await deps.syncService.triggerForCurrentAccount(req.ctx);
    emitAudit(deps, {
      workspaceId: req.ctx.workspaceId,
      userId: req.ctx.userId,
      action: "email.sync.complete",
      targetType: "email_account",
      targetId: null,
      metadata: {
        syncedCount: result.syncedCount,
        status: result.status,
      },
    });
    const body: EmailSyncResponse = {
      synced_count: result.syncedCount,
      status: result.status,
    };
    res.json(body);
  });

  router.get("/sync/status", async (req, res) => {
    const account = await deps.accountService.getCurrentAccountOr404(
      deps.db,
      req.ctx,
    );
    const body: EmailSyncStatusResponse = {
      last_sync_at: account.lastSyncAt?.toISOString() ?? null,
      status: account.status as EmailSyncStatusResponse["status"],
      error: account.lastSyncError,
    };
    res.json(body);
  });

  router.get("/attachments/:attachmentId", async (req, res) => {
    const { attachmentId } = emailAttachmentIdParamSchema.parse(req.params);
    const attachment = await deps.attachmentRepo.findById(deps.db, attachmentId);
    if (!attachment) {
      res.status(404).json({ code: "email_attachment_not_found", message: "Attachment not found" });
      return;
    }
    await deps.messageService.ensureMessageOwner(
      deps.db,
      req.ctx,
      attachment.emailMessageId,
    );
    const bytes = await deps.storage.getSnapshot({
      bucket: deps.config.emailAttachmentBucket,
      key: attachment.storageKey,
    });
    emitAudit(deps, {
      workspaceId: req.ctx.workspaceId,
      userId: req.ctx.userId,
      action: "email.attachment.download",
      targetType: "email_attachment",
      targetId: attachment.id,
      metadata: { filename: attachment.filename },
    });
    res.setHeader("Content-Type", attachment.contentType ?? "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${attachment.filename ?? "attachment"}"`,
    );
    res.send(bytes);
  });

  return router;
}
