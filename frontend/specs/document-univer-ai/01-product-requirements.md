# Product Requirements

## MVP

- **F1 选区上下文采集**：读取 worksheetId/range/values/formulas/headers/sample rows，超限禁止提交。
- **F2 对话入口**：Workbook 页提供 AI 按钮/面板入口。
- **F3 选区问答**：调用 Facade 创建 interaction + task。
- **F4 公式生成**：返回 `set_cell_formulas` patch，必须 preview。
- **F6 Patch Preview**：展示风险、影响范围、before/after。
- **F7 保存版本**：apply 后用户保存，调用 ai-os-api 写新版本并回填追溯字段。
- **F8 执行过程查看**：订阅 Facade SSE timeline。
- **F9 审计记录**：Facade 记录 interaction/patch/decision，与版本追溯字段联动。

## Non-goals（MVP）

- 多人协同
- 导入导出
- Agent 直接操作 Univer 命令 / 未确认自动写入
- 存储原始 CoT
- 任意代码/宏执行

