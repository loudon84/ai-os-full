# Email 模块扩展 PRD — Phase 2: AI 工作台

> 版本：v1.1 | 日期：2026-05-11
> 状态：方案确认
> 前置文档：`docs/prd/email/core_email_prd.md`（Phase 1 后端契约）· `docs/prd/email/extend_with_react.md`（React Email 引入评估）
> 关联文档：`frontend/specs/layout-structure.md`（Layout 母版）· `AGENTS.md`（Agent 工作手册）

---

## 1. 概述

### 1.1 目标

在 Phase 1（邮箱连接 + SMTP/IMAP 收发）基础上，扩展 Email 模块，实现：

1. **邮件阅读工作台** — 独立 workspace 风格的三栏布局，将邮件内容接入 AI
2. **邮件编辑工作台** — 独立 workspace 风格的撰写/回复/转发，Tiptap 替换 Quill + AI 辅助
3. **一键触发 Agent 任务** — 基于选中邮件上下文触发特定 Agent（摘要/回复/翻译/任务提取）

### 1.2 用户故事

```
作为一名已绑定邮箱的 Portal 用户
我希望在邮件阅读时能一键调用 AI 生成摘要、回复草稿、翻译、任务提取
以便高效处理大量邮件而不需要逐封手动阅读和回复
```

### 1.3 不做什么（Non-Goals）

| 不做 | 原因 |
|------|------|
| 邮件模板管理 CRUD | Phase 3，见 §9 未来规划 |
| 撰写时选择模板 + 变量填充 | Phase 3，依赖模板系统 |
| `@react-email/editor` 可视化拖拽编辑器 | Phase 3 评估 |
| 新建 CopilotKit Provider | 复用全局 `GlobalCopilotProvider`，禁止新建 |
| 营销邮件批量发送 | 不在 Phase 2 范围 |
| 邮件签名管理 | Phase 3 |
| IMAP IDLE 实时推送 | Phase 2 继续使用轮询 |

---

## 2. Phase 1 现状分析

### 2.1 已完成能力

| 能力 | 实现位置 |
|------|---------|
| 邮箱账号 CRUD + 连接测试 | `EmailAccountForm` / `EmailAccountService` |
| IMAP/POP3 收件 + SMTP 发件 | `ImapProvider` / `Pop3Provider` / `SmtpSenderService` |
| 邮件列表/搜索/筛选 | `EmailList` + `EmailHeader` |
| 邮件详情查看 | `EmailDetail`（iframe sandbox 渲染 HTML） |
| 撰写邮件（Quill 编辑器） | `EmailComposeForm`（浮窗 Card） |
| 文件夹导航 + 未读计数 | `EmailSidebarNav` |
| 增量同步 + 手动同步 | `EmailSyncService` / `use-email-sync` |
| 凭证 AES-256 加密 | `CredentialCryptoService` |
| 附件下载 | `EmailAttachmentList` + Bearer fetch |
| 独立路由壳 | `WorkspaceLayoutProvider` → `/[lang]/email/` |

### 2.2 标记「后续」未完成

| 能力 | 代码标记 | 目标阶段 |
|------|---------|---------|
| 回复/转发 | `EmailDetail` 按钮 disabled | Phase 2-A |
| 批量操作（归档/删除/移动） | `EmailHeader` 按钮 disabled | Phase 2-A |
| 邮件线程合并 | 未实现 | Phase 2-A |
| AI 邮件摘要/回复生成 | 未实现 | Phase 2-B |
| 草稿自动保存 | 未实现 | Phase 2-A |
| 邮件模板 | 未实现 | Phase 3 |

### 2.3 当前布局问题

当前 `EmailWorkspace` 采用二栏 `ResizablePanelGroup`（左 SidebarNav + 右 邮件列表/详情共用面板）：

- 邮件详情与列表**在同一面板内互斥切换** —— 阅读时看不到列表
- `EmailComposeForm` 是 absolute 浮窗 Card —— 无法做沉浸式编辑工作台
- 没有右侧 AI Panel 位置 —— 无法接入 Copilot / Agent 任务触发
- `EmailDetail` 只有查看功能，回复/转发按钮 disabled

---

## 3. Layout Decision

### 3.1 邮件主工作区（改造现有）

| 项目 | 决定 |
|------|------|
| route type | standalone route: `app/[lang]/email/`（existing） |
| selected page template | `AgentWorkspaceTemplate` —— 需要 AI 面板 |
| shell inheritance | Header: YES · Sidebar: NO · Footer: NO · ThemeCustomize: YES · Auth: YES · i18n: YES · GlobalCopilotProvider: YES（不新建） |
| layout files | 现有 `app/[lang]/email/layout.tsx` 复用 · 修改 `EmailWorkspace` 内部结构 |
| Copilot behavior | 注册邮件页面上下文 + 使用全局 Copilot Sidebar，不创建新 Provider |
| forbidden changes | 不修改 `app/[lang]/layout.tsx` / `(dashboard)/layout.tsx` / `provider/*` / `components/ui/*` |

---

## 4. 功能设计

### 4.1 Feature 1: 邮件阅读工作台

#### 目标

将邮件详情从「列表内置切换」升级为 workspace 风格三栏布局，提供足够空间接入 AI。

#### 布局结构

参考 `AgentWorkspaceTemplate`（`specs/layout-structure.md` §14.3）：

```
┌─────────────────────────────────────────────────────────────────┐
│  WorkspaceLayoutProvider (Header)                                │
├────────────┬───────────────────────────────┬────────────────────┤
│  FolderNav │  Content Area                 │  AI Panel          │
│  (固定宽)   │  ┌─ EmailList (上) ──────────┐│  (可折叠右侧面板)   │
│            │  │  邮件列表                   ││                    │
│ isCollapsed│  ├─ EmailDetailPane (下) ─────┤│  · 邮件摘要        │
│ responsive │  │  邮件正文/附件/操作栏       ││  · AI 回复草稿     │
│            │  │  (含 回复/转发 ActionBar)  ││  · Agent 任务      │
│            │  └────────────────────────────┘│  · 上下文信息      │
├────────────┴───────────────────────────────┴────────────────────┤
│  ResizablePanelGroup (horizontal) → 3 panels                    │
└─────────────────────────────────────────────────────────────────┘
```

#### 改造要点

1. `EmailWorkspace` 的 `ResizablePanelGroup` 从 2 栏扩展到 3 栏：
   - Panel 1: `EmailSidebarNav`（已有，不变）
   - Panel 2: 邮件列表 + 邮件详情（垂直分割或互斥，由视口宽度决定）
   - Panel 3: `EmailAIPanel`（新增，右侧可折叠面板）

2. 响应式策略：
   - **宽屏 (>=1536px)**：上方列表 + 下方详情预览（Outlook 风格）
   - **中等宽度 (1280–1536px)**：保持现有互斥切换
   - **窄屏 (<1280px)**：保持现有移动端适配

3. `EmailDetail` 改造：
   - 解锁回复/转发按钮 → 点击后进入编辑工作台
   - 新增 ActionBar: 回复 / 转发 / AI 摘要 / 创建任务 / 标记
   - 新增 `EmailThreadView`：同线程邮件折叠展示（基于 `in_reply_to` / `references`）

#### 新增组件

```
modules/email/components/
├── email-ai-panel.tsx          # 右侧 AI 面板
├── email-action-bar.tsx        # 邮件操作工具栏
├── email-thread-view.tsx       # 线程展示
└── email-detail-pane.tsx       # 阅读工作台详情区（包裹 EmailDetail + ActionBar）
```

---

### 4.2 Feature 2: 邮件编辑工作台

#### 目标

将浮窗式 `EmailComposeForm` 升级为独立的全屏编辑工作台，用 Tiptap 替换 Quill。

#### 布局结构

```
┌─────────────────────────────────────────────────────────────────┐
│  ComposeHeader (收件人/抄送/主题 + 工具栏)                       │
├───────────────────────────────────┬─────────────────────────────┤
│  TiptapEditor                     │  AI Compose Panel           │
│  (替换 Quill)                     │  (右侧可折叠)                │
│                                   │                             │
│  · 富文本编辑                      │  · AI 改写/润色             │
│  · 附件条                         │  · 翻译                     │
│  · 引用原文（回复/转发）            │  · 语气调整                  │
│                                   │  · Agent 辅助写作            │
├───────────────────────────────────┴─────────────────────────────┤
│  BottomBar: [附件] [发送] [保存草稿]                              │
└─────────────────────────────────────────────────────────────────┘
```

#### 编辑器选型：Tiptap 替换 Quill

**选择 Tiptap 的理由：**

| 维度 | Quill（现有） | Tiptap（目标） |
|------|-------------|---------------|
| AI 内容填入 | hack innerHTML | `editor.commands.setContent(html)` |
| 选区操作 | 受限 | `editor.chain().focus().deleteSelection().insertContent(text).run()` |
| 扩展性 | 插件有限 | Node/Mark/Extension 完全可编程 |
| 与 @react-email/editor 兼容 | 无 | 同为 Tiptap 底座，Phase 3 平滑过渡 |

**Tiptap 用于邮件 HTML 的兼容性判断：**

| 邮件场景 | Tiptap 适配度 | 说明 |
|---------|-------------|------|
| 日常撰写/回复/转发 | ✅ 完全适合 | 输出 `<p>`, `<strong>`, `<a>`, `<ul>` 等语义 HTML，各邮件客户端兼容 |
| 简单模板（纯文本结构） | ✅ 适合 | Phase 3 时 Tiptap 编辑 + 变量占位符 + 后端 `juice` CSS inliner |
| 复杂模板（多列/按钮/品牌） | ❌ 不适合 | 需 table-based HTML，Phase 3 由 React Email 承担 |

**Tiptap 与 React Email 的分层原则（不冲突）：**

```
Tiptap 管编辑 —— 所有「用户可自由修改内容」的场景
React Email 管渲染 —— 所有「结构固定、只填变量」的场景

两者交汇点只有「发送」—— 都输出 html: string 交给 Nodemailer SMTP
不要把 React Email 渲染的 HTML 灌入 Tiptap 编辑器（table 结构会被解析器降级）
```

分层对照表：

```
┌──────────────────────────────────────────────────────────┐
│ 来源 1：用户手写邮件（Tiptap，Phase 2）                    │
│  Tiptap Editor → getHTML() → body_html → SMTP            │
│  不经过 React Email                                      │
├──────────────────────────────────────────────────────────┤
│ 来源 2：模板渲染（React Email，Phase 3）                  │
│  React Email 组件 → render() → html → SMTP               │
│  不经过 Tiptap                                           │
├──────────────────────────────────────────────────────────┤
│ 来源 3：简单模板 + 用户编辑（Phase 3）                    │
│  Tiptap JSON 回填 → 用户编辑 → getHTML() → SMTP          │
│  模板存为 Tiptap JSON，不涉及 React Email                 │
└──────────────────────────────────────────────────────────┘
```

#### 改造要点

1. `react-quilljs` → `@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/extension-link` + `@tiptap/extension-image` 等
2. 编辑模式切换：
   - 浮窗模式（快速回复，保留）
   - 全屏模式（沉浸式撰写，新增）
3. 回复/转发集成：
   - 自动填充 `to`（回复）/ 清空 `to`（转发）
   - 原文作为 `quoteHtml` 拼在编辑器下方（blockquote 引用样式）
   - 正确设置 `in_reply_to` / `references` 字段

#### 新增/修改组件

```
modules/email/components/
├── email-compose-workspace.tsx    # 全屏编辑工作台（新增）
├── email-tiptap-editor.tsx        # Tiptap 编辑器封装（新增）
├── email-compose-ai-panel.tsx     # 撰写 AI 辅助面板（新增）
└── email-compose-form.tsx         # 改造：Tiptap 替换 Quill，增加全屏入口
```

---

### 4.3 Feature 3: 一键触发 Agent 任务

#### 目标

在邮件阅读/编辑工作台的 AI Panel 中，基于当前邮件上下文一键触发特定 Agent 任务。

#### EmailAIPanel 结构

```
EmailAIPanel
├── 上下文区域
│   ├── 当前邮件摘要（自动生成 snippet）
│   ├── 发件人信息
│   ├── 相关线程数（如有）
│   └── 附件列表
│
├── 快捷动作（一键触发）
│   ├── 📝 AI 摘要 — 生成当前邮件 / 线程摘要
│   ├── ✍️ AI 回复 — 基于上下文生成回复草稿
│   ├── 🌐 翻译 — 将邮件正文翻译为目标语言
│   ├── 📋 创建任务 — 从邮件提取任务到项目管理
│   ├── 📊 提取数据 — 提取报价/订单/金额等结构化数据
│   └── 🔄 自定义 Agent — 触发用户配置的自定义 Agent
│
└── 执行结果区域
    ├── Agent 输出流式展示
    ├── 操作按钮（采纳/编辑/重试）
    └── 历史执行记录
```

#### 技术方案

1. 复用全局 `GlobalCopilotProvider`，不新建 CopilotKit Provider
2. `EmailAIPanel` 注册页面上下文（`useCopilotReadable`）：
   - 当前选中邮件的 subject、from、to、textBody、snippet
   - 当前文件夹、账号信息
3. Agent 动作通过 `useCopilotAction` 注册：

| 动作 | Action Name | 输入 | 输出 |
|------|------------|------|------|
| AI 摘要 | `summarize_email` | emailId, textBody | 结构化摘要文本 |
| AI 回复 | `draft_reply` | emailId, context, tone | 回复草稿 HTML |
| 翻译 | `translate_email` | emailId, targetLang | 翻译后文本 |
| 创建任务 | `extract_tasks` | emailId, textBody | 任务项列表 |
| 提取数据 | `extract_data` | emailId, textBody | 结构化数据 JSON |
| 自定义 Agent | `custom_agent` | emailId, agentId, params | Agent 返回结果 |

4. 执行流：

```
用户点击「AI 摘要」
  → useCopilotAction("summarize_email", { emailId, context })
  → CopilotKit Runtime → Hermes LLM
  → 流式返回结果到 EmailAIPanel
  → 用户可复制/采纳/插入到回复
```

#### 新增组件/Hook

```
modules/email/components/
├── email-ai-panel.tsx              # AI 面板主组件
├── email-ai-action-button.tsx      # 单个 Agent 动作按钮
├── email-ai-result-card.tsx        # 执行结果卡片

modules/email/hooks/
├── use-email-copilot-context.ts    # 注册邮件上下文到 Copilot
├── use-email-agent-actions.ts      # 注册 Agent 动作
```

---

## 5. 后端变更汇总

> Phase 2 不涉及后端数据模型新增（模板系统移至 Phase 3）。后端变更仅为支持线程查询和 AI 集成。

### 5.1 修改

| 文件 | 变更 |
|------|------|
| `backend/src/routes/email.ts` | 邮件线程聚合查询端点（可选，基于现有 `in_reply_to` / `references` 字段） |

---

## 6. 前端变更汇总

### 6.1 新增

```
# 组件
modules/email/components/email-ai-panel.tsx
modules/email/components/email-ai-action-button.tsx
modules/email/components/email-ai-result-card.tsx
modules/email/components/email-action-bar.tsx
modules/email/components/email-thread-view.tsx
modules/email/components/email-detail-pane.tsx
modules/email/components/email-compose-workspace.tsx
modules/email/components/email-tiptap-editor.tsx
modules/email/components/email-compose-ai-panel.tsx

# Hook
modules/email/hooks/use-email-copilot-context.ts
modules/email/hooks/use-email-agent-actions.ts
```

### 6.2 修改

| 文件 | 变更 |
|------|------|
| `modules/email/components/email-workspace.tsx` | 三栏改造，新增 AI Panel |
| `modules/email/components/email-detail.tsx` | 解锁回复/转发，ActionBar |
| `modules/email/components/email-compose-form.tsx` | Tiptap 替换 Quill，增加全屏入口 |
| `modules/email/components/email-header.tsx` | 解锁批量操作 |
| `modules/email/index.ts` | 导出更新 |

### 6.3 新增依赖

| 包 | 用途 |
|----|------|
| `@tiptap/react` | Tiptap React 绑定 |
| `@tiptap/starter-kit` | 基础编辑能力（段落/标题/列表/加粗/斜体/代码等） |
| `@tiptap/extension-link` | 链接支持 |
| `@tiptap/extension-image` | 图片插入 |
| `@tiptap/extension-placeholder` | 占位提示文字 |
| `@tiptap/extension-underline` | 下划线 |

### 6.4 移除依赖

| 包 | 原因 |
|----|------|
| `react-quilljs` | 被 Tiptap 替换 |
| `quill` | 被 Tiptap 替换 |

---

## 7. 实施阶段

### Phase 2-A: 基础升级（~1 周）

| Step | 任务 | 产出 |
|------|------|------|
| A1 | Tiptap 替换 Quill | `email-tiptap-editor.tsx`，`email-compose-form.tsx` 改用 Tiptap |
| A2 | 回复/转发功能 | `EmailDetail` 解锁按钮，`EmailComposeForm` 支持 reply/forward 模式 |
| A3 | 邮件线程基础 | 基于 `in_reply_to` / `references` 的简单线程聚合查询 |
| A4 | 批量操作解锁 | `EmailHeader` 按钮解锁，接入已有 `POST /email/messages/actions` |

### Phase 2-B: AI 工作台（~1.5 周）

| Step | 任务 | 产出 |
|------|------|------|
| B1 | `EmailWorkspace` 三栏改造 | 新增右侧 `EmailAIPanel` 可折叠面板 |
| B2 | 注册 Copilot 邮件上下文 | `use-email-copilot-context.ts` |
| B3 | AI 摘要 + AI 回复草稿 | Agent Action 注册 + 流式展示 |
| B4 | 翻译 + 任务提取 | 扩展 Agent Actions |
| B5 | 编辑工作台全屏模式 | `email-compose-workspace.tsx` + AI 撰写面板 |
| B6 | 自定义 Agent 触发入口 | 可配置的 Agent 动作列表 |

---

## 8. 关键技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 编辑器 | Tiptap 替换 Quill | 可编程性强，AI 交互友好，`@react-email/editor` 也基于 Tiptap，Phase 3 可平滑过渡 |
| AI 接入 | 复用全局 CopilotProvider | 禁止新建 Provider（规约），通过 `useCopilotReadable` / `useCopilotAction` 注册 |
| 三栏布局 | ResizablePanelGroup 扩展到 3 panel | 复用现有 Shadcn `ResizablePanel`，右侧 AI Panel 可折叠 |

---

## 9. 未来规划（Phase 3）

以下功能不在 Phase 2 范围，列于此作为后续迭代参考。

### 9.1 邮件模板系统

**概要**：邮件模板管理 CRUD + 撰写时选择模板 + 变量填充。

**预期路由**：`app/[lang]/email/templates/`

**预期 Layout Decision**：

| 项目 | 决定 |
|------|------|
| route type | standalone route: `app/[lang]/email/templates/`（新增） |
| selected page template | `DataManagementTemplate` —— 模板列表管理 |
| shell inheritance | 同邮件主工作区，复用 `email/layout.tsx` |
| layout files | 只需 `page.tsx` |

**数据模型草案**：

```ts
// packages/db/src/schema/email-templates.ts

export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),

  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 100 }),
  category: varchar("category", { length: 32 }).notNull().default("general"),
  description: text("description"),

  subjectTemplate: text("subject_template").notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  bodyJson: jsonb("body_json"),     // Tiptap JSON，用于编辑器回填

  variables: jsonb("variables").notNull().default([]),

  status: varchar("status", { length: 16 }).notNull().default("draft"),
  version: integer("version").notNull().default(1),

  createdBy: uuid("created_by").notNull(),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});
```

**共享类型草案**：

```ts
type EmailTemplateCategory =
  | "general" | "sales" | "purchase" | "finance" | "notification" | "marketing";

type EmailTemplateStatus = "draft" | "published" | "archived";

interface EmailTemplateVariable {
  key: string;
  label: string;
  type: "string" | "number" | "date" | "currency" | "url";
  required: boolean;
  default_value?: string;
  description?: string;
}
```

**API 端点草案**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/email/templates` | 模板列表（分页/筛选/搜索） |
| GET | `/email/templates/:id` | 模板详情 |
| POST | `/email/templates` | 创建模板 |
| PATCH | `/email/templates/:id` | 更新模板 |
| DELETE | `/email/templates/:id` | 删除模板（软删除） |
| POST | `/email/templates/:id/render` | 渲染预览（传入变量值，返回 HTML + text） |
| POST | `/email/templates/:id/duplicate` | 复制模板 |

**模板存取策略**：

```
存储：body_json (Tiptap JSON) + body_html (渲染/发送)
编辑回填：editor.commands.setContent(template.body_json)
渲染发送：replaceVariables(body_html, vars) → juice(html) → SMTP
```

**撰写时选择模板交互**：

```
用户点击「使用模板」→ TemplatePickerDialog
  → 选择模板 → 变量填充表单
  → POST /email/templates/:id/render → 渲染结果
  → 编辑器 setContent(html) → 用户继续编辑 → 发送
```

**后端新增依赖**：`juice`（CSS class → inline style 转换）

### 9.2 其他 Phase 3 功能

| 功能 | 说明 |
|------|------|
| `@react-email/editor` 可视化模板设计器 | 复杂模板（多列/按钮/品牌）的拖拽编辑 |
| 模板审批流程 | draft → pending_review → rejected → published |
| 邮件签名管理 | 账号级 HTML 签名，自动追加到发件末尾 |
| AI 生成模板 | CopilotKit 自动生成标准化模板 |
| IMAP IDLE 实时推送 | 替代轮询，准实时收件通知 |
| 全文搜索增强 | PostgreSQL tsvector 或外部搜索引擎 |
| 草稿功能 | 自动保存/恢复编辑中的邮件草稿 |

### 9.3 Phase 2 → Phase 3 演进路径

```
Phase 2（当前）
├── 日常撰写：Tiptap → getHTML() → SMTP
└── React Email / 模板系统：不引入

Phase 3（后续）
├── 日常撰写：不变
├── 简单模板：Tiptap JSON 存取 → 变量替换 → juice inline → SMTP
├── 复杂模板：引入 @react-email/editor 作为独立的模板设计器
│   └── 产出 React Email 组件 → render() → SMTP
├── 模板审批流程：draft → pending_review → rejected → published
├── 邮件签名管理：账号级 HTML 签名
├── AI 生成模板：CopilotKit 自动生成标准化模板
└── 两个编辑器在 UI 上是不同的入口：
    ├── 「撰写邮件」→ Tiptap Composer
    └── 「设计模板」→ @react-email/editor（模板管理页内）
```

---

## 10. 风险与注意事项

| 风险 | 缓解措施 |
|------|---------|
| Tiptap 迁移影响发送效果 | Phase 2-A 独立完成编辑器替换，验证 HTML 在 Gmail/Outlook/Apple Mail 的渲染效果后再推进 |
| CopilotKit 运行时未就绪 | Phase 2-B 依赖 `/api/copilot` + Hermes LLM 通道；若未就绪，AI Panel 先做 UI 骨架 + mock 数据 |
| Quill 相关代码残留 | Tiptap 替换后需清理 `react-quilljs` / `quill` 依赖和 CSS 导入 |

---

## 11. 验收标准（Phase 2 DoD）

| 验收项 | 标准 |
|--------|------|
| 三栏布局 | 宽屏下邮件列表 + 详情 + AI Panel 三栏可拖拽，AI Panel 可折叠 |
| Tiptap 编辑器 | 替换 Quill，支持段落/标题/加粗/斜体/链接/列表/图片，发送 HTML 邮件各客户端兼容 |
| 回复/转发 | 点击按钮进入编辑，自动填充收件人/引用原文/in_reply_to |
| AI 摘要 | 一键生成邮件摘要，流式展示在 AI Panel |
| AI 回复草稿 | 生成回复草稿，用户可采纳填入编辑器 |
| 翻译 | 翻译邮件正文到指定语言 |
| 任务提取 | 从邮件提取任务项列表 |
| 全屏编辑 | 撰写邮件有全屏模式，右侧有 AI 辅助面板 |
| 批量操作 | 多选邮件 → 标记已读/星标/归档/删除 |
