import type { Db, DocumentPermission } from "@portal/db";
import type { DocumentPermissionRole } from "@portal/shared";

import type { DocumentRepository } from "./repository.js";

const ROLE_ORDER: Record<DocumentPermissionRole, number> = {
  view: 1,
  edit: 2,
  owner: 3,
};

type Tx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

export class PermissionService {
  constructor(private readonly repo: DocumentRepository) {}

  async getUserRole(
    db: Tx,
    params: {
      documentId: string;
      userId: string;
      roles: string[];
      departments: string[];
    },
  ): Promise<DocumentPermissionRole | null> {
    const perms = await this.repo.listPermissions(db, params.documentId);
    return resolveBestRole({
      perms,
      userId: params.userId,
      roles: params.roles,
      departments: params.departments,
    });
  }

  static canView(role: DocumentPermissionRole | null): boolean {
    return role === "view" || role === "edit" || role === "owner";
  }

  static canEdit(role: DocumentPermissionRole | null): boolean {
    return role === "edit" || role === "owner";
  }

  static canOwner(role: DocumentPermissionRole | null): boolean {
    return role === "owner";
  }
}

export function resolveBestRole(params: {
  perms: DocumentPermission[];
  userId: string;
  roles: string[];
  departments: string[];
}): DocumentPermissionRole | null {
  const { perms, userId, roles, departments } = params;
  let best: DocumentPermissionRole | null = null;

  const consider = (role: string) => {
    if (!isPermissionRole(role)) return;
    if (best === null || ROLE_ORDER[role] > ROLE_ORDER[best]) {
      best = role;
    }
  };

  for (const p of perms) {
    if (
      p.role === "owner" &&
      p.subjectType === "user" &&
      p.subjectId === userId
    ) {
      consider("owner");
    }
  }

  for (const p of perms) {
    if (p.subjectType === "user" && p.subjectId === userId) {
      consider(p.role);
    }
  }

  const roleSet = new Set(roles);
  const deptSet = new Set(departments);
  for (const p of perms) {
    if (p.subjectType === "role" && roleSet.has(p.subjectId)) {
      consider(p.role);
    }
    if (p.subjectType === "department" && deptSet.has(p.subjectId)) {
      consider(p.role);
    }
  }

  return best;
}

function isPermissionRole(role: string): role is DocumentPermissionRole {
  return role === "view" || role === "edit" || role === "owner";
}
