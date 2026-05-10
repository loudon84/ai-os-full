import {
  emailSyncLogs,
  type Db,
  type EmailSyncLog,
  type NewEmailSyncLog,
} from "@portal/db";
import { eq } from "drizzle-orm";

type Tx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

export class EmailSyncLogRepository {
  async create(db: Tx, values: NewEmailSyncLog): Promise<EmailSyncLog> {
    const rows = await db.insert(emailSyncLogs).values(values).returning();
    const log = rows[0];
    if (!log) {
      throw new Error("Failed to insert email sync log");
    }
    return log;
  }

  async complete(
    db: Tx,
    logId: string,
    values: {
      status: "success" | "failure";
      messagesFound?: number;
      messagesSynced?: number;
      errorMessage?: string | null;
    },
  ): Promise<void> {
    await db
      .update(emailSyncLogs)
      .set({
        completedAt: new Date(),
        status: values.status,
        messagesFound: values.messagesFound,
        messagesSynced: values.messagesSynced,
        errorMessage: values.errorMessage,
      })
      .where(eq(emailSyncLogs.id, logId));
  }
}
