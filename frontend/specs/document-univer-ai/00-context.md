# Context

本功能将 Univer 作为 AI OS Portal 的 Excel 查看/编辑内核。
CopilotKit 只作为交互入口与前端 action 编排。
所有 Agent 请求必须走 AI OS Facade（`ai-os-facade/apps/os-facade`）。
Document API（`ai-os-api`）负责 metadata、snapshot、version index。

## Invariants

- Portal 不直连执行器（Hermes/OpenClaw/Dify/DeerFlow）与 LLM。
- Agent 返回的修改必须先形成 Patch Preview，用户确认后才 apply 到 Univer。
- 不发送整 workbook；只允许受限选区上下文（见 `06-spreadsheet-patch-protocol.md` 与 `02-domain-objects.md`）。

