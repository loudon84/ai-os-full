import type { Db } from "@portal/db";

import type { RequestContext } from "../../middleware/auth.js";
import { EmailAccountService } from "./email-account.service.js";
import { EmailSyncInProgressError } from "./errors.js";
import { EmailAccountRepository } from "./repository/email-account.repository.js";
import { EmailSyncLogRepository } from "./repository/email-sync-log.repository.js";

export interface SyncResult {
  syncedCount: number;
  status: "success" | "failure";
}

export class EmailSyncService {
  private readonly runningAccounts = new Set<string>();

  constructor(
    private readonly db: Db,
    private readonly accountService: EmailAccountService,
    private readonly accountRepo: EmailAccountRepository,
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
      await this.accountRepo.update(this.db, account.id, {
        status: "active",
        lastSyncAt: new Date(),
        lastSyncError: null,
        consecutiveSyncFailures: 0,
      });
      await this.syncLogRepo.complete(this.db, log.id, {
        status: "success",
        messagesFound: 0,
        messagesSynced: 0,
      });
      return { syncedCount: 0, status: "success" };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Email sync failed";
      await this.accountRepo.update(this.db, account.id, {
        status: "error",
        lastSyncError: message,
        consecutiveSyncFailures: account.consecutiveSyncFailures + 1,
      });
      await this.syncLogRepo.complete(this.db, log.id, {
        status: "failure",
        errorMessage: message,
      });
      return { syncedCount: 0, status: "failure" };
    } finally {
      this.runningAccounts.delete(account.id);
    }
  }
}
