import {
  emailMessages,
  type Db,
  type EmailMessage,
  type NewEmailMessage,
} from "@portal/db";
import type { EmailListQueryInput } from "@portal/shared";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

type Tx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

export class EmailMessageRepository {
  async list(
    db: Tx,
    params: EmailListQueryInput & { emailAccountId: string },
  ): Promise<{ items: EmailMessage[]; total: number }> {
    const conditions = [
      eq(emailMessages.emailAccountId, params.emailAccountId),
      eq(emailMessages.isDeleted, false),
    ];
    if (params.folder_path) {
      conditions.push(eq(emailMessages.folderPath, params.folder_path));
    }
    if (params.folder_type) {
      conditions.push(eq(emailMessages.folderType, params.folder_type));
    }
    if (params.is_read !== undefined) {
      conditions.push(eq(emailMessages.isRead, params.is_read));
    }
    if (params.is_starred !== undefined) {
      conditions.push(eq(emailMessages.isStarred, params.is_starred));
    }
    if (params.has_attachments !== undefined) {
      conditions.push(eq(emailMessages.hasAttachments, params.has_attachments));
    }
    if (params.search) {
      conditions.push(
        or(
          ilike(emailMessages.subject, `%${params.search}%`),
          ilike(emailMessages.snippet, `%${params.search}%`),
          ilike(emailMessages.fromAddress, `%${params.search}%`),
        )!,
      );
    }
    const where = and(...conditions);

    const totalRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emailMessages)
      .where(where);
    const total = totalRows[0]?.count ?? 0;

    const sortColumn =
      params.sort_by === "from"
        ? emailMessages.fromAddress
        : params.sort_by === "subject"
          ? emailMessages.subject
          : emailMessages.date;
    const order =
      params.sort_order === "asc" ? asc(sortColumn) : desc(sortColumn);

    const items = await db
      .select()
      .from(emailMessages)
      .where(where)
      .orderBy(order)
      .offset((params.page - 1) * params.page_size)
      .limit(params.page_size);

    return { items, total };
  }

  async findById(db: Tx, messageId: string): Promise<EmailMessage | null> {
    const rows = await db
      .select()
      .from(emailMessages)
      .where(eq(emailMessages.id, messageId))
      .limit(1);
    return rows[0] ?? null;
  }

  async create(db: Tx, values: NewEmailMessage): Promise<EmailMessage> {
    const rows = await db.insert(emailMessages).values(values).returning();
    const message = rows[0];
    if (!message) {
      throw new Error("Failed to insert email message");
    }
    return message;
  }

  async updateFlags(
    db: Tx,
    messageId: string,
    values: { isRead?: boolean; isStarred?: boolean },
  ): Promise<EmailMessage | null> {
    const setValues: Record<string, boolean> = {};
    if (values.isRead !== undefined) setValues.isRead = values.isRead;
    if (values.isStarred !== undefined) setValues.isStarred = values.isStarred;
    const rows = await db
      .update(emailMessages)
      .set(setValues)
      .where(eq(emailMessages.id, messageId))
      .returning();
    return rows[0] ?? null;
  }

  async moveToTrash(db: Tx, messageId: string): Promise<void> {
    await db
      .update(emailMessages)
      .set({ folderType: "trash", folderPath: "Trash", isDeleted: true })
      .where(eq(emailMessages.id, messageId));
  }

  async deletePermanent(db: Tx, messageId: string): Promise<void> {
    await db.delete(emailMessages).where(eq(emailMessages.id, messageId));
  }

  async batchUpdate(
    db: Tx,
    messageIds: string[],
    values: Partial<NewEmailMessage>,
  ): Promise<number> {
    const rows = await db
      .update(emailMessages)
      .set(values)
      .where(inArray(emailMessages.id, messageIds))
      .returning({ id: emailMessages.id });
    return rows.length;
  }

  async listFolders(
    db: Tx,
    emailAccountId: string,
  ): Promise<
    Array<{
      folderPath: string;
      folderType: string;
      totalCount: number;
      unreadCount: number;
    }>
  > {
    return db
      .select({
        folderPath: emailMessages.folderPath,
        folderType: emailMessages.folderType,
        totalCount: sql<number>`count(*)::int`,
        unreadCount: sql<number>`count(*) filter (where ${emailMessages.isRead} = false)::int`,
      })
      .from(emailMessages)
      .where(eq(emailMessages.emailAccountId, emailAccountId))
      .groupBy(emailMessages.folderPath, emailMessages.folderType);
  }
}
