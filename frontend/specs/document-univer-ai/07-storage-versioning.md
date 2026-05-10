# Storage & Versioning

## Snapshot Flow

1. Portal 导出 Univer snapshot（`WorkbookSnapshotAdapter`）
2. Portal 调用 ai-os-api 保存快照（S3 put + PG insert version index）
3. ai-os-api 返回新 `version_id` / `version_no`

## AI Patch Apply Flow（追溯）

- 用户批准 patch 并成功 apply 后，Portal 立即向 Facade 记录 decision（approved + client_applied）。
- 用户保存时，Portal 调用 ai-os-api 保存快照，并附带：
  - `created_from="ai_patch_apply"`
  - `related_interaction_id`
  - `related_patch_id`

