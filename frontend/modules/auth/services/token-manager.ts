const ACCESS_TOKEN_KEY = "portal_access_token";
const REFRESH_TOKEN_KEY = "portal_refresh_token";

class TokenManager {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  async refreshIfNeeded(
    refreshFn: (refreshToken: string) => Promise<{ access_token: string; refresh_token: string }>,
  ): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token");

    const result = await refreshFn(refreshToken);
    this.setTokens(result.access_token, result.refresh_token);
  }

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export const tokenManager = new TokenManager();
