import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const promptTemplates = pgTable("prompt_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  scene: varchar("scene", { length: 128 }).notNull(),
  description: text("description"),
  latestVersionId: uuid("latest_version_id"),
  enabled: boolean("enabled").notNull().default(true),
  createdByUserId: uuid("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export const promptTemplateVersions = pgTable("prompt_template_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").notNull(),
  version: integer("version").notNull(),
  body: text("body").notNull(),
  variables: jsonb("variables").$type<string[]>().notNull().default([]),
  createdByUserId: uuid("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type PromptTemplateVersion = typeof promptTemplateVersions.$inferSelect;
