import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const hermesRunEvents = pgTable("hermes_run_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  seq: integer("seq").notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export type HermesRunEvent = typeof hermesRunEvents.$inferSelect;
