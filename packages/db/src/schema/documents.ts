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

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),

    title: varchar("title", { length: 255 }).notNull(),
    documentType: varchar("document_type", { length: 32 }).notNull(),
    engine: varchar("engine", { length: 32 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("active"),

    provider: varchar("provider", { length: 32 }).notNull().default("local"),
    externalId: varchar("external_id", { length: 255 }),
    externalUrl: text("external_url"),

    currentVersionNo: integer("current_version_no").notNull().default(1),
    currentVersionId: uuid("current_version_id"),

    ownerId: uuid("owner_id").notNull(),
    createdBy: uuid("created_by").notNull(),
    updatedBy: uuid("updated_by"),

    createdAt: timestamp("created_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: false }),
    deletedAt: timestamp("deleted_at", { withTimezone: false }),
  },
  (table) => [
    check("chk_documents_type", sql`${table.documentType} IN ('spreadsheet')`),
    check("chk_documents_engine", sql`${table.engine} IN ('univer')`),
    check(
      "chk_documents_status",
      sql`${table.status} IN ('draft', 'active', 'archived', 'deleted')`,
    ),
    check(
      "chk_documents_provider",
      sql`${table.provider} IN ('local', 'wecom', 'onlyoffice')`,
    ),
  ],
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
