import { tokenManager } from "./token-manager";

const API_BASE = "/api/v1";

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = tokenManager.getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && token) {
    try {
      await tokenManager.refreshIfNeeded(async (refreshToken) => {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) throw new Error("Refresh failed");
        return res.json();
      });

      const newToken = tokenManager.getAccessToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        const retryResponse = await fetch(`${API_BASE}${path}`, {
          ...options,
          headers,
        });
        if (!retryResponse.ok) {
          throw new Error(`Request failed: ${retryResponse.status}`);
        }
        return retryResponse.json();
      }
    } catch {
      tokenManager.clear();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Authentication required");
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Request failed: ${response.status}`,
    );
  }

  return response.json();
}

export const authApi = {
  register: (data: { email: string; password: string; display_name?: string }) =>
    request<{
      user: { id: string; email: string; display_name: string | null };
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{
      user: { id: string; email: string; display_name: string | null; status: string };
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  refresh: (refreshToken: string) =>
    request<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  logout: (refreshToken: string) =>
    request<void>("/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  getMe: () =>
    request<{ id: string; email: string; display_name: string | null; status: string }>("/users/me"),

  getWorkspaces: () =>
    request<{ items: Array<{ id: string; name: string; status: string }> }>("/workspaces"),
};
