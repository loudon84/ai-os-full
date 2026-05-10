import { sql } from "drizzle-orm";
import {
  check,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id"),
    actorUserId: uuid("actor_user_id"),
    action: varchar("action", { length: 128 }).notNull(),
    targetType: varchar("target_type", { length: 64 }).notNull(),
    targetId: uuid("target_id"),
    result: varchar("result", { length: 32 }).notNull().default("success"),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),

    createdAt: timestamp("created_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "chk_audit_events_result",
      sql`${table.result} IN ('success', 'failure')`,
    ),
  ],
);

export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
