import { useAuthStore } from "../stores/auth-store";

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, register, logout } =
    useAuthStore();
  return { user, isAuthenticated, isLoading, login, register, logout };
}

export function usePermission(permissionCode: string): boolean {
  const checkPermission = useAuthStore((s) => s.checkPermission);
  return checkPermission(permissionCode);
}
