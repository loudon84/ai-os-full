import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 128 }).notNull().unique(),
    description: varchar("description", { length: 512 }),

    createdAt: timestamp("created_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
);

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
