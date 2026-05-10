import {
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { documents } from "./documents.js";

export const documentEvents = pgTable(
  "document_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id),

    eventType: varchar("event_type", { length: 64 }).notNull(),
    actorId: uuid("actor_id").notNull(),
    versionNo: integer("version_no"),
    payload: jsonb("payload").$type<Record<string, unknown> | null>(),

    createdAt: timestamp("created_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_document_events_document_created").on(
      table.documentId,
      table.createdAt,
    ),
  ],
);

export type DocumentEvent = typeof documentEvents.$inferSelect;
export type NewDocumentEvent = typeof documentEvents.$inferInsert;
