# AGENTS.md — Agent 工作手册（Token 节流版）

> 本文档是所有 AI Agent 在本仓库工作时的**第一读物**（唯一强制入口）。
> 目标：让 Agent 用「索引 → 按需加载」模式工作，避免每次会话盲目读取海量 PRD / specs。
> 项目：`smc-coworker-aios/portal`（CopilotSMC 壳 + Hermes AI OS 模块）

---

## 一、30 秒速览（Agent 必读）

| 维度 | 值 |
|------|---|
| 技术栈 | Next.js 14 App Router · TS 5 · React 18 · Tailwind · Shadcn/UI · Zustand · React Query · CopilotKit |
| 路由壳 | `app/[lang]/(dashboard)/` — 保留不动，所有新功能挂进来 |
| 业务模块 | `modules/<domain>/`（hermes/finance/risk/forecast/copilotkit） |
| UI 基座 | `components/ui/`（Shadcn，**禁止魔改**，直接复用） |
| AI 接入 | `/api/copilot` → CopilotKit Runtime → Hermes LLM |
| 文档体系 | `specs/`（代码结构规格）· `docs/prd/`（PRD）· `docs/conventions/`（规约） |
| Agent 入口 | **本文件 → `docs/INDEX.md` → 具体文档** |

---

## 二、Token 节流读取策略（重要）

**禁止一次性读入完整的 PRD / specs**。按下面的三级漏斗操作：

### L1 — 入口级（~15 KB，每次必读）
```
AGENTS.md          本文件
docs/INDEX.md      文档全景索引
DESIGN.md          UI 设计系统规范（涉及 UI 任务时额外读取）
```

### L2 — 索引级（按任务域打开 1 个，5–10 KB）
```
specs/INDEX.md                     代码结构索引（哪里有什么）
docs/conventions/naming.md         命名规则
docs/conventions/directories.md    归属目录规则
```

### L3 — 详情级（仅当 L1/L2 不够用时加载）
```
specs/project-structure.md         完整代码结构（15 KB+）
specs/components.md                组件清单（13 KB+）
specs/pages.md                     页面清单（14 KB+）
specs/layout-structure.md          Layout 嵌套（14 KB+）
docs/prd/<file>.md                 PRD 详情（单个文件 10–50 KB）
```

### 读取判断流程
```
用户任务进来
  ├─ 问「项目是什么 / 在哪里做」→ 只读 AGENTS.md + docs/INDEX.md
  ├─ 写组件 / 加页面            → + specs/INDEX.md（+ L3 specs 对应章节）
  ├─ 改 Hermes / Finance / Risk / Email → + docs/INDEX.md 中对应 PRD 条目（单文件）
  ├─ 定命名或目录争议            → + docs/conventions/*
  └─ 跨多个领域 / 需求不清       → 先问用户，再选择性加载
```

> 默认只读 L1。**只有**任务明确落到某个域时才加载对应的 L2 / L3。

---

## 三、文档目录一句话地图

| 路径 | 作用 | 何时读 |
|------|------|--------|
| `AGENTS.md` | Agent 入口 | **每次** |
| `docs/INDEX.md` | 文档全景索引 | **每次**（或首次） |
| `docs/conventions/naming.md` | 命名规则 | 新建文件/改名时 |
| `docs/conventions/directories.md` | 目录归属规则 | 不确定放哪时 |
| `specs/INDEX.md` | 代码结构索引 | 写代码前 |
| `specs/project-structure.md` | 全量目录结构 | 仅在索引不够用时 |
| `specs/components.md` | UI/业务组件清单 | 引用组件时 |
| `specs/pages.md` | 页面路由清单 | 新增/定位页面时 |
| `specs/layout-structure.md` | Layout/Provider 嵌套 | 改布局/认证/i18n 时 |
| `docs/prd/finance_module.md` | Finance 模块 PRD | 改 `modules/finance` 时 |
| `docs/prd/integrate_copilot.md` | CopilotKit 接入 PRD | 改 AI 接入层时 |
| `docs/prd/hermes_dashboard_phase1.md` | Hermes 骨架 | 改 `modules/hermes` 基础 |
| `docs/prd/hermes_dashboard_phase2-8.md` | Hermes 分阶段增强 | 对应阶段任务时按需加载 |
| `docs/prd/generative-ui.md` | Generative UI 模块 PRD | 改 `modules/generative-ui` 时 |
| `docs/prd/email/core_email_prd.md` | Email 后端真实实现契约（Express + Drizzle + IMAP/POP3/SMTP） | 改邮件后端、共享契约、DB schema 时 |
| `modules/generative-ui/` | Generative UI — sandbox 运行时 + Zod 注册表 + AG-UI 事件协议 | 涉及动态 UI 生成时 |
| `app/[lang]/(dashboard)/generative-ui/` | Generative UI 预览页面 | 调试/验证生成组件时 |

---

## 四、硬性工作约束（Agent 必守）

1. **不改路由壳**：`app/[lang]/(dashboard)/layout.tsx`、`provider/` 下 Provider 不改（除非 PRD 明确要求）。
2. **不改 UI 基座**：`components/ui/` 不魔改，有需要就在 `modules/<domain>/components/` 做组合。
3. **业务代码位置**：所有业务逻辑落在 `modules/<domain>/` 里（见 `docs/conventions/directories.md`）。
4. **命名统一**：文件名 `kebab-case`，React 组件名 `PascalCase`（详见 `docs/conventions/naming.md`）。
5. **文档归属**：PRD → `docs/prd/`；代码规格 → `specs/`；规约 → `docs/conventions/`。**不要**把这三类混放。
6. **中文优先**：所有交互响应、commit message、文档一律简体中文（代码标识符除外）。
7. **最小变更**：优先编辑已有文件；只在确有必要时新建。
8. **Agent 不要主动读**：`node_modules/`、`.next/`、`generated/raw/*.json`（体积大、非必需）。

---

## 五、当发现文档与代码不一致时

1. **以代码为准**，但同时在本次任务范围内更新对应文档（`specs/` 或 `docs/INDEX.md`）。
2. 如果是 PRD 与现实差距过大，**先向用户确认**再动手，不要擅自"实现 PRD"。
3. 文档结构性变更请同步更新 `docs/INDEX.md` 与本 `AGENTS.md` 的地图。

---

## 六、加载示例（省 token 的正确做法）

### 场景 A：用户问「怎么加一个 dashboard 页面」
```
读：AGENTS.md → docs/INDEX.md → specs/INDEX.md 的 Pages 段
不读：所有 PRD、specs 的完整详情
```

### 场景 B：用户说「帮我实现 hermes phase3」
```
读：AGENTS.md → docs/INDEX.md → docs/prd/hermes_dashboard_phase3.md
     + specs/INDEX.md 中 modules/hermes 索引
不读：phase1/2/4-8 的 PRD 详情（除非 phase3 显式依赖）
```

### 场景 C：用户说「重构某个组件」
```
读：AGENTS.md → docs/conventions/naming.md + directories.md
     + 精确 Grep 目标组件 + 相关调用点（不要全量读 specs）
```

---


## 七、页面开发前置 Layout 确认规则（强制）

当任务涉及以下任一场景时：

- 新增页面
- 新增功能模块
- 重构页面
- 新增 `app/[lang]/` 路由
- 新增 `app/[lang]/(dashboard)/` 路由
- 新增模块工作区
- 新增 AI / Agent / Workflow / Document / Settings 页面
- 修改页面主结构、侧栏、详情面板、Copilot 工作区、编辑器工作区

Agent 必须读取：

```txt
specs/layout-structure.md
specs/pages.md
specs/project-structure.md（必要时）
docs/conventions/layout-decision-template.md
docs/conventions/layout-dod.md
```

并且必须先输出 `Layout Decision`，再写代码。

### 7.1 禁止跳过 Layout Decision

禁止在未确认 Layout Decision 的情况下直接生成或修改：

```txt
app/[lang]/**/page.tsx
app/[lang]/**/layout.tsx
modules/<domain>/pages/*
modules/<domain>/components/layout/*
```

### 7.2 Layout Decision 必填项

每个 Layout Decision 必须确认：

1. `route type`
   - dashboard route：`app/[lang]/(dashboard)/*`
   - standalone route：`app/[lang]/*`
   - shared route group layout
   - existing page modification

2. `selected page template`
   - `WorkspaceDashboardTemplate`
   - `DataManagementTemplate`
   - `AgentWorkspaceTemplate`
   - `ExecutionDetailTemplate`
   - `DocumentWorkspaceTemplate`
   - `SettingsTemplate`
   - `Custom`，仅在有充分理由时使用

3. `shell inheritance`
   - 是否继承 Header
   - 是否继承 Sidebar
   - 是否继承 Footer
   - 是否继承 ThemeCustomize
   - 是否继承 Auth protection
   - 是否继承 i18n
   - 是否继承 DirectionProvider
   - 是否继承 GlobalCopilotProvider

4. `layout files`
   - 是否只需要 `page.tsx`
   - 是否需要页面级 `layout.tsx`
   - 是否需要模块级 `WorkspaceLayout`
   - 是否需要 `WorkspaceFilesPanel`
   - 是否需要 `RightDrawer / Inspector`

5. `Copilot behavior`
   - 不接入 Copilot
   - 只注册页面上下文
   - 必须使用 AI 三栏工作系统
   - 只使用全局 Copilot Sidebar，禁止创建新的 Provider

6. `forbidden changes`
   - 不修改 `app/[lang]/layout.tsx`
   - 不修改 `app/[lang]/(dashboard)/layout.tsx`
   - 不修改 `provider/*`
   - 不修改 `components/ui/*`

### 7.3 页面母版选择规则

| 页面类型 | 默认模板 | 是否需要页面级 layout.tsx | Copilot |
|---|---|---:|---:|
| Dashboard / Finance / Risk 概览 | `WorkspaceDashboardTemplate` | 通常不需要 | 可选 |
| 任务 / 文件 / 用户 / 审批列表 | `DataManagementTemplate` | 通常不需要 | 可选 |
| AI 助手 / 会话 / 多 Agent 协作 | `AgentWorkspaceTemplate` | 可能需要 | 必须 |
| Workflow / Agent Run / 审批流详情 | `ExecutionDetailTemplate` | 可能需要 | 必须 |
| 文档 / 知识库 / Univer / Article Studio | `DocumentWorkspaceTemplate` | 通常需要 | 必须 |
| MCP / Skill / RBAC / 系统设置 | `SettingsTemplate` | 可选 | 可选 |

### 7.4 AI 页面三栏工作系统规则

如果页面属于 AI / Agent / Workflow / Task Execution，必须选择以下模板之一：

- `AgentWorkspaceTemplate`
- `ExecutionDetailTemplate`
- `DocumentWorkspaceTemplate`

并且页面必须包含：

- PromptInput 或 TaskForm
- ContextPanel
- ExecutionStatePanel
- ExecutionTimeline
- ResultPanel
- SourceReferences
- FeedbackActions

禁止：

- 新建第二套 CopilotKit Provider
- 修改全局 Layout 接入 Copilot
- 用普通聊天框替代执行态页面结构

### 7.5 Layout DoD

页面生成后必须读取并执行：

```txt
docs/conventions/layout-dod.md
```

如果不满足 Layout DoD，必须先修复，再结束任务。