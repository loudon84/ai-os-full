import type { SnapshotEnvelope } from "../../types/document.types";

/** Lightweight helpers for versioning flows (Facade keeps canonical snapshot envelopes). */

export type WorkbookLikeSnapshot = Record<string, unknown> | undefined;

export function readWorkbookIdFromSnapshot(snapshot: WorkbookLikeSnapshot): string | undefined {
  const id = snapshot?.id;
  return typeof id === "string" && id.trim() ? id : undefined;
}

export function readEngineVersion(snapshot: SnapshotEnvelope["snapshot"], fallback: string): string {
  const ev = snapshot["engine_revision"] ?? snapshot["engineRevision"] ?? snapshot["engine_version"];
  return typeof ev === "string" && ev.trim() ? ev : fallback;
}
