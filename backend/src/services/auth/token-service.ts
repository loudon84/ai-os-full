import argon2 from "argon2";
import { eq, and, lt } from "drizzle-orm";

import type { Db } from "@portal/db";
import { refreshTokens } from "@portal/db";

export class TokenService {
  constructor(
    private readonly db: Db,
    private readonly refreshTokenMax: number = 5,
  ) {}

  async storeRefreshToken(
    userId: string,
    rawToken: string,
    expiresAt: Date,
  ): Promise<void> {
    const tokenHash = await argon2.hash(rawToken);

    await this.enforceLimit(userId);

    await this.db.insert(refreshTokens).values({
      userId,
      tokenHash,
      expiresAt,
    });
  }

  async findValidRefreshToken(
    userId: string,
    rawToken: string,
  ): Promise<boolean> {
    const allTokens = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, userId));

    for (const rt of allTokens) {
      if (rt.revokedAt) continue;
      if (rt.expiresAt < new Date()) continue;
      const matches = await argon2.verify(rt.tokenHash, rawToken);
      if (matches) return true;
    }
    return false;
  }

  async revokeRefreshToken(userId: string, rawToken: string): Promise<void> {
    const allTokens = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, userId));

    for (const rt of allTokens) {
      const matches = await argon2.verify(rt.tokenHash, rawToken);
      if (matches) {
        await this.db
          .update(refreshTokens)
          .set({ revokedAt: new Date() })
          .where(eq(refreshTokens.id, rt.id));
        return;
      }
    }
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.userId, userId),
          eq(refreshTokens.revokedAt, null!),
        ),
      );
  }

  private async enforceLimit(userId: string): Promise<void> {
    const existing = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, userId));

    const active = existing
      .filter((t) => !t.revokedAt && t.expiresAt > new Date())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    while (active.length >= this.refreshTokenMax) {
      const oldest = active.shift()!;
      await this.db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.id, oldest.id));
    }
  }
}
