import {
  boolean,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const hermesToolCalls = pgTable("hermes_tool_calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  toolName: varchar("tool_name", { length: 128 }).notNull(),
  toolAction: varchar("tool_action", { length: 128 }).notNull(),
  input: jsonb("input").$type<Record<string, unknown>>().notNull().default({}),
  output: jsonb("output").$type<Record<string, unknown> | null>(),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  riskLevel: varchar("risk_level", { length: 32 }).notNull().default("low"),
  approvalRequired: boolean("approval_required").notNull().default(false),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: false }),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export type HermesToolCall = typeof hermesToolCalls.$inferSelect;
