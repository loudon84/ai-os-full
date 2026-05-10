import {
  emailAttachments,
  type Db,
  type EmailAttachment,
  type NewEmailAttachment,
} from "@portal/db";
import { eq } from "drizzle-orm";

type Tx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

export class EmailAttachmentRepository {
  async listByMessageId(db: Tx, messageId: string): Promise<EmailAttachment[]> {
    return db
      .select()
      .from(emailAttachments)
      .where(eq(emailAttachments.emailMessageId, messageId));
  }

  async findById(db: Tx, attachmentId: string): Promise<EmailAttachment | null> {
    const rows = await db
      .select()
      .from(emailAttachments)
      .where(eq(emailAttachments.id, attachmentId))
      .limit(1);
    return rows[0] ?? null;
  }

  async createMany(db: Tx, values: NewEmailAttachment[]): Promise<EmailAttachment[]> {
    if (values.length === 0) return [];
    return db.insert(emailAttachments).values(values).returning();
  }
}
