# Domain Objects

> 每个对象需能追溯到 `agent_spec.md` 的 Spec ID（`§4.1`）。

## Document（ai-os-api）

- **WorkbookDocument**：文档元数据（title/status/permissions）。
- **WorkbookSnapshot**：workbook 序列化快照（S3/MinIO object）。
- **WorkbookVersionIndex**：版本索引（PG `document_versions`）。

## Spreadsheet Context（Portal）

- **SheetRangeContext**：受限选区上下文 DTO（最大 100×30、最多 3000 cells、最多 60k 字符）。

## AI Interaction（Facade）

- **SheetAIInteraction**：一次交互的真相源（prompt、actor、task/execution、status、summary）。
- **SheetAIRequest**：Portal → Facade 请求 DTO（含 context）。
- **SheetAIResult**：Facade → Portal 结果 DTO（含 answer/patch refs）。
- **SheetAIExecutionEvent**：Facade SSE 事件（timeline）。

## Patch（Facade/Portal）

- **SpreadsheetPatch**：白名单操作的 patch 协议（值/公式为 P0）。
- **PatchPreview**：UI Model（before/after、risk、warnings）。
- **PatchApplyDecision**：用户批准/拒绝事件（Facade 审计 + ai-os-api 版本追溯字段）。

