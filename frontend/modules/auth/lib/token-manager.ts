class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<void> | null = null;

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  clear(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  async refreshIfNeeded(
    refreshFn: (refreshToken: string) => Promise<{
      access_token: string;
      refresh_token: string;
    }>,
  ): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      this.clear();
      throw new Error("No refresh token available");
    }

    this.refreshPromise = (async () => {
      try {
        const result = await refreshFn(this.refreshToken);
        this.setTokens(result.access_token, result.refresh_token);
      } catch {
        this.clear();
        throw new Error("Token refresh failed");
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }
}

export const tokenManager = new TokenManager();
