import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";
import { workspaces } from "./workspaces.js";

export const emailAccounts = pgTable(
  "email_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),

    emailAddress: varchar("email_address", { length: 320 }).notNull(),
    displayName: varchar("display_name", { length: 128 }),
    providerType: varchar("provider_type", { length: 32 })
      .notNull()
      .default("custom"),
    receiveProtocol: varchar("receive_protocol", { length: 8 })
      .notNull()
      .default("imap"),

    imapHost: varchar("imap_host", { length: 255 }),
    imapPort: integer("imap_port"),
    imapSecure: boolean("imap_secure").notNull().default(true),
    pop3Host: varchar("pop3_host", { length: 255 }),
    pop3Port: integer("pop3_port"),
    pop3Secure: boolean("pop3_secure").notNull().default(true),

    smtpHost: varchar("smtp_host", { length: 255 }).notNull(),
    smtpPort: integer("smtp_port").notNull(),
    smtpSecure: boolean("smtp_secure").notNull().default(true),
    smtpRequireStartTls: boolean("smtp_require_starttls")
      .notNull()
      .default(false),

    username: varchar("username", { length: 320 }).notNull(),
    encryptedPassword: text("encrypted_password").notNull(),
    passwordIv: varchar("password_iv", { length: 32 }).notNull(),
    passwordAuthTag: varchar("password_auth_tag", { length: 32 }).notNull(),

    syncEnabled: boolean("sync_enabled").notNull().default(true),
    syncIntervalSeconds: integer("sync_interval_seconds")
      .notNull()
      .default(300),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: false }),
    lastSyncError: text("last_sync_error"),
    consecutiveSyncFailures: integer("consecutive_sync_failures")
      .notNull()
      .default(0),

    status: varchar("status", { length: 32 }).notNull().default("active"),

    createdAt: timestamp("created_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: false }),
  },
  (table) => [
    unique("uq_email_accounts_user").on(table.userId),
    check(
      "chk_email_accounts_status",
      sql`${table.status} IN ('active', 'error', 'syncing', 'disconnected', 'deleted')`,
    ),
    check(
      "chk_email_accounts_protocol",
      sql`${table.receiveProtocol} IN ('imap', 'pop3')`,
    ),
    check(
      "chk_email_accounts_provider",
      sql`${table.providerType} IN ('gmail', 'netease_163', 'aliyun_enterprise', 'tencent_exmail', 'custom')`,
    ),
  ],
);

export type EmailAccount = typeof emailAccounts.$inferSelect;
export type NewEmailAccount = typeof emailAccounts.$inferInsert;
