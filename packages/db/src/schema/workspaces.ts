import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    memberLimit: integer("member_limit").notNull().default(100),

    createdAt: timestamp("created_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: false }),
  },
  (table) => [
    check(
      "chk_workspaces_status",
      sql`${table.status} IN ('active', 'deleted')`,
    ),
  ],
);

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
