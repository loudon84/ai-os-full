import { pgTable, unique, uuid } from "drizzle-orm/pg-core";

import { roles } from "./roles.js";
import { permissions } from "./permissions.js";

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id),
  },
  (table) => [
    unique("uq_role_permissions_role_permission").on(
      table.roleId,
      table.permissionId,
    ),
  ],
);

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
