import {
  documentEvents,
  documentPermissions,
  documentVersions,
  documents,
  type Db,
  type Document,
  type DocumentEvent,
  type DocumentPermission,
  type DocumentVersion,
  type NewDocument,
  type NewDocumentEvent,
  type NewDocumentPermission,
  type NewDocumentVersion,
} from "@portal/db";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export interface ListDocumentsParams {
  workspaceId: string;
  keyword?: string | null;
  status?: string | null;
  page: number;
  pageSize: number;
}

type Tx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

export class DocumentRepository {
  async listDocuments(
    db: Tx,
    params: ListDocumentsParams,
  ): Promise<{ items: Document[]; total: number }> {
    const conditions = [eq(documents.workspaceId, params.workspaceId)];
    if (params.keyword) {
      conditions.push(ilike(documents.title, `%${params.keyword}%`));
    }
    if (params.status) {
      conditions.push(eq(documents.status, params.status));
    }
    const where = and(...conditions);

    const totalRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(documents)
      .where(where);
    const total = totalRows[0]?.count ?? 0;

    const items = await db
      .select()
      .from(documents)
      .where(where)
      .orderBy(desc(documents.updatedAt))
      .offset((params.page - 1) * params.pageSize)
      .limit(params.pageSize);

    return { items, total };
  }

  async getDocument(db: Tx, documentId: string): Promise<Document | null> {
    const rows = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);
    return rows[0] ?? null;
  }

  async createDocument(
    db: Tx,
    params: {
      tenantId: string;
      workspaceId: string;
      ownerId: string;
      createdBy: string;
      title: string;
      documentType: string;
      engine: string;
      provider: string;
    },
  ): Promise<Document> {
    const insertable: NewDocument = {
      id: randomUUID(),
      tenantId: params.tenantId,
      workspaceId: params.workspaceId,
      title: params.title,
      documentType: params.documentType,
      engine: params.engine,
      status: "active",
      provider: params.provider,
      currentVersionNo: 1,
      currentVersionId: null,
      ownerId: params.ownerId,
      createdBy: params.createdBy,
      updatedBy: null,
    };
    const rows = await db.insert(documents).values(insertable).returning();
    const doc = rows[0];
    if (!doc) {
      throw new Error("Failed to insert document");
    }
    return doc;
  }

  async updateDocumentCurrentVersion(
    db: Tx,
    params: {
      documentId: string;
      currentVersionNo: number;
      currentVersionId: string;
      updatedBy: string;
    },
  ): Promise<void> {
    await db
      .update(documents)
      .set({
        currentVersionNo: params.currentVersionNo,
        currentVersionId: params.currentVersionId,
        updatedBy: params.updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, params.documentId));
  }

  async patchDocument(
    db: Tx,
    params: {
      documentId: string;
      title?: string | null;
      status?: string | null;
      updatedBy: string;
    },
  ): Promise<void> {
    const values: Record<string, unknown> = {
      updatedBy: params.updatedBy,
      updatedAt: new Date(),
    };
    if (params.title !== undefined && params.title !== null) {
      values.title = params.title;
    }
    if (params.status !== undefined && params.status !== null) {
      values.status = params.status;
    }
    await db
      .update(documents)
      .set(values)
      .where(eq(documents.id, params.documentId));
  }

  async softDeleteDocument(
    db: Tx,
    params: { documentId: string; updatedBy: string },
  ): Promise<void> {
    const now = new Date();
    await db
      .update(documents)
      .set({
        status: "deleted",
        deletedAt: now,
        updatedBy: params.updatedBy,
        updatedAt: now,
      })
      .where(eq(documents.id, params.documentId));
  }

  async createVersion(
    db: Tx,
    params: {
      documentId: string;
      versionNo: number;
      snapshotBucket: string;
      snapshotKey: string;
      snapshotSizeBytes: number;
      snapshotChecksumSha256: string;
      engine: string;
      engineVersion: string;
      schemaVersion: number;
      saveMode: string;
      createdBy: string;
      createdFrom?: string | null;
      relatedInteractionId?: string | null;
      relatedPatchId?: string | null;
    },
  ): Promise<DocumentVersion> {
    const insertable: NewDocumentVersion = {
      id: randomUUID(),
      documentId: params.documentId,
      versionNo: params.versionNo,
      snapshotBucket: params.snapshotBucket,
      snapshotKey: params.snapshotKey,
      snapshotSizeBytes: params.snapshotSizeBytes,
      snapshotChecksumSha256: params.snapshotChecksumSha256,
      engine: params.engine,
      engineVersion: params.engineVersion,
      schemaVersion: params.schemaVersion,
      saveMode: params.saveMode,
      createdBy: params.createdBy,
      createdFrom: params.createdFrom ?? null,
      relatedInteractionId: params.relatedInteractionId ?? null,
      relatedPatchId: params.relatedPatchId ?? null,
    };
    const rows = await db
      .insert(documentVersions)
      .values(insertable)
      .returning();
    const version = rows[0];
    if (!version) {
      throw new Error("Failed to insert document version");
    }
    return version;
  }

  async listVersions(
    db: Tx,
    params: { documentId: string; page: number; pageSize: number },
  ): Promise<{ items: DocumentVersion[]; total: number }> {
    const where = eq(documentVersions.documentId, params.documentId);
    const totalRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(documentVersions)
      .where(where);
    const total = totalRows[0]?.count ?? 0;

    const items = await db
      .select()
      .from(documentVersions)
      .where(where)
      .orderBy(desc(documentVersions.versionNo))
      .offset((params.page - 1) * params.pageSize)
      .limit(params.pageSize);

    return { items, total };
  }

  async getVersionByNo(
    db: Tx,
    params: { documentId: string; versionNo: number },
  ): Promise<DocumentVersion | null> {
    const rows = await db
      .select()
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.documentId, params.documentId),
          eq(documentVersions.versionNo, params.versionNo),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async listPermissions(
    db: Tx,
    documentId: string,
  ): Promise<DocumentPermission[]> {
    return db
      .select()
      .from(documentPermissions)
      .where(eq(documentPermissions.documentId, documentId));
  }

  async insertPermission(
    db: Tx,
    insertable: NewDocumentPermission,
  ): Promise<DocumentPermission> {
    const rows = await db
      .insert(documentPermissions)
      .values({ ...insertable, id: insertable.id ?? randomUUID() })
      .returning();
    const perm = rows[0];
    if (!perm) {
      throw new Error("Failed to insert document permission");
    }
    return perm;
  }

  async replacePermissions(
    db: Tx,
    params: {
      documentId: string;
      items: Array<{
        subjectType: string;
        subjectId: string;
        role: string;
      }>;
      createdBy: string;
    },
  ): Promise<void> {
    await db
      .delete(documentPermissions)
      .where(eq(documentPermissions.documentId, params.documentId));

    if (params.items.length === 0) return;

    const rows: NewDocumentPermission[] = params.items.map((it) => ({
      id: randomUUID(),
      documentId: params.documentId,
      subjectType: it.subjectType,
      subjectId: it.subjectId,
      role: it.role,
      createdBy: params.createdBy,
    }));
    await db.insert(documentPermissions).values(rows);
  }

  async createEvent(
    db: Tx,
    params: {
      documentId: string;
      eventType: string;
      actorId: string;
      versionNo?: number | null;
      payload?: Record<string, unknown> | null;
    },
  ): Promise<DocumentEvent> {
    const insertable: NewDocumentEvent = {
      id: randomUUID(),
      documentId: params.documentId,
      eventType: params.eventType,
      actorId: params.actorId,
      versionNo: params.versionNo ?? null,
      payload: params.payload ?? null,
    };
    const rows = await db.insert(documentEvents).values(insertable).returning();
    const ev = rows[0];
    if (!ev) {
      throw new Error("Failed to insert document event");
    }
    return ev;
  }

  async listEvents(
    db: Tx,
    params: { documentId: string; page: number; pageSize: number },
  ): Promise<{ items: DocumentEvent[]; total: number }> {
    const where = eq(documentEvents.documentId, params.documentId);
    const totalRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(documentEvents)
      .where(where);
    const total = totalRows[0]?.count ?? 0;

    const items = await db
      .select()
      .from(documentEvents)
      .where(where)
      .orderBy(desc(documentEvents.createdAt))
      .offset((params.page - 1) * params.pageSize)
      .limit(params.pageSize);

    return { items, total };
  }
}
