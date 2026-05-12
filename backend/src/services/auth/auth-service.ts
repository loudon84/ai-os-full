import { eq } from "drizzle-orm";

import type { Db } from "@portal/db";
import { users, workspaces, memberships } from "@portal/db";

import type { AuthProvider, TokenPair } from "../../auth-provider/auth-provider.js";
import type { AppConfig } from "../../config.js";
import { conflict, unauthorized, forbidden } from "../../errors.js";
import { LoginLockoutService } from "./login-lockout-service.js";

export class AuthService {
  private lockout: LoginLockoutService;

  constructor(
    private readonly db: Db,
    private readonly authProvider: AuthProvider,
    private readonly config: AppConfig,
  ) {
    this.lockout = new LoginLockoutService(
      config.loginMaxAttempts,
      config.loginLockDurationSec,
    );
  }

  async register(input: {
    email: string;
    password: string;
    displayName?: string;
  }): Promise<{ user: { id: string; email: string; displayName: string | null }; tokens: TokenPair }> {
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existing.length > 0) {
      throw conflict("Email already registered", "email_exists");
    }

    const authUser = await this.authProvider.createUser(input);

    const [workspace] = await this.db
      .insert(workspaces)
      .values({
        name: `${input.displayName ?? input.email}'s Workspace`,
        ownerUserId: authUser.id,
        memberLimit: this.config.workspaceMemberLimit,
      })
      .returning();

    await this.db.insert(memberships).values({
      workspaceId: workspace.id,
      userId: authUser.id,
      role: "owner",
    });

    const tokens = await this.authProvider.signTokens(
      authUser.id,
      workspace.id,
      ["owner"],
    );

    return {
      user: { id: authUser.id, email: authUser.email, displayName: authUser.displayName },
      tokens,
    };
  }

  async login(input: {
    email: string;
    password: string;
  }): Promise<{ user: { id: string; email: string; displayName: string | null; status: string }; tokens: TokenPair; workspaceId: string | null }> {
    const lockCheck = this.lockout.check(input.email);
    if (!lockCheck.allowed) {
      throw forbidden("Account temporarily locked due to too many failed attempts");
    }

    try {
      const authUser = await this.authProvider.verifyPassword(
        input.email,
        input.password,
      );

      this.lockout.reset(input.email);

      const userMemberships = await this.db
        .select()
        .from(memberships)
        .where(eq(memberships.userId, authUser.id));

      const primaryMembership = userMemberships[0];
      const workspaceId = primaryMembership?.workspaceId ?? null;
      const roles = userMemberships.map((m) => m.role);

      const tokens = await this.authProvider.signTokens(
        authUser.id,
        workspaceId,
        roles,
      );

      return {
        user: { id: authUser.id, email: authUser.email, displayName: authUser.displayName, status: authUser.status },
        tokens,
        workspaceId,
      };
    } catch (err) {
      if (err instanceof Error && err.message.includes("credentials")) {
        this.lockout.recordFailure(input.email);
        throw unauthorized("Invalid email or password");
      }
      throw err;
    }
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const jwtProvider = this.authProvider as unknown as { verifyRefreshToken: (token: string) => Promise<string> };
    const userId = await jwtProvider.verifyRefreshToken(refreshToken);

    const userMemberships = await this.db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, userId));

    const primaryMembership = userMemberships[0];
    const workspaceId = primaryMembership?.workspaceId ?? null;
    const roles = userMemberships.map((m) => m.role);

    await this.authProvider.revokeRefreshToken(refreshToken);

    const tokens = await this.authProvider.signTokens(userId, workspaceId, roles);
    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.authProvider.revokeRefreshToken(refreshToken);
  }
}
