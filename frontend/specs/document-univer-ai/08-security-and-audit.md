# Security & Audit

## Must

- Portal 不保存 Facade token，不直连执行器/LLM。
- 所有写请求必须带 `Idempotency-Key`（Facade）。
- Patch 必须服务端 validate（Facade `spreadsheet_patch_service`）。
- Patch 必须前端二次 validate（Portal `SpreadsheetPatchValidator`）。
- 不发送整 workbook（Portal `SelectionContextCollector` enforced）。
- 不存原始 CoT（Facade 仅存结构化 summary / evidence refs）。

## Audit Events（Facade）

- interaction.created
- patch.validated
- patch.decision.approved / rejected
- patch.client_applied (optional)

## Version Link（ai-os-api）

`document_versions` 记录追溯字段：`created_from` / `related_interaction_id` / `related_patch_id`。

