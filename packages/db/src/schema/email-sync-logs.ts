import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { emailAccounts } from "./email-accounts.js";

export const emailSyncLogs = pgTable(
  "email_sync_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    emailAccountId: uuid("email_account_id")
      .notNull()
      .references(() => emailAccounts.id),
    syncType: varchar("sync_type", { length: 16 }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: false }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: false }),
    status: varchar("status", { length: 16 }).notNull().default("running"),
    messagesFound: integer("messages_found").notNull().default(0),
    messagesSynced: integer("messages_synced").notNull().default(0),
    errorMessage: text("error_message"),
  },
  (table) => [
    check(
      "chk_email_sync_logs_type",
      sql`${table.syncType} IN ('manual', 'scheduled', 'initial')`,
    ),
    check(
      "chk_email_sync_logs_status",
      sql`${table.status} IN ('running', 'success', 'failure')`,
    ),
  ],
);

export type EmailSyncLog = typeof emailSyncLogs.$inferSelect;
export type NewEmailSyncLog = typeof emailSyncLogs.$inferInsert;
