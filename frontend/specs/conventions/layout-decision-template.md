# Layout Decision Template

> 用途：Cursor / Agent 在新增页面、重构页面、增加模块功能前，必须先填写本模板。
> 目标：先确认页面 Layout，再进入 Page Spec 与代码实现。

---

## 1. Feature Name

填写当前功能或页面名称。

示例：

```txt
Finance Cashflow Forecast
```

---

## 2. Route Decision

| 字段 | 选择 |
|---|---|
| route | `app/[lang]/(dashboard)/<module>/<feature>` |
| route type | `dashboard route` / `standalone route` / `shared route group layout` / `existing page modification` |
| requires auth | `yes` / `no` |
| standalone page | `yes` / `no` |
| shared route group layout | `yes` / `no` |
| existing page modification | `yes` / `no` |

### 2.1 Route 选择理由

```txt
说明为什么该页面应该进入 dashboard route 或 standalone route。
```

### 2.2 默认判断

- 企业内部功能页：默认进入 `app/[lang]/(dashboard)/...`
- 需要认证、组织、权限、Sidebar、Header 的页面：进入 `(dashboard)`
- 登录、公开文档、外部回调、营销页：不进入 `(dashboard)`
- 多个页面共享局部壳：使用 route group layout
- 复杂明细工作区：优先考虑页面级 `layout.tsx` 或模块级 `WorkspaceLayout`

---

## 3. Selected Page Template

从以下模板中选择一个：

- `WorkspaceDashboardTemplate`
- `DataManagementTemplate`
- `AgentWorkspaceTemplate`
- `ExecutionDetailTemplate`
- `DocumentWorkspaceTemplate`
- `SettingsTemplate`
- `Custom`，仅允许在有充分理由时使用

当前选择：

```txt
<TemplateName>
```

### 3.1 选择理由

```txt
说明为什么这个页面应该使用该模板。
```

### 3.2 页面类型判断矩阵

| 页面类型 | 推荐模板 |
|---|---|
| Dashboard / Finance / Risk 概览 | `WorkspaceDashboardTemplate` |
| 任务 / 文件 / 用户 / 审批列表 | `DataManagementTemplate` |
| AI 助手 / 会话 / 多 Agent 协作 | `AgentWorkspaceTemplate` |
| Workflow / Agent Run / 审批流详情 | `ExecutionDetailTemplate` |
| 文档 / 知识库 / Univer / Article Studio | `DocumentWorkspaceTemplate` |
| MCP / Skill / RBAC / 系统设置 | `SettingsTemplate` |

---

## 4. Layout Structure

按页面真实区块顺序填写。

示例：

```txt
PageHeader
KpiStrip / SummaryCards
FilterBar
DataTable / ChartGrid
RightDrawer / Inspector
```

当前页面结构：

```txt
<按顺序填写页面区块>
```

### 4.1 主区域说明

```txt
说明 MainContent 是 Table、CardGrid、Chat/Stream、Flow、Editor、Sheet、Timeline 还是其它。
```

### 4.2 详情区说明

```txt
说明是否需要 RightDrawer / Inspector / DetailPanel / PreviewPanel。
```

---

## 5. Shell Inheritance

| Shell 能力 | 是否继承 | 说明 |
|---|---:|---|
| Header | `yes/no` | |
| Sidebar | `yes/no` | |
| Footer | `yes/no` | |
| ThemeCustomize | `yes/no` | |
| Auth protection | `yes/no` | |
| i18n | `yes/no` | |
| DirectionProvider | `yes/no` | |
| GlobalCopilotProvider | `yes/no` | |

### 5.1 继承结论

```txt
说明该页面继承哪一层 Layout，以及为什么。
```

---

## 6. Page-level Layout Need

| 问题 | 结论 |
|---|---|
| 是否需要新增 `layout.tsx` | `yes/no` |
| 是否需要模块内 `WorkspaceLayout` | `yes/no` |
| 是否需要 `WorkspaceFilesPanel` | `yes/no` |
| 是否需要 `RightDrawer / Inspector` | `yes/no` |
| 是否需要 AI Copilot 三栏布局 | `yes/no` |
| 是否需要隐藏 Footer | `yes/no` |
| 是否需要内容区最大化 | `yes/no` |

### 6.1 需要新增 `layout.tsx` 的条件

满足以下任一条件，才考虑新增页面级 `layout.tsx`：

- 明细页需要长期存在的局部 SideNav / FileTree / WorkspaceFiles
- 文档 / 编辑器 / 表格工作区需要特殊滚动与最大化布局
- 同一 route group 下多个页面共享局部布局
- 需要在 Dashboard Shell 内再套一层模块工作区
- 需要明确控制 Footer / Content max-width / 局部右侧面板

否则优先只新增 `page.tsx`，业务结构放入 `modules/<domain>/pages/*`。

---

## 7. Copilot Decision

| 项 | 结论 |
|---|---|
| 是否注册 PageCopilotContext | `yes/no` |
| 是否需要 Prompt 输入区 | `yes/no` |
| 是否需要 ContextPanel | `yes/no` |
| 是否需要 ExecutionTimeline | `yes/no` |
| 是否需要 ResultPanel | `yes/no` |
| 是否需要 References / Sources | `yes/no` |
| 是否需要 Feedback / Retry / Approve | `yes/no` |
| 是否允许新建 Copilot Provider | `no` |

### 7.1 Copilot 说明

```txt
说明本页面如何使用全局 Copilot，以及是否需要页面级上下文注册。
```

### 7.2 AI 页面最低要求

如果是 AI / Agent / Workflow / Task Execution 页面，必须包含：

```txt
PromptInput or TaskForm
ContextPanel
ExecutionStatePanel
ExecutionTimeline
ResultPanel
SourceReferences
FeedbackActions
```

---

## 8. Data / State Layout Impact

| 状态 | 是否需要 | 展示位置 |
|---|---:|---|
| Loading | `yes/no` | |
| Empty | `yes/no` | |
| Error | `yes/no` | |
| Forbidden | `yes/no` | |
| Running | `yes/no` | |
| Waiting Human | `yes/no` | |
| Partial Success | `yes/no` | |
| Saving | `yes/no` | |

说明：

```txt
说明这些状态如何影响页面布局，不允许只在控制台或 toast 中处理。
```

---

## 9. Forbidden Changes

本次任务默认不得修改：

```txt
app/[lang]/layout.tsx
app/[lang]/(dashboard)/layout.tsx
provider/*
components/ui/*
```

如确实需要修改，必须先停止实现并向用户确认。

---

## 10. Layout Acceptance

在写代码前必须确认：

- [ ] 已读取 `specs/layout-structure.md`
- [ ] 已选择页面母版
- [ ] 已确认 route type
- [ ] 已确认是否继承 Dashboard Layout
- [ ] 已确认是否需要页面级 `layout.tsx`
- [ ] 已确认是否需要模块级 `WorkspaceLayout`
- [ ] 已确认是否需要 AI 三栏工作系统
- [ ] 已确认是否注册 PageCopilotContext
- [ ] 已确认不修改全局壳
- [ ] 已确认不修改 `components/ui/*`

---

## 11. Output Contract

Agent 输出 Layout Decision 时必须使用以下结构：

```md
# Layout Decision: <Feature Name>

## Route Decision
...

## Selected Page Template
...

## Layout Structure
...

## Shell Inheritance
...

## Page-level Layout Need
...

## Copilot Decision
...

## Forbidden Changes
...

## Layout Acceptance
...
```

未输出本结构前，禁止生成 React 代码。
