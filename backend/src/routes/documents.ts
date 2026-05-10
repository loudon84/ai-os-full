import type { Db, Document } from "@portal/db";
import {
  documentCreateSchema,
  documentPermissionsReplaceSchema,
  documentUpdateSchema,
  eventListQuerySchema,
  listQuerySchema,
  snapshotSaveSchema,
  versionListQuerySchema,
  type DocumentEventResponse,
  type DocumentListResponse,
  type DocumentPermissionsResponse,
  type DocumentResponse,
  type DocumentVersionListResponse,
  type DocumentVersionResponse,
  type SnapshotSaveResponse,
} from "@portal/shared";
import { Router, type Request, type Router as ExpressRouter } from "express";
import { z } from "zod";

import type { AppConfig } from "../config.js";
import {
  DocumentPermissionDeniedError,
  PermissionService,
  type DocumentRepository,
  type DocumentService,
} from "../services/documents/index.js";
import type { SnapshotStorage } from "../storage/snapshot-storage.js";

export interface DocumentRouteDeps {
  db: Db;
  repo: DocumentRepository;
  service: DocumentService;
  storage: SnapshotStorage;
  config: AppConfig;
}

const documentIdParam = z.object({ documentId: z.string().uuid() });
const versionParam = z.object({
  documentId: z.string().uuid(),
  versionNo: z.coerce.number().int().min(1),
});

function toDocResponse(
  doc: Document,
  currentUserPermission: string,
): DocumentResponse {
  return {
    id: doc.id,
    title: doc.title,
    document_type: doc.documentType as DocumentResponse["document_type"],
    engine: doc.engine as DocumentResponse["engine"],
    status: doc.status as DocumentResponse["status"],
    provider: doc.provider as DocumentResponse["provider"],
    current_version_no: doc.currentVersionNo,
    owner_id: doc.ownerId,
    current_user_permission:
      currentUserPermission as DocumentResponse["current_user_permission"],
    created_at: doc.createdAt.toISOString(),
    updated_at: doc.updatedAt.toISOString(),
  };
}

function getDocumentId(req: Request): string {
  return documentIdParam.parse(req.params).documentId;
}

export function documentRoutes(deps: DocumentRouteDeps): ExpressRouter {
  const router = Router();
  const { db, repo, service } = deps;

  router.post("/", async (req, res) => {
    const payload = documentCreateSchema.parse(req.body);
    const { documentId } = await service.createDocument(req.ctx, payload.title);
    const doc = await repo.getDocument(db, documentId);
    if (!doc) {
      throw new Error("Document missing right after create");
    }
    res.status(201).json(toDocResponse(doc, "owner"));
  });

  router.get("/", async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    const { items: docs, total } = await repo.listDocuments(db, {
      workspaceId: req.ctx.workspaceId,
      keyword: query.keyword,
      status: query.status,
      page: query.page,
      pageSize: query.page_size,
    });

    const items: DocumentResponse[] = [];
    for (const doc of docs) {
      const role = await service.getCurrentUserRole(db, req.ctx, doc.id);
      if (!PermissionService.canView(role)) continue;
      items.push(toDocResponse(doc, role ?? "view"));
    }

    const body: DocumentListResponse = {
      items,
      page: query.page,
      page_size: query.page_size,
      total,
    };
    res.json(body);
  });

  router.get("/:documentId", async (req, res) => {
    const documentId = getDocumentId(req);
    const doc = await service.getDocumentOr404(db, documentId);
    const role = await service.getCurrentUserRole(db, req.ctx, documentId);
    if (!PermissionService.canView(role)) {
      throw new DocumentPermissionDeniedError();
    }
    res.json(toDocResponse(doc, role ?? "view"));
  });

  router.patch("/:documentId", async (req, res) => {
    const documentId = getDocumentId(req);
    const payload = documentUpdateSchema.parse(req.body);

    await db.transaction(async (tx) => {
      await service.getDocumentOr404(tx, documentId);
      const role = await service.getCurrentUserRole(tx, req.ctx, documentId);
      if (!PermissionService.canEdit(role)) {
        throw new DocumentPermissionDeniedError();
      }
      await repo.patchDocument(tx, {
        documentId,
        title: payload.title ?? null,
        status: payload.status ?? null,
        updatedBy: req.ctx.userId,
      });
      const doc = await repo.getDocument(tx, documentId);
      if (!doc) {
        throw new Error("Document missing right after patch");
      }
      res.json(toDocResponse(doc, role ?? "edit"));
    });
  });

  router.delete("/:documentId", async (req, res) => {
    const documentId = getDocumentId(req);
    await db.transaction(async (tx) => {
      await service.getDocumentOr404(tx, documentId);
      const role = await service.getCurrentUserRole(tx, req.ctx, documentId);
      if (!PermissionService.canOwner(role)) {
        throw new DocumentPermissionDeniedError();
      }
      await repo.softDeleteDocument(tx, {
        documentId,
        updatedBy: req.ctx.userId,
      });
      res.json({ ok: true });
    });
  });

  router.get("/:documentId/snapshot", async (req, res) => {
    const documentId = getDocumentId(req);
    const env = await service.getSnapshot(req.ctx, documentId);
    res.json(env);
  });

  router.put("/:documentId/snapshot", async (req, res) => {
    const documentId = getDocumentId(req);
    const payload = snapshotSaveSchema.parse(req.body);
    const result = await service.saveSnapshot(req.ctx, documentId, payload);
    const body: SnapshotSaveResponse = {
      document_id: documentId,
      version_no: result.versionNo,
      snapshot_size_bytes: result.sizeBytes,
      snapshot_checksum_sha256: result.checksum,
      saved_at: result.savedAt,
    };
    res.json(body);
  });

  router.get("/:documentId/versions", async (req, res) => {
    const documentId = getDocumentId(req);
    const query = versionListQuerySchema.parse(req.query);

    await db.transaction(async (tx) => {
      await service.getDocumentOr404(tx, documentId);
      const role = await service.getCurrentUserRole(tx, req.ctx, documentId);
      if (!PermissionService.canView(role)) {
        throw new DocumentPermissionDeniedError();
      }
      const { items, total } = await repo.listVersions(tx, {
        documentId,
        page: query.page,
        pageSize: query.page_size,
      });
      const versions: DocumentVersionResponse[] = items.map((v) => ({
        id: v.id,
        document_id: v.documentId,
        version_no: v.versionNo,
        snapshot_bucket: v.snapshotBucket,
        snapshot_key: v.snapshotKey,
        snapshot_size_bytes: v.snapshotSizeBytes,
        snapshot_checksum_sha256: v.snapshotChecksumSha256,
        engine: v.engine as DocumentVersionResponse["engine"],
        engine_version: v.engineVersion,
        schema_version: v.schemaVersion,
        save_mode: v.saveMode as DocumentVersionResponse["save_mode"],
        created_by: v.createdBy,
        created_at: v.createdAt.toISOString(),
        created_from: v.createdFrom,
        related_interaction_id: v.relatedInteractionId,
        related_patch_id: v.relatedPatchId,
      }));
      const body: DocumentVersionListResponse = {
        items: versions,
        page: query.page,
        page_size: query.page_size,
        total,
      };
      res.json(body);
    });
  });

  router.get("/:documentId/versions/:versionNo", async (req, res) => {
    const params = versionParam.parse(req.params);
    const env = await service.getSnapshotByVersion(
      req.ctx,
      params.documentId,
      params.versionNo,
    );
    res.json(env);
  });

  router.get("/:documentId/permissions", async (req, res) => {
    const documentId = getDocumentId(req);

    await db.transaction(async (tx) => {
      await service.getDocumentOr404(tx, documentId);
      const role = await service.getCurrentUserRole(tx, req.ctx, documentId);
      if (!PermissionService.canOwner(role)) {
        throw new DocumentPermissionDeniedError();
      }
      const perms = await repo.listPermissions(tx, documentId);
      const body: DocumentPermissionsResponse = {
        items: perms.map((p) => ({
          subject_type: p.subjectType as DocumentPermissionsResponse["items"][number]["subject_type"],
          subject_id: p.subjectId,
          role: p.role as DocumentPermissionsResponse["items"][number]["role"],
        })),
      };
      res.json(body);
    });
  });

  router.put("/:documentId/permissions", async (req, res) => {
    const documentId = getDocumentId(req);
    const payload = documentPermissionsReplaceSchema.parse(req.body);

    await db.transaction(async (tx) => {
      await service.getDocumentOr404(tx, documentId);
      const role = await service.getCurrentUserRole(tx, req.ctx, documentId);
      if (!PermissionService.canOwner(role)) {
        throw new DocumentPermissionDeniedError();
      }
      await repo.replacePermissions(tx, {
        documentId,
        items: payload.items.map((it) => ({
          subjectType: it.subject_type,
          subjectId: it.subject_id,
          role: it.role,
        })),
        createdBy: req.ctx.userId,
      });
      const perms = await repo.listPermissions(tx, documentId);
      const body: DocumentPermissionsResponse = {
        items: perms.map((p) => ({
          subject_type: p.subjectType as DocumentPermissionsResponse["items"][number]["subject_type"],
          subject_id: p.subjectId,
          role: p.role as DocumentPermissionsResponse["items"][number]["role"],
        })),
      };
      res.json(body);
    });
  });

  router.get("/:documentId/events", async (req, res) => {
    const documentId = getDocumentId(req);
    const query = eventListQuerySchema.parse(req.query);

    await db.transaction(async (tx) => {
      await service.getDocumentOr404(tx, documentId);
      const role = await service.getCurrentUserRole(tx, req.ctx, documentId);
      if (!PermissionService.canView(role)) {
        throw new DocumentPermissionDeniedError();
      }
      const { items, total } = await repo.listEvents(tx, {
        documentId,
        page: query.page,
        pageSize: query.page_size,
      });
      const events: DocumentEventResponse[] = items.map((ev) => ({
        id: ev.id,
        document_id: ev.documentId,
        event_type: ev.eventType,
        actor_id: ev.actorId,
        version_no: ev.versionNo,
        payload: ev.payload as Record<string, unknown> | null,
        created_at: ev.createdAt.toISOString(),
      }));
      res.json({
        items: events,
        page: query.page,
        page_size: query.page_size,
        total,
      });
    });
  });

  return router;
}
