import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const hermesRuns = pgTable("hermes_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  userId: uuid("user_id").notNull(),
  sessionId: varchar("session_id", { length: 128 }),
  runType: varchar("run_type", { length: 64 }).notNull(),
  gatewayInstanceId: uuid("gateway_instance_id"),
  promptTemplateId: uuid("prompt_template_id"),
  promptTemplateVersionId: uuid("prompt_template_version_id"),
  status: varchar("status", { length: 32 }).notNull().default("queued"),
  input: jsonb("input").$type<Record<string, unknown>>().notNull().default({}),
  contextRefs: jsonb("context_refs")
    .$type<Array<{ type: string; id: string }>>()
    .notNull()
    .default([]),
  outputText: text("output_text"),
  errorCode: varchar("error_code", { length: 64 }),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: false }),
  finishedAt: timestamp("finished_at", { withTimezone: false }),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export type HermesRun = typeof hermesRuns.$inferSelect;
