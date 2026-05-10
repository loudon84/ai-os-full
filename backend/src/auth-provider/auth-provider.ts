export interface AuthPrincipal {
  userId: string;
  email: string;
  status: string;
  workspaceId: string | null;
  roles: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  status: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthProviderError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AuthProviderError";
  }
}

export interface AuthProvider {
  verifyAccessToken(token: string): Promise<AuthPrincipal>;
  getUser(userId: string): Promise<AuthUser>;
  createUser(input: {
    email: string;
    password: string;
    displayName?: string;
  }): Promise<AuthUser>;
  disableUser(userId: string): Promise<void>;
  enableUser(userId: string): Promise<void>;
  verifyPassword(email: string, password: string): Promise<AuthUser>;
  signTokens(userId: string, workspaceId: string | null, roles: string[]): Promise<TokenPair>;
  revokeRefreshToken(token: string): Promise<void>;
}
