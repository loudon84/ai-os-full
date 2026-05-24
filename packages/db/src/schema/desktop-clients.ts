import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const desktopClients = pgTable("desktop_clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  userId: uuid("user_id").notNull(),
  clientName: varchar("client_name", { length: 128 }),
  desktopVersion: varchar("desktop_version", { length: 64 }),
  copilotServeVersion: varchar("copilot_serve_version", { length: 64 }),
  platform: varchar("platform", { length: 32 }),
  arch: varchar("arch", { length: 32 }),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: false }),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export const desktopClientHeartbeats = pgTable("desktop_client_heartbeats", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  statusSummary: jsonb("status_summary").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const desktopSyncCursors = pgTable("desktop_sync_cursors", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  cursor: varchar("cursor", { length: 256 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export const desktopBootstrapEvents = pgTable("desktop_bootstrap_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  userId: uuid("user_id").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const desktopClientRevocations = pgTable("desktop_client_revocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  revokedByUserId: uuid("revoked_by_user_id").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export type DesktopClient = typeof desktopClients.$inferSelect;
