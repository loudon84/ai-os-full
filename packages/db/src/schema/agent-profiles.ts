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

export const agentProfiles = pgTable("agent_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  roleKey: varchar("role_key", { length: 64 }).notNull(),
  roleName: varchar("role_name", { length: 128 }).notNull(),
  displayName: varchar("display_name", { length: 128 }).notNull(),
  description: text("description"),
  templateId: uuid("template_id"),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  createdByUserId: uuid("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export const agentProfileTemplates = pgTable("agent_profile_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  defaultModelConfig: jsonb("default_model_config")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  defaultTools: jsonb("default_tools").$type<unknown[]>().notNull().default([]),
  defaultPolicy: jsonb("default_policy").$type<Record<string, unknown>>().notNull().default({}),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: false }),
  createdByUserId: uuid("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export const agentProfileConfigs = pgTable("agent_profile_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  configKey: varchar("config_key", { length: 128 }).notNull(),
  configValue: jsonb("config_value").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export const agentProfileManifests = pgTable("agent_profile_manifests", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  manifest: jsonb("manifest").$type<Record<string, unknown>>().notNull().default({}),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export const agentProfileSkills = pgTable("agent_profile_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  skillId: uuid("skill_id").notNull(),
  versionId: uuid("version_id"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const agentProfileMcpServers = pgTable("agent_profile_mcp_servers", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  serverId: uuid("server_id").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const agentProfilePolicyRules = pgTable("agent_profile_policy_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  ruleKey: varchar("rule_key", { length: 128 }).notNull(),
  ruleValue: jsonb("rule_value").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export type AgentProfile = typeof agentProfiles.$inferSelect;
