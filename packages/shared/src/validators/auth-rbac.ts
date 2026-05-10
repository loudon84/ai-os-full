import { z } from "zod";

import {
  AUDIT_RESULTS,
  MEMBERSHIP_ROLES,
  USER_STATUSES,
  WORKSPACE_STATUSES,
} from "../constants";

const uuidSchema = z.string().uuid();
const emailSchema = z.string().email().max(255);

const passwordSchema = z
  .string()
  .min(8)
  .regex(/[a-zA-Z]/, "Must contain at least one letter")
  .regex(/[0-9]/, "Must contain at least one number");

export const authRegisterSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    display_name: z.string().min(1).max(128).optional(),
  })
  .strict();
export type AuthRegisterInput = z.infer<typeof authRegisterSchema>;

export const authLoginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1),
  })
  .strict();
export type AuthLoginInput = z.infer<typeof authLoginSchema>;

export const authRefreshSchema = z
  .object({
    refresh_token: z.string().min(1),
  })
  .strict();
export type AuthRefreshInput = z.infer<typeof authRefreshSchema>;

export const authLogoutSchema = z
  .object({
    refresh_token: z.string().min(1),
  })
  .strict();
export type AuthLogoutInput = z.infer<typeof authLogoutSchema>;

export const workspaceCreateSchema = z
  .object({
    name: z.string().min(1).max(255),
  })
  .strict();
export type WorkspaceCreateInput = z.infer<typeof workspaceCreateSchema>;

export const workspaceUpdateSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
  })
  .strict();
export type WorkspaceUpdateInput = z.infer<typeof workspaceUpdateSchema>;

export const membershipCreateSchema = z
  .object({
    user_id: uuidSchema,
    role: z.enum(MEMBERSHIP_ROLES).optional().default("user"),
  })
  .strict();
export type MembershipCreateInput = z.infer<typeof membershipCreateSchema>;

export const membershipUpdateSchema = z
  .object({
    role: z.enum(MEMBERSHIP_ROLES),
  })
  .strict();
export type MembershipUpdateInput = z.infer<typeof membershipUpdateSchema>;

export const roleCreateSchema = z
  .object({
    name: z.string().min(1).max(128),
    code: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/),
  })
  .strict();
export type RoleCreateInput = z.infer<typeof roleCreateSchema>;

export const roleUpdateSchema = z
  .object({
    name: z.string().min(1).max(128).optional(),
  })
  .strict();
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;

export const permissionAssignSchema = z
  .object({
    permission_ids: z.array(uuidSchema).min(1),
  })
  .strict();
export type PermissionAssignInput = z.infer<typeof permissionAssignSchema>;

export const userUpdateSchema = z
  .object({
    display_name: z.string().min(1).max(128).optional(),
    status: z.enum(USER_STATUSES).optional(),
  })
  .strict();
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export const auditListQuerySchema = z.object({
  action: z.string().min(1).optional(),
  target_type: z.string().min(1).optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(200).default(20),
});
export type AuditListQueryInput = z.infer<typeof auditListQuerySchema>;

export const workspaceIdParamSchema = z.object({
  workspaceId: uuidSchema,
});

export const membershipIdParamSchema = z.object({
  workspaceId: uuidSchema,
  membershipId: uuidSchema,
});

export const roleIdParamSchema = z.object({
  workspaceId: uuidSchema,
  roleId: uuidSchema,
});

export const userIdParamSchema = z.object({
  userId: uuidSchema,
});
