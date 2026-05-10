"use client";

import { useAuthStore } from "@/modules/auth/stores/auth-store";

/**
 * RBAC 权限校验。若后端尚未下发 permissions 数组（空），则视为已登录即可用，由后端强校验。
 */
export function useEmailPermission(permissionCode: string): boolean {
  const checkPermission = useAuthStore((s) => s.checkPermission);
  const permissions = useAuthStore((s) => s.permissions);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return false;
  if (permissions.length === 0) return true;
  return checkPermission(permissionCode);
}
