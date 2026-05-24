import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const skillTemplates = pgTable("skill_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }),
  skillType: varchar("skill_type", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  createdByUserId: uuid("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export const skillTemplateVersions = pgTable("skill_template_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  versionNo: varchar("version_no", { length: 32 }).notNull(),
  entryFile: varchar("entry_file", { length: 512 }).notNull(),
  variablesSchema: jsonb("variables_schema").$type<Record<string, unknown>>().notNull().default({}),
  requiredPermissions: jsonb("required_permissions").$type<string[]>().notNull().default([]),
  compatibleProfiles: jsonb("compatible_profiles").$type<string[]>().notNull().default([]),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: false }),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const skillTemplateFiles = pgTable("skill_template_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  versionId: uuid("version_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  path: varchar("path", { length: 512 }).notNull(),
  checksum: varchar("checksum", { length: 128 }).notNull(),
  contentType: varchar("content_type", { length: 128 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const skillInstallRecords = pgTable("skill_install_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull(),
  versionId: uuid("version_id").notNull(),
  profileId: uuid("profile_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  installedByUserId: uuid("installed_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const skillPublishRecords = pgTable("skill_publish_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull(),
  versionId: uuid("version_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  publishedByUserId: uuid("published_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const skillProfileBindings = pgTable("skill_profile_bindings", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull(),
  profileId: uuid("profile_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export type SkillTemplate = typeof skillTemplates.$inferSelect;
