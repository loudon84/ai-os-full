import {
  bigint,
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { emailMessages } from "./email-messages.js";

export const emailAttachments = pgTable("email_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  emailMessageId: uuid("email_message_id")
    .notNull()
    .references(() => emailMessages.id),

  filename: text("filename"),
  contentType: varchar("content_type", { length: 255 }),
  sizeBytes: bigint("size_bytes", { mode: "number" }),
  storageKey: text("storage_key").notNull(),
  sha256: varchar("sha256", { length: 64 }),
  contentId: varchar("content_id", { length: 255 }),
  isInline: boolean("is_inline").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: false })
    .notNull()
    .defaultNow(),
});

export type EmailAttachment = typeof emailAttachments.$inferSelect;
export type NewEmailAttachment = typeof emailAttachments.$inferInsert;
