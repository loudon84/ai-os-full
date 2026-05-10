import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { documents } from "./documents.js";

export const documentVersions = pgTable(
  "document_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id),

    versionNo: integer("version_no").notNull(),

    snapshotBucket: varchar("snapshot_bucket", { length: 128 }).notNull(),
    snapshotKey: text("snapshot_key").notNull(),
    snapshotSizeBytes: bigint("snapshot_size_bytes", {
      mode: "number",
    }).notNull(),
    snapshotChecksumSha256: varchar("snapshot_checksum_sha256", {
      length: 64,
    }).notNull(),

    engine: varchar("engine", { length: 32 }).notNull(),
    engineVersion: varchar("engine_version", { length: 64 }).notNull(),
    schemaVersion: integer("schema_version").notNull().default(1),

    saveMode: varchar("save_mode", { length: 32 }).notNull().default("manual"),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: false })
      .notNull()
      .defaultNow(),

    createdFrom: varchar("created_from", { length: 32 }),
    relatedInteractionId: varchar("related_interaction_id", { length: 64 }),
    relatedPatchId: varchar("related_patch_id", { length: 64 }),
  },
  (table) => [
    unique("uq_document_versions_document_version").on(
      table.documentId,
      table.versionNo,
    ),
    check(
      "chk_document_versions_engine",
      sql`${table.engine} IN ('univer')`,
    ),
    check(
      "chk_document_versions_save_mode",
      sql`${table.saveMode} IN ('manual', 'autosave', 'system')`,
    ),
    check(
      "chk_document_versions_created_from",
      sql`${table.createdFrom} IS NULL OR ${table.createdFrom} IN ('manual_save', 'ai_patch_apply')`,
    ),
  ],
);

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type NewDocumentVersion = typeof documentVersions.$inferInsert;
