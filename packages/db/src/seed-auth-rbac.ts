import { eq } from "drizzle-orm";
import { PERMISSION_CODES } from "@portal/shared";

import { createDb } from "./client.js";
import { permissions, roles, rolePermissions } from "./schema/index.js";

const connectionString = process.env.DATABASE_URL!;
const db = createDb(connectionString);

async function seed() {
  console.log("Seeding auth/rbac data...");

  for (const code of PERMISSION_CODES) {
    const existing = await db
      .select()
      .from(permissions)
      .where(eq(permissions.code, code))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(permissions).values({ code, description: code });
      console.log(`  Inserted permission: ${code}`);
    }
  }

  const existingSuperAdmin = await db
    .select()
    .from(roles)
    .where(eq(roles.code, "super_admin"))
    .limit(1);

  if (existingSuperAdmin.length === 0) {
    const [superAdminRole] = await db
      .insert(roles)
      .values({
        name: "Super Admin",
        code: "super_admin",
        workspaceId: null,
        isSystem: true,
      })
      .returning();
    console.log("  Inserted system role: super_admin");

    const allPermissions = await db.select().from(permissions);
    for (const perm of allPermissions) {
      await db.insert(rolePermissions).values({
        roleId: superAdminRole.id,
        permissionId: perm.id,
      });
    }
    console.log(
      `  Assigned ${allPermissions.length} permissions to super_admin`,
    );
  }

  const existingAdmin = await db
    .select()
    .from(roles)
    .where(eq(roles.code, "admin"))
    .limit(1);

  if (existingAdmin.length === 0) {
    await db.insert(roles).values({
      name: "Admin",
      code: "admin",
      workspaceId: null,
      isSystem: true,
    });
    console.log("  Inserted system role: admin");
  }

  const existingOwnerRole = await db
    .select()
    .from(roles)
    .where(eq(roles.code, "owner"))
    .limit(1);

  if (existingOwnerRole.length === 0) {
    await db.insert(roles).values({
      name: "Owner",
      code: "owner",
      workspaceId: null,
      isSystem: true,
    });
    console.log("  Inserted system role: owner");
  }

  const existingUserRole = await db
    .select()
    .from(roles)
    .where(eq(roles.code, "user"))
    .limit(1);

  if (existingUserRole.length === 0) {
    await db.insert(roles).values({
      name: "User",
      code: "user",
      workspaceId: null,
      isSystem: true,
    });
    console.log("  Inserted system role: user");
  }

  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
