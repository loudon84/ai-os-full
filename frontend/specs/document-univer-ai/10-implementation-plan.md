# Implementation Plan

按阶段实施（与 `.cursor/plans/datasheet_ai_编码计划_254eeaf5.plan.md` 的 todos 对齐）：

1. os-facade：`document-ai` 后端（interaction/patch/SSE/审计），首版 Stub 执行器。
2. Portal：Univer AI Plugin（context/validate/apply/snapshot）。
3. Portal：Copilot readable/actions，Action 仅调用 Facade REST。
4. Portal：Patch Preview + SSE timeline。
5. ai-os-api：版本索引追溯字段（迁移 + 保存链路）。
6. 测试与验收（AC-01～AC-05）。

