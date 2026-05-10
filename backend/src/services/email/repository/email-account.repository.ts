import {
  emailAccounts,
  type Db,
  type EmailAccount,
  type NewEmailAccount,
} from "@portal/db";
import { and, eq, isNull } from "drizzle-orm";

type Tx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

export class EmailAccountRepository {
  async findByUserId(db: Tx, userId: string): Promise<EmailAccount | null> {
    const rows = await db
      .select()
      .from(emailAccounts)
      .where(and(eq(emailAccounts.userId, userId), isNull(emailAccounts.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  }

  async findById(db: Tx, accountId: string): Promise<EmailAccount | null> {
    const rows = await db
      .select()
      .from(emailAccounts)
      .where(and(eq(emailAccounts.id, accountId), isNull(emailAccounts.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  }

  async create(db: Tx, values: NewEmailAccount): Promise<EmailAccount> {
    const rows = await db.insert(emailAccounts).values(values).returning();
    const account = rows[0];
    if (!account) {
      throw new Error("Failed to insert email account");
    }
    return account;
  }

  async update(
    db: Tx,
    accountId: string,
    values: Partial<NewEmailAccount>,
  ): Promise<EmailAccount | null> {
    const rows = await db
      .update(emailAccounts)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(emailAccounts.id, accountId))
      .returning();
    return rows[0] ?? null;
  }

  async softDelete(db: Tx, accountId: string): Promise<void> {
    const now = new Date();
    await db
      .update(emailAccounts)
      .set({
        status: "deleted",
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(emailAccounts.id, accountId));
  }
}
