import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { emailAccounts } from "./email-accounts.js";

export interface StoredEmailAddress {
  name?: string;
  address: string;
}

export const emailMessages = pgTable(
  "email_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull(),
    emailAccountId: uuid("email_account_id")
      .notNull()
      .references(() => emailAccounts.id),

    direction: varchar("direction", { length: 16 }).notNull(),
    providerUid: varchar("provider_uid", { length: 255 }),
    messageId: varchar("message_id", { length: 998 }),
    threadId: varchar("thread_id", { length: 998 }),

    fromAddress: varchar("from_address", { length: 320 }),
    fromName: varchar("from_name", { length: 255 }),
    toAddresses: jsonb("to_addresses")
      .$type<StoredEmailAddress[]>()
      .notNull()
      .default([]),
    ccAddresses: jsonb("cc_addresses")
      .$type<StoredEmailAddress[]>()
      .notNull()
      .default([]),
    bccAddresses: jsonb("bcc_addresses")
      .$type<StoredEmailAddress[]>()
      .notNull()
      .default([]),
    replyToAddresses: jsonb("reply_to_addresses")
      .$type<StoredEmailAddress[]>()
      .notNull()
      .default([]),

    subject: text("subject"),
    snippet: varchar("snippet", { length: 500 }),
    textBody: text("text_body"),
    htmlBody: text("html_body"),

    date: timestamp("date", { withTimezone: false }),
    receivedAt: timestamp("received_at", { withTimezone: false }),
    sentAt: timestamp("sent_at", { withTimezone: false }),

    isRead: boolean("is_read").notNull().default(false),
    isStarred: boolean("is_starred").notNull().default(false),
    isDeleted: boolean("is_deleted").notNull().default(false),
    folderPath: varchar("folder_path", { length: 512 }).notNull().default("INBOX"),
    folderType: varchar("folder_type", { length: 32 }).notNull().default("inbox"),
    hasAttachments: boolean("has_attachments").notNull().default(false),

    inReplyTo: varchar("in_reply_to", { length: 998 }),
    referencesList: jsonb("references_list")
      .$type<string[]>()
      .notNull()
      .default([]),
    relatedTaskId: uuid("related_task_id"),
    rawStorageKey: text("raw_storage_key"),

    createdAt: timestamp("created_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_email_messages_account_uid").on(
      table.emailAccountId,
      table.providerUid,
    ),
    check(
      "chk_email_messages_direction",
      sql`${table.direction} IN ('inbound', 'outbound')`,
    ),
    check(
      "chk_email_messages_folder_type",
      sql`${table.folderType} IN ('inbox', 'sent', 'drafts', 'trash', 'spam', 'starred', 'archive', 'custom')`,
    ),
  ],
);

export type EmailMessage = typeof emailMessages.$inferSelect;
export type NewEmailMessage = typeof emailMessages.$inferInsert;
