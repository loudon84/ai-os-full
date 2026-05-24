import type { Db } from "@portal/db";

import { logger } from "../middleware/logger.js";
import { DesktopClientRepository } from "../services/service-center/desktop-sync/desktop-client.repository.js";

const HEARTBEAT_STALE_MS = 15 * 60 * 1000;
const HEARTBEAT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export class DesktopHeartbeatCleanupJob {
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly repo = new DesktopClientRepository();

  constructor(
    private readonly db: Db,
    private readonly intervalMs = 300_000,
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.run().catch((err) => {
        logger.error({ err }, "Desktop heartbeat cleanup failed");
      });
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async run(): Promise<{ offline: number; deletedHeartbeats: number }> {
    const staleBefore = new Date(Date.now() - HEARTBEAT_STALE_MS);
    const deleteBefore = new Date(Date.now() - HEARTBEAT_RETENTION_MS);

    const offline = await this.repo.markStaleClientsOffline(this.db, staleBefore);
    const deletedHeartbeats = await this.repo.deleteStaleHeartbeats(
      this.db,
      deleteBefore,
    );

    if (offline.length > 0 || deletedHeartbeats.length > 0) {
      logger.info(
        { offline: offline.length, deletedHeartbeats: deletedHeartbeats.length },
        "Desktop heartbeat cleanup completed",
      );
    }

    return { offline: offline.length, deletedHeartbeats: deletedHeartbeats.length };
  }
}
