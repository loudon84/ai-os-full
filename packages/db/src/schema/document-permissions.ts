import { sql } from "drizzle-orm";
import {
  check,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { documents } from "./documents.js";

export const documentPermissions = pgTable(
  "document_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id),

    subjectType: varchar("subject_type", { length: 32 }).notNull(),
    subjectId: uuid("subject_id").notNull(),
    role: varchar("role", { length: 32 }).notNull(),

    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_document_permissions_subject_role").on(
      table.documentId,
      table.subjectType,
      table.subjectId,
      table.role,
    ),
    check(
      "chk_document_permission_subject",
      sql`${table.subjectType} IN ('user', 'role', 'department')`,
    ),
    check(
      "chk_document_permission_role",
      sql`${table.role} IN ('view', 'edit', 'owner')`,
    ),
  ],
);

export type DocumentPermission = typeof documentPermissions.$inferSelect;
export type NewDocumentPermission = typeof documentPermissions.$inferInsert;
