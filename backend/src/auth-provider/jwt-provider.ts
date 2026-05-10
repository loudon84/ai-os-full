import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { eq } from "drizzle-orm";

import type { Db } from "@portal/db";
import { users, refreshTokens } from "@portal/db";

import type {
  AuthPrincipal,
  AuthProvider,
  AuthUser,
  TokenPair,
} from "./auth-provider.js";
import { AuthProviderError } from "./auth-provider.js";

interface JwtProviderConfig {
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpSec: number;
  jwtRefreshExpSec: number;
  refreshTokenMax: number;
}

export class JwtProvider implements AuthProvider {
  constructor(
    private readonly db: Db,
    private readonly config: JwtProviderConfig,
  ) {}

  async verifyAccessToken(token: string): Promise<AuthPrincipal> {
    try {
      const payload = jwt.verify(token, this.config.jwtSecret) as jwt.JwtPayload;
      const user = await this.db
        .select()
        .from(users)
        .where(eq(users.id, payload.sub!))
        .limit(1);

      if (user.length === 0) {
        throw new AuthProviderError("user_not_found", "User not found");
      }
      if (user[0].status !== "active") {
        throw new AuthProviderError("user_disabled", "User account is disabled");
      }

      return {
        userId: user[0].id,
        email: user[0].email,
        status: user[0].status,
        workspaceId: (payload.workspaceId as string) ?? null,
        roles: (payload.roles as string[]) ?? [],
      };
    } catch (err) {
      if (err instanceof AuthProviderError) throw err;
      throw new AuthProviderError("invalid_token", "Invalid or expired access token");
    }
  }

  async getUser(userId: string): Promise<AuthUser> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (result.length === 0) {
      throw new AuthProviderError("user_not_found", "User not found");
    }

    return {
      id: result[0].id,
      email: result[0].email,
      displayName: result[0].displayName,
      status: result[0].status,
    };
  }

  async createUser(input: {
    email: string;
    password: string;
    displayName?: string;
  }): Promise<AuthUser> {
    const passwordHash = await argon2.hash(input.password);

    const result = await this.db
      .insert(users)
      .values({
        email: input.email,
        passwordHash,
        displayName: input.displayName ?? null,
      })
      .returning();

    return {
      id: result[0].id,
      email: result[0].email,
      displayName: result[0].displayName,
      status: result[0].status,
    };
  }

  async disableUser(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({ status: "disabled" })
      .where(eq(users.id, userId));
  }

  async enableUser(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({ status: "active" })
      .where(eq(users.id, userId));
  }

  async verifyPassword(email: string, password: string): Promise<AuthUser> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (result.length === 0) {
      throw new AuthProviderError("invalid_credentials", "Invalid email or password");
    }

    const valid = await argon2.verify(result[0].passwordHash, password);
    if (!valid) {
      throw new AuthProviderError("invalid_credentials", "Invalid email or password");
    }

    if (result[0].status !== "active") {
      throw new AuthProviderError("user_disabled", "User account is disabled");
    }

    return {
      id: result[0].id,
      email: result[0].email,
      displayName: result[0].displayName,
      status: result[0].status,
    };
  }

  async signTokens(
    userId: string,
    workspaceId: string | null,
    roles: string[],
  ): Promise<TokenPair> {
    const accessToken = jwt.sign(
      { sub: userId, workspaceId, roles },
      this.config.jwtSecret,
      { expiresIn: this.config.jwtAccessExpSec },
    );

    const refreshToken = jwt.sign(
      { sub: userId, type: "refresh" },
      this.config.jwtRefreshSecret,
      { expiresIn: this.config.jwtRefreshExpSec },
    );

    const tokenHash = await argon2.hash(refreshToken);
    const expiresAt = new Date(
      Date.now() + this.config.jwtRefreshExpSec * 1000,
    );

    await this.enforceRefreshTokenLimit(userId);

    await this.db.insert(refreshTokens).values({
      userId,
      tokenHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.jwtAccessExpSec,
    };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const allTokens = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.revokedAt, null!));

    for (const rt of allTokens) {
      const matches = await argon2.verify(rt.tokenHash, token);
      if (matches) {
        await this.db
          .update(refreshTokens)
          .set({ revokedAt: new Date() })
          .where(eq(refreshTokens.id, rt.id));
        return;
      }
    }
  }

  async verifyRefreshToken(token: string): Promise<string> {
    try {
      const payload = jwt.verify(token, this.config.jwtRefreshSecret) as jwt.JwtPayload;
      if (payload.type !== "refresh") {
        throw new AuthProviderError("invalid_token", "Not a refresh token");
      }

      const allTokens = await this.db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.userId, payload.sub!));

      let found = false;
      for (const rt of allTokens) {
        if (rt.revokedAt) continue;
        if (rt.expiresAt < new Date()) continue;
        const matches = await argon2.verify(rt.tokenHash, token);
        if (matches) {
          found = true;
          break;
        }
      }

      if (!found) {
        throw new AuthProviderError("invalid_token", "Refresh token not found or revoked");
      }

      return payload.sub!;
    } catch (err) {
      if (err instanceof AuthProviderError) throw err;
      throw new AuthProviderError("invalid_token", "Invalid or expired refresh token");
    }
  }

  private async enforceRefreshTokenLimit(userId: string): Promise<void> {
    const existing = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, userId));

    const active = existing
      .filter((t) => !t.revokedAt && t.expiresAt > new Date())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    while (active.length >= this.config.refreshTokenMax) {
      const oldest = active.shift()!;
      await this.db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.id, oldest.id));
    }
  }
}
