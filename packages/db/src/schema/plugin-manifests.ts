import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const pluginManifests = pgTable("plugin_manifests", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  pluginType: varchar("plugin_type", { length: 64 }).notNull(),
  runtime: varchar("runtime", { length: 32 }).notNull(),
  entrypoint: varchar("entrypoint", { length: 512 }).notNull(),
  requiredPermissions: jsonb("required_permissions").$type<string[]>().notNull().default([]),
  configSchema: jsonb("config_schema").$type<Record<string, unknown>>().notNull().default({}),
  compatibleProfiles: jsonb("compatible_profiles").$type<string[]>().notNull().default([]),
  enabled: boolean("enabled").notNull().default(true),
  createdByUserId: uuid("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export const pluginVersions = pgTable("plugin_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  pluginId: uuid("plugin_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  version: varchar("version", { length: 64 }).notNull(),
  checksum: varchar("checksum", { length: 128 }).notNull(),
  manifest: jsonb("manifest").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const pluginInstallRecords = pgTable("plugin_install_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  pluginId: uuid("plugin_id").notNull(),
  versionId: uuid("version_id"),
  profileId: uuid("profile_id"),
  workspaceId: uuid("workspace_id").notNull(),
  installedByUserId: uuid("installed_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const pluginPermissionDeclarations = pgTable("plugin_permission_declarations", {
  id: uuid("id").primaryKey().defaultRandom(),
  pluginId: uuid("plugin_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  permissionCode: varchar("permission_code", { length: 128 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export type PluginManifest = typeof pluginManifests.$inferSelect;
