import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const connectorConfigs = pgTable(
  "connector_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull(),
    connectorKey: varchar("connector_key", { length: 64 }).notNull(),
    connectorType: varchar("connector_type", { length: 32 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    webhookSecretRef: varchar("webhook_secret_ref", { length: 256 }),
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    enabled: boolean("enabled").notNull().default(true),
    createdByUserId: uuid("created_by_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_connector_configs_workspace_key").on(
      table.workspaceId,
      table.connectorKey,
    ),
  ],
);

export const connectorWebhookEvents = pgTable("connector_webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  connectorId: uuid("connector_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const connectorTaskMappings = pgTable("connector_task_mappings", {
  id: uuid("id").primaryKey().defaultRandom(),
  connectorId: uuid("connector_id").notNull(),
  webhookEventId: uuid("webhook_event_id").notNull(),
  taskId: uuid("task_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export type ConnectorConfig = typeof connectorConfigs.$inferSelect;
