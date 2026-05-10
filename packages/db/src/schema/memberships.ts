import { sql } from "drizzle-orm";
import {
  check,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";
import { workspaces } from "./workspaces.js";

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: varchar("role", { length: 32 }).notNull().default("user"),

    createdAt: timestamp("created_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_memberships_workspace_user").on(
      table.workspaceId,
      table.userId,
    ),
    check(
      "chk_memberships_role",
      sql`${table.role} IN ('super_admin', 'admin', 'owner', 'user')`,
    ),
  ],
);

export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
