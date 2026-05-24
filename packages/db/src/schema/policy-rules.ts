import {
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const policyRules = pgTable("policy_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  ruleKey: varchar("rule_key", { length: 128 }).notNull(),
  ruleType: varchar("rule_type", { length: 64 }).notNull(),
  ruleValue: jsonb("rule_value").$type<Record<string, unknown>>().notNull().default({}),
  createdByUserId: uuid("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export const policyRuleBindings = pgTable("policy_rule_bindings", {
  id: uuid("id").primaryKey().defaultRandom(),
  ruleId: uuid("rule_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  targetType: varchar("target_type", { length: 64 }).notNull(),
  targetId: uuid("target_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export type PolicyRule = typeof policyRules.$inferSelect;
