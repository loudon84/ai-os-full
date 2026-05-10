import type { Db, Document } from "@portal/db";
import type {
  DocumentPermissionRole,
  SnapshotEnvelope,
  SnapshotSaveRequest,
} from "@portal/shared";

import type { AppConfig } from "../../config.js";
import type { RequestContext } from "../../middleware/auth.js";
import type { SnapshotStorage } from "../../storage/snapshot-storage.js";
import { sha256Hex } from "./checksum.js";
import {
  DocumentNotFoundError,
  DocumentPermissionDeniedError,
  SnapshotTooLargeError,
  VersionConflictError,
} from "./errors.js";
import { PermissionService } from "./permission.js";
import type { DocumentRepository } from "./repository.js";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

function snapshotKey(params: {
  tenantId: string;
  workspaceId: string;
  documentId: string;
  versionNo: number;
}): string {
  const padded = String(params.versionNo).padStart(8, "0");
  return `documents/${params.tenantId}/${params.workspaceId}/${params.documentId}/versions/v${padded}.json`;
}

function emptyUniverSnapshot(): Record<string, unknown> {
  return {
    id: "workbook",
    name: "Untitled",
    sheetOrder: ["sheet-001"],
    sheets: {
      "sheet-001": { id: "sheet-001", name: "Sheet1", cellData: {} },
    },
  };
}

function utcNowIso(): string {
  return new Date().toISOString();
}

function envelopeToBuffer(envelope: SnapshotEnvelope): Buffer {
  return Buffer.from(JSON.stringify(envelope), "utf8");
}

export interface DocumentServiceDeps {
  db: Db;
  repo: DocumentRepository;
  storage: SnapshotStorage;
  permission: PermissionService;
  config: AppConfig;
}

export class DocumentService {
  private readonly db: Db;
  private readonly repo: DocumentRepository;
  private readonly storage: SnapshotStorage;
  private readonly permission: PermissionService;
  private readonly config: AppConfig;

  constructor(deps: DocumentServiceDeps) {
    this.db = deps.db;
    this.repo = deps.repo;
    this.storage = deps.storage;
    this.permission = deps.permission;
    this.config = deps.config;
  }

  async createDocument(
    ctx: RequestContext,
    title: string,
  ): Promise<{ documentId: string; versionNo: number }> {
    return this.db.transaction(async (tx) => {
      const doc = await this.repo.createDocument(tx, {
        tenantId: ctx.tenantId,
        workspaceId: ctx.workspaceId,
        ownerId: ctx.userId,
        createdBy: ctx.userId,
        title,
        documentType: "spreadsheet",
        engine: "univer",
        provider: "local",
      });

      const versionNo = 1;
      const envelope: SnapshotEnvelope = {
        document_id: doc.id,
        document_type: "spreadsheet",
        engine: "univer",
        engine_version: "0.x",
        schema_version: 1,
        version_no: versionNo,
        saved_at: utcNowIso(),
        saved_by: ctx.userId,
        snapshot: emptyUniverSnapshot(),
      };
      const payload = envelopeToBuffer(envelope);
      if (payload.byteLength > this.config.snapshotMaxBytes) {
        throw new SnapshotTooLargeError();
      }

      const checksum = sha256Hex(payload);
      const key = snapshotKey({
        tenantId: ctx.tenantId,
        workspaceId: ctx.workspaceId,
        documentId: doc.id,
        versionNo,
      });
      await this.storage.putSnapshot({
        bucket: this.config.s3Bucket,
        key,
        payload,
      });

      const version = await this.repo.createVersion(tx, {
        documentId: doc.id,
        versionNo,
        snapshotBucket: this.config.s3Bucket,
        snapshotKey: key,
        snapshotSizeBytes: payload.byteLength,
        snapshotChecksumSha256: checksum,
        engine: "univer",
        engineVersion: "0.x",
        schemaVersion: 1,
        saveMode: "system",
        createdBy: ctx.userId,
      });
      await this.repo.updateDocumentCurrentVersion(tx, {
        documentId: doc.id,
        currentVersionNo: versionNo,
        currentVersionId: version.id,
        updatedBy: ctx.userId,
      });
      await this.repo.insertPermission(tx, {
        documentId: doc.id,
        subjectType: "user",
        subjectId: ctx.userId,
        role: "owner",
        createdBy: ctx.userId,
      });
      await this.repo.createEvent(tx, {
        documentId: doc.id,
        eventType: "document.created",
        actorId: ctx.userId,
        versionNo,
        payload: { title },
      });
      return { documentId: doc.id, versionNo };
    });
  }

  async getDocumentOr404(
    db: Db | Tx,
    documentId: string,
  ): Promise<Document> {
    const doc = await this.repo.getDocument(db, documentId);
    if (!doc) {
      throw new DocumentNotFoundError();
    }
    return doc;
  }

  async getCurrentUserRole(
    db: Db | Tx,
    ctx: RequestContext,
    documentId: string,
  ): Promise<DocumentPermissionRole | null> {
    return this.permission.getUserRole(db, {
      documentId,
      userId: ctx.userId,
      roles: ctx.roles,
      departments: ctx.departments,
    });
  }

  async getSnapshot(
    ctx: RequestContext,
    documentId: string,
  ): Promise<SnapshotEnvelope> {
    return this.db.transaction(async (tx) => {
      const doc = await this.getDocumentOr404(tx, documentId);
      const role = await this.getCurrentUserRole(tx, ctx, documentId);
      if (!PermissionService.canView(role)) {
        throw new DocumentPermissionDeniedError();
      }

      const version = await this.repo.getVersionByNo(tx, {
        documentId,
        versionNo: doc.currentVersionNo,
      });
      if (!version) {
        throw new DocumentNotFoundError("Current version not found");
      }

      const raw = await this.storage.getSnapshot({
        bucket: version.snapshotBucket,
        key: version.snapshotKey,
      });
      const env = JSON.parse(raw.toString("utf8")) as SnapshotEnvelope;

      await this.repo.createEvent(tx, {
        documentId,
        eventType: "snapshot.read",
        actorId: ctx.userId,
        versionNo: doc.currentVersionNo,
        payload: {
          bucket: version.snapshotBucket,
          key: version.snapshotKey,
        },
      });
      return env;
    });
  }

  async getSnapshotByVersion(
    ctx: RequestContext,
    documentId: string,
    versionNo: number,
  ): Promise<SnapshotEnvelope> {
    return this.db.transaction(async (tx) => {
      await this.getDocumentOr404(tx, documentId);
      const role = await this.getCurrentUserRole(tx, ctx, documentId);
      if (!PermissionService.canView(role)) {
        throw new DocumentPermissionDeniedError();
      }

      const version = await this.repo.getVersionByNo(tx, {
        documentId,
        versionNo,
      });
      if (!version) {
        throw new DocumentNotFoundError("Version not found");
      }

      const raw = await this.storage.getSnapshot({
        bucket: version.snapshotBucket,
        key: version.snapshotKey,
      });
      const env = JSON.parse(raw.toString("utf8")) as SnapshotEnvelope;

      await this.repo.createEvent(tx, {
        documentId,
        eventType: "snapshot.read",
        actorId: ctx.userId,
        versionNo,
        payload: {
          bucket: version.snapshotBucket,
          key: version.snapshotKey,
        },
      });
      return env;
    });
  }

  async saveSnapshot(
    ctx: RequestContext,
    documentId: string,
    req: SnapshotSaveRequest,
  ): Promise<{
    versionNo: number;
    sizeBytes: number;
    checksum: string;
    savedAt: string;
  }> {
    return this.db.transaction(async (tx) => {
      const doc = await this.getDocumentOr404(tx, documentId);
      const role = await this.getCurrentUserRole(tx, ctx, documentId);
      if (!PermissionService.canEdit(role)) {
        throw new DocumentPermissionDeniedError(
          "Current user has no edit permission",
        );
      }

      if (req.base_version_no !== doc.currentVersionNo) {
        throw new VersionConflictError(
          doc.currentVersionNo,
          req.base_version_no,
        );
      }

      const nextVersionNo = doc.currentVersionNo + 1;
      const savedAt = utcNowIso();
      const envelope: SnapshotEnvelope = {
        document_id: doc.id,
        document_type: "spreadsheet",
        engine: "univer",
        engine_version: req.engine_version,
        schema_version: req.schema_version ?? 1,
        version_no: nextVersionNo,
        saved_at: savedAt,
        saved_by: ctx.userId,
        snapshot: req.snapshot,
      };
      const payload = envelopeToBuffer(envelope);
      if (payload.byteLength > this.config.snapshotMaxBytes) {
        throw new SnapshotTooLargeError();
      }

      const checksum = sha256Hex(payload);
      const key = snapshotKey({
        tenantId: ctx.tenantId,
        workspaceId: ctx.workspaceId,
        documentId: doc.id,
        versionNo: nextVersionNo,
      });
      await this.storage.putSnapshot({
        bucket: this.config.s3Bucket,
        key,
        payload,
      });

      const version = await this.repo.createVersion(tx, {
        documentId: doc.id,
        versionNo: nextVersionNo,
        snapshotBucket: this.config.s3Bucket,
        snapshotKey: key,
        snapshotSizeBytes: payload.byteLength,
        snapshotChecksumSha256: checksum,
        engine: "univer",
        engineVersion: req.engine_version,
        schemaVersion: req.schema_version ?? 1,
        saveMode: req.save_mode ?? "manual",
        createdBy: ctx.userId,
        createdFrom: req.created_from ?? null,
        relatedInteractionId: req.related_interaction_id ?? null,
        relatedPatchId: req.related_patch_id ?? null,
      });
      await this.repo.updateDocumentCurrentVersion(tx, {
        documentId: doc.id,
        currentVersionNo: nextVersionNo,
        currentVersionId: version.id,
        updatedBy: ctx.userId,
      });
      await this.repo.createEvent(tx, {
        documentId: doc.id,
        eventType: "document.saved",
        actorId: ctx.userId,
        versionNo: nextVersionNo,
        payload: {
          save_mode: req.save_mode ?? "manual",
          created_from: req.created_from ?? null,
          related_interaction_id: req.related_interaction_id ?? null,
          related_patch_id: req.related_patch_id ?? null,
        },
      });
      await this.repo.createEvent(tx, {
        documentId: doc.id,
        eventType: "version.created",
        actorId: ctx.userId,
        versionNo: nextVersionNo,
        payload: { checksum, size_bytes: payload.byteLength },
      });

      return {
        versionNo: nextVersionNo,
        sizeBytes: payload.byteLength,
        checksum,
        savedAt,
      };
    });
  }
}
