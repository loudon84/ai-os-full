import type { SnapshotSaveRequest } from "../types/document.types";

/** 待持久化到 ai-os-api `document_versions` 的 AI 追溯（与 §15.4 对齐） */
export type AiSaveLineage = Pick<
  SnapshotSaveRequest,
  "created_from" | "related_interaction_id" | "related_patch_id"
>;

type SnapshotSaveBase = Omit<
  SnapshotSaveRequest,
  "created_from" | "related_interaction_id" | "related_patch_id"
>;

/** 仅在「已批准 AI patch 且三路 id 齐全」时合并追溯字段，否则与纯人工保存一致 */
export function withAiSaveLineage(base: SnapshotSaveBase, lineage: AiSaveLineage | null): SnapshotSaveRequest {
  if (
    lineage?.created_from === "ai_patch_apply" &&
    lineage.related_interaction_id &&
    lineage.related_patch_id
  ) {
    return {
      ...base,
      created_from: "ai_patch_apply",
      related_interaction_id: lineage.related_interaction_id,
      related_patch_id: lineage.related_patch_id,
    };
  }
  return { ...base };
}
