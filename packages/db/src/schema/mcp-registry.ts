import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const mcpServers = pgTable("mcp_servers", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  serverType: varchar("server_type", { length: 64 }).notNull(),
  baseUrl: text("base_url"),
  config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
  enabled: boolean("enabled").notNull().default(true),
  createdByUserId: uuid("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export const mcpTools = pgTable("mcp_tools", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  inputSchema: jsonb("input_schema").$type<Record<string, unknown>>().notNull().default({}),
  outputSchema: jsonb("output_schema").$type<Record<string, unknown> | null>(),
  requiredPermissions: jsonb("required_permissions").$type<string[]>().notNull().default([]),
  riskLevel: varchar("risk_level", { length: 32 }).notNull().default("low"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export const mcpToolPermissions = pgTable("mcp_tool_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  toolId: uuid("tool_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  permissionCode: varchar("permission_code", { length: 128 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const mcpProfileBindings = pgTable("mcp_profile_bindings", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull(),
  toolId: uuid("tool_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const mcpServerHealthEvents = pgTable("mcp_server_health_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export type McpServer = typeof mcpServers.$inferSelect;
