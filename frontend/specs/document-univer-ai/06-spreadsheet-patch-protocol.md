# Spreadsheet Patch Protocol

## Principles

- 禁止 Agent 直接修改 Univer runtime。
- Agent 只能返回标准 `SpreadsheetPatch`。
- 前端必须 preview。
- 用户确认后才 apply。
- apply 后必须记录 patch decision（Facade）。
- 保存后必须创建新 snapshot version（ai-os-api），并写入追溯字段。

## Allowed Ops（P0）

- `set_cell_values`
- `set_cell_formulas`

## Forbidden

- 任意 JS 执行 / 宏 / 外部网络函数
- 删除整个 workbook
- 跨文档写入
- 未确认直接写入

## Risk Rules（MVP）

风险规则由 Facade 服务端判定（并在 Portal preview 中展示）：\n\n- affectedCells ≤ 100 → low\n- 101–3000 → medium\n- 超出上限、hash 不一致、版本不一致 → high（需审批，MVP 可先拒绝/提示）\n+
