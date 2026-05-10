下面这套文档的目标：让 Cursor 在 `ai-os-portal` 新功能开发时，不再“凭感觉生成页面”，而是按 **Design → Page Spec → Component Contract → Code DoD** 的路径生成。

我会按你们现有项目约束来设计：项目是 Next.js 14 App Router + React 18 + TypeScript + Tailwind + shadcn/ui + Zustand + React Query + CopilotKit；新功能默认进入 `app/[lang]/(dashboard)/`，业务逻辑进入 `modules/<domain>/`，`components/ui/` 禁止魔改。 

---

# 一、建议新增文档结构

放到项目内：

```txt
docs/
├── cursor/
│   ├── 00-cursor-entry.md
│   ├── 01-ai-os-design-principles.md
│   ├── 02-page-spec-template.md
│   ├── 03-component-contract.md
│   ├── 04-shadcn-ui-rules.md
│   ├── 05-table-page-rules.md
│   ├── 06-ai-page-rules.md
│   ├── 07-state-design-rules.md
│   ├── 08-page-generation-prompt.md
│   └── 09-ui-quality-dod.md
└── conventions/
    └── ai-os-page-generation.md

.cursor/
└── rules/
    ├── 10-ai-os-design.mdc
    ├── 20-page-spec-first.mdc
    ├── 30-shadcn-ui-only.mdc
    ├── 40-module-boundary.mdc
    ├── 50-state-design.mdc
    └── 60-ai-work-page.mdc
```

原因：

现有 `AGENTS.md` 已经规定 Agent 要先读入口文档，再按索引加载 specs，避免一次性读全量 PRD；这套新增文档应该承接这个机制，而不是替代它。

---

# 二、Cursor 切入总入口文档

## `docs/cursor/00-cursor-entry.md`

````md
# Cursor Entry — AI OS Portal 页面生成入口

## 1. 项目定位

ai-os-portal 是人与 AI 共存的企业级操作系统前端门户。

它不是营销官网，也不是普通 Admin Dashboard。
页面需要体现：

- 人类用户的任务入口
- AI Agent 的执行状态
- 业务对象的数据结构
- 可追踪的操作过程
- 权限、审计、结果确认
- 多模块协作

默认新功能属于企业内部系统，必须考虑权限、状态、数据接口、可扩展性。

---

## 2. Cursor 工作顺序

Cursor 在生成任何新页面前，必须按顺序读取：

1. `AGENTS.md`
2. `specs/INDEX.md`
3. `docs/cursor/01-ai-os-design-principles.md`
4. `docs/cursor/02-page-spec-template.md`
5. 当前功能对应的 `docs/prd/<feature>.md` 或用户提供的需求
6. 相关模块目录：
   - `modules/<domain>/`
   - `app/[lang]/(dashboard)/<route>/`

禁止跳过 Page Spec 直接写 React 代码。

---

## 3. 默认落点规则

### 页面路由

新 Dashboard 页面默认放在：

```txt
app/[lang]/(dashboard)/<feature>/page.tsx
````

自动继承：

* 登录认证
* Header
* Sidebar
* Footer
* ThemeCustomize
* GlobalCopilotProvider

不要修改：

* `app/[lang]/layout.tsx`
* `app/[lang]/(dashboard)/layout.tsx`
* `provider/*`

除非 PRD 明确要求。

---

### 业务模块

业务代码默认放在：

```txt
modules/<domain>/
├── index.ts
├── pages/
├── components/
├── hooks/
├── services/
├── types/
├── mocks/
└── schemas/
```

页面只做挂载，不堆业务逻辑。

---

## 4. 技术栈硬约束

必须使用：

* React 18
* TypeScript
* Next.js App Router
* Tailwind CSS
* shadcn/ui 本地组件
* lucide-react
* react-hook-form
* zod
* Zustand
* React Query

禁止使用：

* AntD
* MUI
* Chakra
* Bootstrap
* 未经确认的新 UI 库
* 页面内硬编码颜色
* 大段 inline style

---

## 5. 页面生成硬性要求

每个新页面必须包含：

* PageHeader
* 主内容区
* Empty 状态
* Loading 状态
* Error 状态
* Forbidden 状态
* 权限控制点
* 操作分级
* 数据类型定义
* mock 数据
* API service 占位
* 可替换为真实接口的数据层

涉及 AI 的页面还必须包含：

* Prompt / 输入区
* 上下文区
* 执行状态区
* 输出结果区
* 引用来源区
* Retry / Feedback 操作
* 执行日志或 Timeline

````

---

# 三、AI OS Design 原则文档

## `docs/cursor/01-ai-os-design-principles.md`

```md
# AI OS Portal Design Principles

## 1. 产品气质

ai-os-portal 是企业级 AI Work 操作系统。

页面风格必须：

- 专业
- 克制
- 高信息密度
- 强状态感
- 强任务导向
- 强可追踪性

避免：

- Dribbble 风格
- 营销官网风格
- 大面积渐变装饰
- 纯卡片堆叠
- 没有业务动作的展示型页面

---

## 2. 页面设计优先级

所有页面必须按以下顺序设计：

1. 信息架构
2. 角色与权限
3. 业务对象
4. 页面区块
5. 状态与交互
6. 组件拆分
7. 最后才是代码

Cursor 不允许直接从需求跳到 JSX。

---

## 3. 标准页面骨架

复杂页面默认使用：

```txt
Page
├── PageHeader
│   ├── title
│   ├── description
│   ├── breadcrumb
│   └── primary action
├── FilterBar / Toolbar
├── Summary / KPI / Status Overview
├── MainContent
│   ├── DataTable / CardGrid / Chat / Flow / Editor
│   └── Pagination / Infinite Scroll
├── RightDrawer / DetailPanel
└── BottomActionBar，可选
````

---

## 4. 操作分级

### Primary

每页最多一个主操作，例如：

* 新建任务
* 创建 Agent
* 运行 Workflow
* 上传文档
* 发起审批

### Secondary

用于辅助操作：

* 刷新
* 导出
* 筛选
* 查看详情
* 复制
* 重试

### Danger

必须二次确认：

* 删除
* 停止运行
* 撤销审批
* 清空记忆
* 禁用 Agent

---

## 5. AI Work 页面特殊结构

涉及 AI Agent、Copilot、Workflow、任务执行时，页面必须包含：

```txt
AIWorkPage
├── UserInputArea
│   ├── prompt
│   ├── variable form
│   └── attachments
├── ContextArea
│   ├── selected files
│   ├── related knowledge
│   └── previous results
├── ExecutionStateArea
│   ├── running status
│   ├── steps
│   ├── logs
│   └── errors
├── ResultArea
│   ├── summary
│   ├── structured result
│   ├── citations
│   └── export actions
└── FeedbackArea
    ├── like
    ├── retry
    ├── edit
    └── approve
```

---

## 6. Tailwind 与颜色规则

必须使用语义 token：

* `bg-background`
* `bg-card`
* `text-foreground`
* `text-muted-foreground`
* `border-border`
* `bg-primary`
* `text-primary-foreground`
* `text-destructive`

禁止：

* `bg-blue-500`
* `text-gray-600`
* `border-slate-200`
* 任意硬编码 hex
* 任意随机渐变

---

## 7. 密度规则

企业后台页面默认使用：

* 页面 padding：`p-6`
* 卡片 padding：`p-4` 或 `p-6`
* 表格文本：`text-sm`
* 元信息：`text-xs text-muted-foreground`
* 区块间距：`gap-4` 或 `gap-6`

不要使用过大的留白。
不要把一个简单状态拆成巨大装饰卡片。

---

## 8. 质量底线

页面生成后必须能回答：

1. 用户是谁？
2. 他能做什么？
3. 当前对象是什么状态？
4. 下一步操作是什么？
5. AI 在做什么？
6. 结果从哪里来？
7. 出错后怎么恢复？
8. 没权限时看到什么？

````

---

# 四、Page Spec 模板

## `docs/cursor/02-page-spec-template.md`

```md
# Page Spec Template

> Cursor 必须先生成或读取 Page Spec，再写代码。

## 1. 页面名称

例如：Agent Task Center

## 2. 页面目标

说明这个页面解决什么业务问题。

## 3. 使用角色

列出角色与权限差异：

| 角色 | 可见数据 | 可执行操作 |
|---|---|---|
| 普通员工 | 自己创建/参与的任务 | 新建、查看、反馈 |
| 主管 | 部门任务 | 审核、分派、追踪 |
| 运营 | 全部 Agent 任务 | 重试、配置、查看日志 |
| 管理员 | 全部数据 | 权限、审计、禁用 |

## 4. 核心业务对象

定义页面围绕什么对象展开。

示例：

```ts
export type AgentTask = {
  id: string;
  title: string;
  taskType: "chat" | "workflow" | "document" | "approval" | "tool";
  status: "draft" | "pending" | "running" | "success" | "failed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  ownerId: string;
  ownerName: string;
  agentId?: string;
  agentName?: string;
  executionState?: "queued" | "planning" | "executing" | "waiting_human" | "completed" | "error";
  resultSummary?: string;
  createdAt: string;
  updatedAt: string;
};
````

## 5. 信息架构 IA

```txt
Page
├── Header
├── Filters
├── Summary
├── MainList
├── DetailDrawer
└── Audit / Timeline
```

## 6. 页面区块

### 6.1 PageHeader

* title
* description
* breadcrumb
* primary action

### 6.2 FilterBar

* keyword
* status
* owner
* agent
* date range
* priority

### 6.3 MainContent

说明用 Table、Card、Chat、Flow、Editor 还是 Split Panel。

### 6.4 DetailDrawer

说明点击行后展示什么详情。

### 6.5 AI Context

如果页面涉及 AI，必须说明上下文来源。

## 7. 操作设计

| 操作   | 类型        | 入口     | 权限        | 结果        |
| ---- | --------- | ------ | --------- | --------- |
| 新建   | Primary   | Header | employee+ | 打开创建表单    |
| 查看详情 | Secondary | Row    | all       | 打开 Drawer |
| 重试   | Secondary | Row    | operator+ | 重新执行      |
| 删除   | Danger    | Row    | admin     | 二次确认      |

## 8. 状态设计

必须覆盖：

* Empty
* Loading
* Error
* Forbidden
* Running
* Partial Success
* No Permission Action

## 9. 数据来源

```txt
GET /api/<domain>/<resource>
POST /api/<domain>/<resource>
PATCH /api/<domain>/<resource>/:id
DELETE /api/<domain>/<resource>/:id
```

没有真实接口时，必须先提供：

* `services/*.ts`
* `mocks/*.ts`
* `types/*.ts`

## 10. 组件拆分

```txt
modules/<domain>/
├── pages/<FeaturePage>.tsx
├── components/
│   ├── <feature>-page-header.tsx
│   ├── <feature>-filter-bar.tsx
│   ├── <feature>-table.tsx
│   ├── <feature>-detail-drawer.tsx
│   ├── <feature>-empty-state.tsx
│   └── <feature>-status-badge.tsx
├── hooks/
│   └── use-<feature>.ts
├── services/
│   └── <feature>-service.ts
├── types/
│   └── <feature>.ts
└── mocks/
    └── <feature>-mock.ts
```

## 11. 验收标准

* 页面能挂载到 Dashboard Layout
* 不修改全局 Provider
* 不修改 components/ui
* 所有状态可见
* 所有数据类型明确
* 可替换真实接口
* 权限点明确

````

---

# 五、组件契约文档

## `docs/cursor/03-component-contract.md`

```md
# AI OS Component Contract

## 1. 组件分层

### Level 1：基础 UI

位置：

```txt
components/ui/
````

来源：shadcn/ui / Radix UI / Tailwind / CVA。

规则：

* 只复用
* 不魔改
* 不为单个业务改基础组件
* 不在这里写业务逻辑

---

### Level 2：平台通用组件

建议位置：

```txt
components/ai-os/
```

用于沉淀跨模块复用组件。

建议新增：

```txt
components/ai-os/
├── page-header.tsx
├── filter-bar.tsx
├── status-badge.tsx
├── empty-state.tsx
├── loading-block.tsx
├── error-state.tsx
├── forbidden-state.tsx
├── right-drawer.tsx
├── form-section.tsx
├── execution-timeline.tsx
├── result-card.tsx
└── audit-info.tsx
```

---

### Level 3：模块业务组件

位置：

```txt
modules/<domain>/components/
```

用于具体业务页面。

例如：

```txt
modules/finance/components/
modules/hermes/components/
modules/documents/components/
modules/agents/components/
```

---

## 2. 推荐平台组件定义

### PageHeader

用途：页面标题、描述、面包屑、主操作。

Props：

```ts
export type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  meta?: React.ReactNode;
};
```

---

### FilterBar

用途：列表页筛选区。

Props：

```ts
export type FilterBarProps = {
  keyword?: string;
  onKeywordChange?: (value: string) => void;
  children?: React.ReactNode;
  actions?: React.ReactNode;
};
```

---

### StatusBadge

用途：统一状态展示。

Props：

```ts
export type StatusBadgeProps = {
  status:
    | "draft"
    | "pending"
    | "running"
    | "success"
    | "failed"
    | "cancelled"
    | "archived"
    | "forbidden";
  label?: string;
};
```

---

### EmptyState

用途：空状态。

Props：

```ts
export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};
```

---

### RightDrawer

用途：详情、审批、编辑、执行日志。

底层优先使用：

```txt
components/ui/sheet.tsx
```

---

### ExecutionTimeline

用途：AI 执行步骤、Workflow 节点、审批流、审计日志。

数据结构：

```ts
export type ExecutionStep = {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "running" | "success" | "failed" | "skipped";
  actor?: string;
  startedAt?: string;
  finishedAt?: string;
  logs?: string[];
};
```

---

## 3. Cursor 生成组件规则

Cursor 生成业务组件时必须：

1. 先查 `components/ui/` 是否已有基础组件。
2. 再查 `components/ai-os/` 是否已有平台组件。
3. 最后才在 `modules/<domain>/components/` 新建业务组件。
4. 不允许把业务组件放进 `components/ui/`。
5. 组件必须 props 类型明确。
6. 复杂组件必须拆分，不允许单文件超过 300 行。

````

---

# 六、shadcn/ui 使用规则

## `docs/cursor/04-shadcn-ui-rules.md`

```md
# shadcn/ui Usage Rules

## 1. 导入规则

必须从本地导入：

```ts
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
````

禁止：

```ts
import { Button } from "shadcn/ui";
import Button from "antd";
import { Button } from "@mui/material";
```

---

## 2. 已有组件优先级

项目已有 50+ shadcn/ui 基础组件，生成页面前必须优先检查：

* Button
* Card
* Badge
* Table
* Sheet
* Dialog
* AlertDialog
* DropdownMenu
* Select
* Input
* Textarea
* Form
* Tabs
* Skeleton
* Timeline
* Tooltip
* Command

---

## 3. 表单规则

复杂表单必须使用：

* react-hook-form
* zod
* `components/ui/form.tsx`

禁止裸写大量 uncontrolled input。

---

## 4. 删除确认规则

删除类操作优先使用已有组件：

```txt
components/delete-confirmation-dialog.tsx
```

不要重复生成确认弹窗。

---

## 5. 日期范围规则

日期范围选择优先使用：

```txt
components/date-picker-with-range.tsx
```

---

## 6. Sheet / Drawer 规则

右侧详情面板使用：

```txt
components/ui/sheet.tsx
```

不要用 Dialog 承载复杂详情页。

---

## 7. Toast 规则

项目存在多套 Toast。
新业务页面优先使用已有封装，不要再引入新的 Toast 库。

---

## 8. 禁止行为

禁止：

* 修改 `components/ui/`
* 新增重复基础组件
* 硬编码颜色
* 直接复制外部组件库代码
* 引入新的设计系统

````

你们现有组件清单已经覆盖 Button、Card、Table、Sheet、Dialog、Form、Skeleton、Timeline、Tree、Command 等基础能力，且业务组件中已有 `DeleteConfirmationDialog`、`DatePickerWithRange`、文件组件、任务看板组件可复用。:contentReference[oaicite:3]{index=3} :contentReference[oaicite:4]{index=4}

---

# 七、表格页规则

## `docs/cursor/05-table-page-rules.md`

```md
# Table Page Rules

## 1. 适用场景

以下页面必须优先使用 DataTable 模式：

- 任务列表
- Agent 列表
- Workflow 列表
- 知识库文档列表
- 文件列表
- 审批列表
- 审计日志
- 用户管理
- 权限管理
- 财务数据列表

---

## 2. 文件拆分

```txt
modules/<domain>/
├── pages/<FeatureListPage>.tsx
├── components/
│   ├── <feature>-table.tsx
│   ├── <feature>-columns.tsx
│   ├── <feature>-table-toolbar.tsx
│   ├── <feature>-table-pagination.tsx
│   ├── <feature>-row-actions.tsx
│   └── <feature>-detail-drawer.tsx
├── hooks/
│   └── use-<feature>-table.ts
├── types/
│   └── <feature>.ts
├── services/
│   └── <feature>-service.ts
└── mocks/
    └── <feature>-mock.ts
````

---

## 3. 必备能力

表格页必须包含：

* 关键词搜索
* 状态筛选
* 排序
* 分页
* 行操作
* 批量操作，可选
* 列显隐，可选
* Empty
* Loading
* Error
* Forbidden

---

## 4. 状态字段

表格业务对象建议包含：

```ts
export type BaseListItem = {
  id: string;
  name: string;
  status: string;
  owner?: string;
  priority?: string;
  createdAt: string;
  updatedAt: string;
};
```

---

## 5. Row Action 规则

行操作必须分级：

```txt
View Detail     secondary
Edit            secondary
Retry           secondary
Archive         secondary
Delete          danger
```

Danger 操作必须二次确认。

---

## 6. 服务端准备

即使当前使用 mock，也必须按服务端分页设计：

```ts
export type ListQuery = {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type ListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
```

````

项目中已经有项目列表 DataTable 的参考实现，包括 `columns.tsx`、`data-table-toolbar.tsx`、分面筛选、列头排序、列显隐等，Cursor 应优先参考这类既有实现，而不是重新设计表格结构。:contentReference[oaicite:5]{index=5}

---

# 八、AI 页面规则

## `docs/cursor/06-ai-page-rules.md`

```md
# AI Work Page Rules

## 1. 适用场景

以下页面属于 AI Work 页面：

- Agent 工作页
- Copilot 页面
- Workflow 执行页
- Hermes Dashboard
- AI 文档处理页
- AI 表格处理页
- 知识库问答页
- 自动化任务执行页

---

## 2. 必备区块

```txt
AIWorkPage
├── PageHeader
├── ContextPanel
├── PromptInput / TaskForm
├── ExecutionStatus
├── ExecutionTimeline
├── ResultPanel
├── SourceReferences
├── FeedbackActions
└── AuditInfo
````

---

## 3. Copilot 接入规则

项目已有全局 CopilotKit Provider。

禁止修改：

* `app/[lang]/layout.tsx`
* `provider/*`
* 全局 Copilot Provider

页面级上下文通过 page context 注册。

优先使用：

```txt
ai/registry/page-context-registry.ts
ai/hooks/usePageCopilotContext.ts
ai/components/CopilotSessionPanel.tsx
```

---

## 4. AI 状态模型

```ts
export type AiExecutionState =
  | "idle"
  | "queued"
  | "planning"
  | "running"
  | "waiting_human"
  | "completed"
  | "failed"
  | "cancelled";

export type AiExecutionStep = {
  id: string;
  title: string;
  status: AiExecutionState;
  agentName?: string;
  startedAt?: string;
  finishedAt?: string;
  message?: string;
  logs?: string[];
};
```

---

## 5. AI 结果模型

```ts
export type AiResult = {
  id: string;
  summary: string;
  content?: string;
  structuredData?: unknown;
  sources?: Array<{
    id: string;
    title: string;
    type: "file" | "url" | "knowledge" | "tool";
    url?: string;
  }>;
  confidence?: number;
  createdAt: string;
};
```

---

## 6. 用户反馈

AI 输出必须提供至少一种反馈：

* Like / Dislike
* Retry
* Edit Prompt
* Copy
* Export
* Approve
* Reject

---

## 7. 长任务规则

长任务必须显示：

* 当前状态
* 当前步骤
* 已耗时
* 可取消动作
* 错误恢复动作

````

你们当前全局 Layout 已经在 Root Layout 中挂载 `GlobalCopilotProvider`，并通过 `/api/copilot` 连接运行时；Dashboard Layout 里还会根据 Copilot 侧边栏打开状态调整内容区右边距。:contentReference[oaicite:6]{index=6} :contentReference[oaicite:7]{index=7}

---

# 九、状态设计规则

## `docs/cursor/07-state-design-rules.md`

```md
# State Design Rules

## 1. 每个页面必须覆盖的状态

```txt
normal
loading
empty
error
forbidden
partial
saving
running
````

---

## 2. Loading

列表页：

* 使用 Skeleton
* 保持页面结构不跳动

详情页：

* Header 保留
* 内容区 skeleton

AI 执行页：

* 显示执行中状态
* 显示当前 step

---

## 3. Empty

空状态必须说明：

* 当前为什么为空
* 用户下一步能做什么
* 是否需要权限

示例：

```txt
当前还没有 Agent 任务。
你可以创建第一个任务，或从 Workflow 模板发起执行。
```

---

## 4. Error

错误状态必须包含：

* 错误标题
* 错误描述
* 重试按钮
* 可选错误码

---

## 5. Forbidden

权限不足不能只显示空白页。

必须显示：

* 无权限说明
* 当前角色
* 需要的权限
* 返回按钮
* 申请权限入口，可选

---

## 6. Running

AI 任务运行中必须显示：

* 当前状态
* 当前步骤
* 日志或 Timeline
* 取消按钮，可选
* 刷新按钮

---

## 7. Partial Success

部分成功必须显示：

* 成功数量
* 失败数量
* 失败原因
* 重试失败项

````

---

# 十、Cursor 页面生成 Prompt

## `docs/cursor/08-page-generation-prompt.md`

```md
# Cursor Page Generation Prompt

当用户提出新功能页面需求时，使用以下 Prompt。

---

你是 ai-os-portal 的 React18 + TypeScript + shadcn/ui 前端工程师。

请先读取：

1. `AGENTS.md`
2. `specs/INDEX.md`
3. `docs/cursor/01-ai-os-design-principles.md`
4. `docs/cursor/02-page-spec-template.md`
5. `docs/cursor/03-component-contract.md`
6. `docs/cursor/04-shadcn-ui-rules.md`
7. 当前功能 PRD 或用户需求

然后按以下顺序执行：

## Step 1：生成 Page Spec

不要直接写代码。
先输出当前页面的 Page Spec，包含：

- 页面目标
- 使用角色
- 核心业务场景
- 信息架构
- 页面区块
- 操作分级
- 状态设计
- 数据结构
- 组件拆分
- 文件落点

## Step 2：生成文件计划

输出要新增或修改的文件列表。

必须遵守：

- 页面挂载在 `app/[lang]/(dashboard)/<route>/page.tsx`
- 业务代码放在 `modules/<domain>/`
- 不修改 `components/ui/`
- 不修改全局 Provider
- 不修改 Dashboard Layout

## Step 3：生成代码

按文件生成代码。

要求：

- TypeScript 类型完整
- 使用 shadcn/ui 本地组件
- 使用 Tailwind semantic token
- 使用 mock 数据
- service 层可替换真实 API
- 状态覆盖完整
- 不引入新 UI 库

## Step 4：自检

输出 DoD 检查结果。

如果不满足 DoD，继续修正。
````

---

# 十一、UI 质量验收清单

## `docs/cursor/09-ui-quality-dod.md`

```md
# UI Quality DoD

## 1. 架构检查

- [ ] 页面文件只做挂载，不堆业务逻辑
- [ ] 业务代码在 `modules/<domain>/`
- [ ] 类型在 `types/`
- [ ] mock 在 `mocks/`
- [ ] API 占位在 `services/`
- [ ] hook 在 `hooks/`

## 2. Layout 检查

- [ ] 页面进入 `app/[lang]/(dashboard)/`
- [ ] 没有修改 Dashboard Layout
- [ ] 没有修改 Root Layout
- [ ] 没有修改 Provider

## 3. UI 检查

- [ ] 使用 shadcn/ui 本地组件
- [ ] 没有引入 AntD/MUI
- [ ] 没有硬编码颜色
- [ ] 使用 `bg-background` / `bg-card` / `text-muted-foreground` 等语义 token
- [ ] 页面密度符合企业后台
- [ ] 主操作清晰
- [ ] 危险操作有确认

## 4. 状态检查

- [ ] Loading
- [ ] Empty
- [ ] Error
- [ ] Forbidden
- [ ] Running，如适用
- [ ] Partial Success，如适用

## 5. 数据检查

- [ ] 类型定义完整
- [ ] mock 数据完整
- [ ] service 层可替换真实 API
- [ ] 列表支持分页/筛选/排序，如适用
- [ ] 行 ID 使用业务 id，不使用 index

## 6. AI Work 检查

适用于 AI 页面：

- [ ] 有 Prompt / 输入区
- [ ] 有上下文区
- [ ] 有执行状态区
- [ ] 有结果区
- [ ] 有来源引用
- [ ] 有 Retry / Feedback
- [ ] 有执行 Timeline 或日志

## 7. 可维护性检查

- [ ] 单文件不超过 300 行，特殊情况除外
- [ ] 组件命名清晰
- [ ] props 类型明确
- [ ] 没有重复造基础组件
- [ ] 没有把业务逻辑写入 `components/ui/`
```

---

# 十二、`.cursor/rules` 规则文件

## `.cursor/rules/10-ai-os-design.mdc`

```md
---
description: AI OS Portal design rules
globs:
  - "app/[lang]/(dashboard)/**/*.tsx"
  - "modules/**/*.tsx"
alwaysApply: true
---

You are working in ai-os-portal, an enterprise AI Work operating system.

Before generating UI, follow:

- Read `docs/cursor/01-ai-os-design-principles.md`.
- Do not generate marketing-style UI.
- Do not generate decorative card-only pages.
- Prefer structured enterprise layouts.
- Every page must expose business object, status, owner, time, and next action.
- Use semantic Tailwind tokens only.
- Do not hardcode raw colors.
```

## `.cursor/rules/20-page-spec-first.mdc`

```md
---
description: Page Spec first rule
globs:
  - "app/[lang]/(dashboard)/**/*.tsx"
  - "modules/**/*.tsx"
alwaysApply: true
---

For any new feature page:

1. Generate or read Page Spec first.
2. Do not write React code before Page Spec.
3. Page Spec must include:
   - page goal
   - roles
   - business object
   - information architecture
   - blocks
   - actions
   - states
   - data fields
   - component split
   - file locations
```

## `.cursor/rules/30-shadcn-ui-only.mdc`

```md
---
description: shadcn/ui only
globs:
  - "**/*.tsx"
alwaysApply: true
---

Use local shadcn/ui components from `@/components/ui/*`.

Forbidden:

- antd
- @mui/material
- chakra-ui
- bootstrap
- external UI kits

Do not modify `components/ui/` unless explicitly requested.
If a business component is needed, create it under `modules/<domain>/components/`.
```

## `.cursor/rules/40-module-boundary.mdc`

```md
---
description: Module boundary rules
globs:
  - "modules/**/*.ts"
  - "modules/**/*.tsx"
  - "app/[lang]/(dashboard)/**/*.tsx"
alwaysApply: true
---

Business code belongs in `modules/<domain>/`.

Route files under `app/[lang]/(dashboard)/` should only mount module pages.

Default module structure:

modules/<domain>/
├── index.ts
├── pages/
├── components/
├── hooks/
├── services/
├── types/
├── mocks/
└── schemas/

Do not modify:

- `app/[lang]/layout.tsx`
- `app/[lang]/(dashboard)/layout.tsx`
- `provider/*`

unless the PRD explicitly requires it.
```

## `.cursor/rules/50-state-design.mdc`

```md
---
description: Required UI states
globs:
  - "modules/**/*.tsx"
alwaysApply: true
---

Every page must implement:

- Loading
- Empty
- Error
- Forbidden

AI execution pages must also implement:

- Running
- Waiting human
- Failed
- Retry
- Feedback
```

## `.cursor/rules/60-ai-work-page.mdc`

```md
---
description: AI Work page structure
globs:
  - "modules/hermes/**/*.tsx"
  - "modules/finance/**/*.tsx"
  - "modules/**/*.tsx"
alwaysApply: false
---

For AI-related pages, include:

- input / prompt area
- context area
- execution status
- execution timeline
- result panel
- source references
- feedback actions
- audit info

Use existing Copilot provider. Do not change global provider or layout.
```

---

# 十三、把现有 AGENTS.md 升级一段

建议在现有 `AGENTS.md` 里追加：

````md
## 七、页面生成质量入口

当任务涉及新增页面、重构页面、生成 UI、增加功能模块时，Agent 必须额外读取：

```txt
docs/cursor/00-cursor-entry.md
docs/cursor/01-ai-os-design-principles.md
docs/cursor/02-page-spec-template.md
docs/cursor/03-component-contract.md
docs/cursor/09-ui-quality-dod.md
````

如果是表格页，额外读取：

```txt
docs/cursor/05-table-page-rules.md
```

如果是 AI Agent / Copilot / Workflow 页面，额外读取：

```txt
docs/cursor/06-ai-page-rules.md
```

硬性规则：

1. 不允许跳过 Page Spec 直接写页面。
2. 不允许修改 `components/ui/`。
3. 不允许修改全局 Layout / Provider。
4. 新业务默认进入 `modules/<domain>/`。
5. 页面挂载层只做 import + render。
6. 每个页面必须通过 `docs/cursor/09-ui-quality-dod.md` 自检。

````

这段与现有 AGENTS.md 的“入口 → 索引 → 按需加载”策略一致，不会破坏原来的 token 节流机制。:contentReference[oaicite:8]{index=8}

---

# 十四、推荐 Cursor 执行方式

以后你给 Cursor 的任务不要写成：

```txt
帮我做一个 Agent 管理页面
````

改成：

```txt
请按 ai-os-portal 的页面生成规范实现 Agent 管理页面。

必须先读取：
- AGENTS.md
- specs/INDEX.md
- docs/cursor/00-cursor-entry.md
- docs/cursor/01-ai-os-design-principles.md
- docs/cursor/02-page-spec-template.md
- docs/cursor/03-component-contract.md
- docs/cursor/09-ui-quality-dod.md

要求：
1. 先输出 Page Spec。
2. 再输出文件计划。
3. 页面挂载在 app/[lang]/(dashboard)/agents/page.tsx。
4. 业务代码放在 modules/agents/。
5. 不修改 components/ui。
6. 不修改 layout/provider。
7. 使用 shadcn/ui + Tailwind semantic token。
8. 覆盖 Loading / Empty / Error / Forbidden。
9. 最后按 DoD 自检。
```

---

# 十五、这套文档解决的问题

| 当前问题           | 这套文档的约束                 |
| -------------- | ----------------------- |
| Cursor 直接写 JSX | 强制 Page Spec First      |
| 页面风格不一致        | AI OS Design Principles |
| 反复造组件          | Component Contract      |
| 改坏 shadcn/ui   | shadcn/ui Rules         |
| 表格页质量不稳定       | Table Page Rules        |
| AI 页面没有执行过程    | AI Work Page Rules      |
| 忘记空/错/权限状态     | State Design Rules      |
| 新功能不知道放哪里      | Module Boundary Rules   |
| 代码审查无标准        | UI Quality DoD          |

核心是：**让 Cursor 从“代码生成器”变成“按设计系统和页面规格执行的前端 Agent”。**
