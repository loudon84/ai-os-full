import { logger } from "../../middleware/logger.js";
import type { EmailSyncService, SyncResult } from "./email-sync.service.js";
import type { RequestContext } from "../../middleware/auth.js";

export class EmailSyncScheduler {
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly syncService: EmailSyncService) {}

  startForAccount(
    accountId: string,
    ctx: RequestContext,
    intervalMs: number,
  ): void {
    this.stopForAccount(accountId);
    const timer = setInterval(() => {
      this.syncService.triggerForCurrentAccount(ctx).catch((err) => {
        logger.error({ err, accountId }, "Scheduled email sync failed");
      });
    }, intervalMs);
    this.timers.set(accountId, timer);
  }

  stopForAccount(accountId: string): void {
    const timer = this.timers.get(accountId);
    if (!timer) return;
    clearInterval(timer);
    this.timers.delete(accountId);
  }

  triggerNow(ctx: RequestContext): Promise<SyncResult> {
    return this.syncService.triggerForCurrentAccount(ctx);
  }

  stopAll(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
  }
}
