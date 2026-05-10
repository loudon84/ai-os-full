import { create } from "zustand";
import { tokenManager } from "../lib/token-manager";
import { authApi } from "../services/auth.api";

interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  status: string;
}

interface AuthState {
  user: AuthUser | null;
  workspaceId: string | null;
  workspaces: Array<{ id: string; name: string; status: string }>;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  selectWorkspace: (workspaceId: string) => void;
  checkPermission: (code: string) => boolean;
  loadWorkspaces: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  workspaceId: null,
  workspaces: [],
  roles: [],
  permissions: [],
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const result = await authApi.login({ email, password });
      tokenManager.setTokens(result.access_token, result.refresh_token);
      set({
        user: {
          id: result.user.id,
          email: result.user.email,
          displayName: result.user.display_name,
          status: result.user.status,
        },
        isAuthenticated: true,
        isLoading: false,
      });
      await get().loadWorkspaces();
    } catch {
      set({ isLoading: false });
      throw new Error("Login failed");
    }
  },

  register: async (email, password, displayName) => {
    set({ isLoading: true });
    try {
      const result = await authApi.register({
        email,
        password,
        display_name: displayName,
      });
      tokenManager.setTokens(result.access_token, result.refresh_token);
      set({
        user: {
          id: result.user.id,
          email: result.user.email,
          displayName: result.user.display_name,
          status: "active",
        },
        isAuthenticated: true,
        isLoading: false,
      });
      await get().loadWorkspaces();
    } catch {
      set({ isLoading: false });
      throw new Error("Registration failed");
    }
  },

  logout: async () => {
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {}
    }
    tokenManager.clear();
    set({
      user: null,
      workspaceId: null,
      workspaces: [],
      roles: [],
      permissions: [],
      isAuthenticated: false,
    });
  },

  selectWorkspace: (workspaceId) => {
    set({ workspaceId });
  },

  checkPermission: (code) => {
    const { permissions } = get();
    return permissions.includes("*") || permissions.includes(code);
  },

  loadWorkspaces: async () => {
    try {
      const result = await authApi.getWorkspaces();
      set({
        workspaces: result.items,
        workspaceId: result.items[0]?.id ?? null,
      });
    } catch {}
  },

  refreshAuth: async () => {
    if (!tokenManager.isAuthenticated()) return;
    try {
      const user = await authApi.getMe();
      set({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          status: user.status,
        },
        isAuthenticated: true,
      });
    } catch {
      tokenManager.clear();
      set({ isAuthenticated: false, user: null });
    }
  },
}));
