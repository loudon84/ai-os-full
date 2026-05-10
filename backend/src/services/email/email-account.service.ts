import type { Db, EmailAccount, NewEmailAccount } from "@portal/db";
import type {
  CreateEmailAccountInput,
  TestConnectionInput,
  TestConnectionResult,
  UpdateEmailAccountInput,
} from "@portal/shared";

import type { RequestContext } from "../../middleware/auth.js";
import { CredentialCryptoService } from "./credential-crypto.service.js";
import {
  EmailAccountExistsError,
  EmailAccountNotFoundError,
  EmailConnectionFailedError,
} from "./errors.js";
import { ImapProvider } from "./providers/imap-provider.js";
import type { MailboxProvider, ReceiveConfig } from "./providers/mailbox-provider.js";
import { Pop3Provider } from "./providers/pop3-provider.js";
import { EmailAccountRepository } from "./repository/email-account.repository.js";
import { SmtpSenderService, type SmtpConfig } from "./smtp-sender.service.js";

type Tx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

export class EmailAccountService {
  constructor(
    private readonly db: Db,
    private readonly repo: EmailAccountRepository,
    private readonly crypto: CredentialCryptoService,
    private readonly smtpSender: SmtpSenderService,
  ) {}

  async getCurrentAccount(ctx: RequestContext): Promise<EmailAccount | null> {
    return this.repo.findByUserId(this.db, ctx.userId);
  }

  async getCurrentAccountOr404(
    db: Tx,
    ctx: RequestContext,
  ): Promise<EmailAccount> {
    const account = await this.repo.findByUserId(db, ctx.userId);
    if (!account) {
      throw new EmailAccountNotFoundError();
    }
    return account;
  }

  async createAccount(
    ctx: RequestContext,
    input: CreateEmailAccountInput,
  ): Promise<EmailAccount> {
    return this.db.transaction(async (tx) => {
      const existing = await this.repo.findByUserId(tx, ctx.userId);
      if (existing) {
        throw new EmailAccountExistsError();
      }
      const encrypted = this.crypto.encrypt(input.password);
      return this.repo.create(tx, this.toInsert(ctx, input, encrypted));
    });
  }

  async updateAccount(
    ctx: RequestContext,
    input: UpdateEmailAccountInput,
  ): Promise<EmailAccount> {
    return this.db.transaction(async (tx) => {
      const account = await this.getCurrentAccountOr404(tx, ctx);
      const values: Partial<NewEmailAccount> = {};
      if (input.email_address !== undefined) values.emailAddress = input.email_address;
      if (input.display_name !== undefined) values.displayName = input.display_name;
      if (input.provider_type !== undefined) values.providerType = input.provider_type;
      if (input.receive_protocol !== undefined) values.receiveProtocol = input.receive_protocol;
      if (input.imap_host !== undefined) values.imapHost = input.imap_host;
      if (input.imap_port !== undefined) values.imapPort = input.imap_port;
      if (input.imap_secure !== undefined) values.imapSecure = input.imap_secure;
      if (input.pop3_host !== undefined) values.pop3Host = input.pop3_host;
      if (input.pop3_port !== undefined) values.pop3Port = input.pop3_port;
      if (input.pop3_secure !== undefined) values.pop3Secure = input.pop3_secure;
      if (input.smtp_host !== undefined) values.smtpHost = input.smtp_host;
      if (input.smtp_port !== undefined) values.smtpPort = input.smtp_port;
      if (input.smtp_secure !== undefined) values.smtpSecure = input.smtp_secure;
      if (input.smtp_require_starttls !== undefined) {
        values.smtpRequireStartTls = input.smtp_require_starttls;
      }
      if (input.username !== undefined) values.username = input.username;
      if (input.sync_interval_seconds !== undefined) {
        values.syncIntervalSeconds = input.sync_interval_seconds;
      }
      if (input.password !== undefined) {
        const encrypted = this.crypto.encrypt(input.password);
        values.encryptedPassword = encrypted.encrypted;
        values.passwordIv = encrypted.iv;
        values.passwordAuthTag = encrypted.authTag;
      }
      const updated = await this.repo.update(tx, account.id, values);
      if (!updated) {
        throw new EmailAccountNotFoundError();
      }
      return updated;
    });
  }

  async deleteAccount(ctx: RequestContext): Promise<void> {
    const account = await this.getCurrentAccountOr404(this.db, ctx);
    await this.repo.softDelete(this.db, account.id);
  }

  async testConnection(input: TestConnectionInput): Promise<TestConnectionResult> {
    const receiveConfig = this.toReceiveConfig(input, input.password);
    const smtpConfig = this.toSmtpConfig(input, input.password);
    const provider = this.createMailboxProvider(receiveConfig.protocol);
    const result: TestConnectionResult = {
      receive: { protocol: input.receive_protocol, success: false },
      smtp: { success: false },
    };

    try {
      await provider.connect(receiveConfig);
      result.receive.success = true;
    } catch (err) {
      result.receive.error = err instanceof Error ? err.message : "Receive test failed";
    } finally {
      await provider.disconnect().catch(() => undefined);
    }

    try {
      await this.smtpSender.testConnection(smtpConfig);
      result.smtp.success = true;
    } catch (err) {
      result.smtp.error = err instanceof Error ? err.message : "SMTP test failed";
    }

    if (!result.receive.success && !result.smtp.success) {
      throw new EmailConnectionFailedError("Receive and SMTP connection tests failed");
    }
    return result;
  }

  decryptPassword(account: EmailAccount): string {
    return this.crypto.decrypt({
      encrypted: account.encryptedPassword,
      iv: account.passwordIv,
      authTag: account.passwordAuthTag,
    });
  }

  toSmtpConfig(account: EmailAccount, password: string): SmtpConfig;
  toSmtpConfig(input: TestConnectionInput, password: string): SmtpConfig;
  toSmtpConfig(
    source: EmailAccount | TestConnectionInput,
    password: string,
  ): SmtpConfig {
    return {
      host: "smtpHost" in source ? source.smtpHost : source.smtp_host,
      port: "smtpPort" in source ? source.smtpPort : source.smtp_port,
      secure: "smtpSecure" in source ? source.smtpSecure : source.smtp_secure,
      requireStartTls:
        "smtpRequireStartTls" in source
          ? source.smtpRequireStartTls
          : source.smtp_require_starttls,
      username: source.username,
      password,
    };
  }

  private toReceiveConfig(
    input: TestConnectionInput,
    password: string,
  ): ReceiveConfig {
    if (input.receive_protocol === "imap") {
      return {
        protocol: "imap",
        host: input.imap_host!,
        port: input.imap_port!,
        secure: input.imap_secure,
        username: input.username,
        password,
      };
    }
    return {
      protocol: "pop3",
      host: input.pop3_host!,
      port: input.pop3_port!,
      secure: input.pop3_secure,
      username: input.username,
      password,
    };
  }

  private createMailboxProvider(protocol: "imap" | "pop3"): MailboxProvider {
    return protocol === "imap" ? new ImapProvider() : new Pop3Provider();
  }

  private toInsert(
    ctx: RequestContext,
    input: CreateEmailAccountInput,
    encrypted: { encrypted: string; iv: string; authTag: string },
  ): NewEmailAccount {
    return {
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      emailAddress: input.email_address,
      displayName: input.display_name ?? null,
      providerType: input.provider_type,
      receiveProtocol: input.receive_protocol,
      imapHost: input.imap_host ?? null,
      imapPort: input.imap_port ?? null,
      imapSecure: input.imap_secure,
      pop3Host: input.pop3_host ?? null,
      pop3Port: input.pop3_port ?? null,
      pop3Secure: input.pop3_secure,
      smtpHost: input.smtp_host,
      smtpPort: input.smtp_port,
      smtpSecure: input.smtp_secure,
      smtpRequireStartTls: input.smtp_require_starttls,
      username: input.username,
      encryptedPassword: encrypted.encrypted,
      passwordIv: encrypted.iv,
      passwordAuthTag: encrypted.authTag,
      syncEnabled: true,
      syncIntervalSeconds: input.sync_interval_seconds,
      status: "active",
    };
  }
}
