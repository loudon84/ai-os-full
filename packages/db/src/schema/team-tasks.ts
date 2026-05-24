import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const teamTasks = pgTable(
  "team_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull(),
    projectId: uuid("project_id"),
    title: varchar("title", { length: 512 }).notNull(),
    description: text("description"),
    taskType: varchar("task_type", { length: 64 }).notNull(),
    riskLevel: varchar("risk_level", { length: 32 }).notNull().default("low"),
    status: varchar("status", { length: 32 }).notNull().default("created"),
    assigneeUserId: uuid("assignee_user_id"),
    targetProfileId: varchar("target_profile_id", { length: 128 }),
    targetAgentId: varchar("target_agent_id", { length: 128 }),
    sourceAgentId: varchar("source_agent_id", { length: 128 }),
    createdByUserId: uuid("created_by_user_id").notNull(),
    workspacePath: varchar("workspace_path", { length: 1024 }),
    requiresApproval: boolean("requires_approval").notNull().default(false),
    input: jsonb("input").$type<Record<string, unknown>>().notNull().default({}),
    acceptanceCriteria: jsonb("acceptance_criteria")
      .$type<string[]>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "chk_team_tasks_status",
      sql`${table.status} IN ('draft','created','assigned','acknowledged','pending_approval','approved','running','succeeded','failed','cancelled','rejected','expired','retrying')`,
    ),
  ],
);

export const teamTaskEvents = pgTable("team_task_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }),
  message: text("message"),
  actorUserId: uuid("actor_user_id"),
  actorAgentId: varchar("actor_agent_id", { length: 128 }),
  metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const teamTaskAssignments = pgTable("team_task_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  assigneeUserId: uuid("assignee_user_id").notNull(),
  targetProfileId: varchar("target_profile_id", { length: 128 }),
  targetAgentId: varchar("target_agent_id", { length: 128 }),
  desktopClientId: uuid("desktop_client_id"),
  assignedByUserId: uuid("assigned_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const teamTaskResults = pgTable("team_task_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  summary: text("summary"),
  outputText: text("output_text"),
  gitCommit: varchar("git_commit", { length: 128 }),
  prUrl: text("pr_url"),
  logsSummary: text("logs_summary"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const teamTaskArtifacts = pgTable("team_task_artifacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  artifactType: varchar("artifact_type", { length: 32 }).notNull(),
  name: varchar("name", { length: 512 }).notNull(),
  storageKey: varchar("storage_key", { length: 1024 }),
  url: text("url"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const teamTaskApprovals = pgTable("team_task_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  approverUserId: uuid("approver_user_id"),
  status: varchar("status", { length: 32 }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: false }),
});

export const teamTaskContextRefs = pgTable("team_task_context_refs", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  refType: varchar("ref_type", { length: 64 }).notNull(),
  refId: varchar("ref_id", { length: 256 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export type TeamTask = typeof teamTasks.$inferSelect;
export type NewTeamTask = typeof teamTasks.$inferInsert;
