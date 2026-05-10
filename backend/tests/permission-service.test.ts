import type { DocumentPermission } from "@portal/db";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { resolveBestRole } from "../src/services/documents/permission.js";

function makePerm(params: {
  documentId: string;
  subjectType: "user" | "role" | "department";
  subjectId: string;
  role: "view" | "edit" | "owner";
}): DocumentPermission {
  return {
    id: randomUUID(),
    documentId: params.documentId,
    subjectType: params.subjectType,
    subjectId: params.subjectId,
    role: params.role,
    createdBy: randomUUID(),
    createdAt: new Date(),
  };
}

describe("permission resolution", () => {
  it("owner via user beats role/department edit", () => {
    const documentId = randomUUID();
    const userId = randomUUID();
    const roleId = randomUUID();
    const deptId = randomUUID();

    const perms = [
      makePerm({
        documentId,
        subjectType: "role",
        subjectId: roleId,
        role: "edit",
      }),
      makePerm({
        documentId,
        subjectType: "department",
        subjectId: deptId,
        role: "edit",
      }),
      makePerm({
        documentId,
        subjectType: "user",
        subjectId: userId,
        role: "owner",
      }),
    ];

    const role = resolveBestRole({
      perms,
      userId,
      roles: [roleId],
      departments: [deptId],
    });
    expect(role).toBe("owner");
  });

  it("union of role/department/user picks max role", () => {
    const documentId = randomUUID();
    const userId = randomUUID();
    const roleId = randomUUID();
    const deptId = randomUUID();

    const perms = [
      makePerm({
        documentId,
        subjectType: "role",
        subjectId: roleId,
        role: "owner",
      }),
      makePerm({
        documentId,
        subjectType: "department",
        subjectId: deptId,
        role: "owner",
      }),
      makePerm({
        documentId,
        subjectType: "user",
        subjectId: userId,
        role: "edit",
      }),
    ];

    const role = resolveBestRole({
      perms,
      userId,
      roles: [roleId],
      departments: [deptId],
    });
    expect(role).toBe("owner");
  });

  it("returns null when no entry matches the user", () => {
    const documentId = randomUUID();
    const userId = randomUUID();
    const otherUser = randomUUID();

    const perms = [
      makePerm({
        documentId,
        subjectType: "user",
        subjectId: otherUser,
        role: "view",
      }),
    ];

    const role = resolveBestRole({
      perms,
      userId,
      roles: [],
      departments: [],
    });
    expect(role).toBeNull();
  });
});
