import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const hermesGatewayInstances = pgTable("hermes_gateway_instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id"),
  name: varchar("name", { length: 128 }).notNull(),
  gatewayType: varchar("gateway_type", { length: 32 }).notNull(),
  baseUrl: text("base_url").notNull(),
  authMode: varchar("auth_mode", { length: 32 }).notNull().default("none"),
  authToken: text("auth_token"),
  status: varchar("status", { length: 32 }).notNull().default("unknown"),
  modelCapabilities: jsonb("model_capabilities")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  toolCapabilities: jsonb("tool_capabilities")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  lastHealthAt: timestamp("last_health_at", { withTimezone: false }),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export type HermesGatewayInstance = typeof hermesGatewayInstances.$inferSelect;
