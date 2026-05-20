# UI Components

## Page

- **DocumentWorkbookPage**：`/documents/[documentId]/workbook` 独立工作台入口。

## Components（modules/documents/components）

- **DocumentAIPanel**：详情侧栏「AI 助手」Tab；封装 `HermesChatPanel` + `workspace-document-inject`（`document-context/overview.md`）；`scopeKeyDocument` 续聊。
- **UniverSheetEditor（AI 扩展）**：支持注入 `DocumentAIPlugin`，并暴露选区/快照导出能力给上层。
- **SpreadsheetAIToolbar**：AI 按钮、版本/保存入口（可与页面 Header 合并实现）。
- **SpreadsheetAIPanel**：「数据操作」Tab；prompt 输入、quick actions、timeline、patch preview 区块（CopilotKit + Facade）。
- **SpreadsheetPatchPreview**：展示 patch 元数据、risk、warnings、before/after。
- **SpreadsheetPatchDiffTable**：表格差异渲染。
- **AgentExecutionTimeline**：展示 SSE 事件流（task/todo/tool/summary/patch）。
- **SelectionContextCard**：当前选区摘要（hash、范围、截断提示）。

## Key UI States（对齐 §11）

- `idle` / `selection_ready` / `submitting` / `running` / `patch_proposed` / `applying` / `applied` / `failed`

