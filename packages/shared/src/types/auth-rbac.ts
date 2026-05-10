import type {
  UserStatus,
  WorkspaceStatus,
  MembershipRole,
  AuditResult,
} from "../constants";

export interface AuthRegisterRequest {
  email: string;
  password: string;
  display_name?: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthRefreshRequest {
  refresh_token: string;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  display_name: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceCreateRequest {
  name: string;
}

export interface WorkspaceUpdateRequest {
  name?: string;
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  owner_user_id: string;
  status: WorkspaceStatus;
  member_limit: number;
  created_at: string;
  updated_at: string;
}

export interface MembershipCreateRequest {
  user_id: string;
  role?: MembershipRole;
}

export interface MembershipUpdateRequest {
  role: MembershipRole;
}

export interface MembershipResponse {
  id: string;
  workspace_id: string;
  user_id: string;
  role: MembershipRole;
  created_at: string;
  updated_at: string;
}

export interface RoleCreateRequest {
  name: string;
  code: string;
}

export interface RoleUpdateRequest {
  name?: string;
}

export interface RoleResponse {
  id: string;
  workspace_id: string | null;
  name: string;
  code: string;
  is_system: boolean;
  created_at: string;
}

export interface PermissionResponse {
  id: string;
  code: string;
  description: string | null;
  created_at: string;
}

export interface PermissionAssignRequest {
  permission_ids: string[];
}

export interface AuditEventResponse {
  id: string;
  workspace_id: string | null;
  actor_user_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  result: AuditResult;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditListQuery {
  action?: string;
  target_type?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
}

export interface UserUpdateRequest {
  display_name?: string;
  status?: UserStatus;
}

export interface UserResponse {
  id: string;
  email: string;
  display_name: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export { type PaginatedSnakeResponse } from "./document";
