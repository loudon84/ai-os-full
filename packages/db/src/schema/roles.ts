import { boolean, pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

import { workspaces } from "./workspaces.js";

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id),
    name: varchar("name", { length: 128 }).notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    isSystem: boolean("is_system").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_roles_workspace_code").on(table.workspaceId, table.code),
  ],
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
