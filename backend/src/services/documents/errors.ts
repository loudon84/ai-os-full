import { HttpError } from "../../errors.js";

export class DocumentNotFoundError extends HttpError {
  constructor(message = "Document not found") {
    super(404, message, { code: "document_not_found" });
    this.name = "DocumentNotFoundError";
  }
}

export class DocumentPermissionDeniedError extends HttpError {
  constructor(message = "Permission denied") {
    super(403, message, { code: "permission_denied" });
    this.name = "DocumentPermissionDeniedError";
  }
}

export class VersionConflictError extends HttpError {
  public readonly currentVersionNo: number;
  public readonly baseVersionNo: number;

  constructor(currentVersionNo: number, baseVersionNo: number) {
    super(409, "Document version conflict", {
      code: "version_conflict",
      extra: {
        current_version_no: currentVersionNo,
        base_version_no: baseVersionNo,
      },
    });
    this.name = "VersionConflictError";
    this.currentVersionNo = currentVersionNo;
    this.baseVersionNo = baseVersionNo;
  }
}

export class SnapshotTooLargeError extends HttpError {
  constructor(message = "Snapshot exceeds max size") {
    super(413, message, { code: "snapshot_too_large" });
    this.name = "SnapshotTooLargeError";
  }
}

export class SnapshotNotFoundError extends HttpError {
  constructor(message = "Snapshot not found") {
    super(404, message, { code: "snapshot_not_found" });
    this.name = "SnapshotNotFoundError";
  }
}
