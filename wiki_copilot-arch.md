# AGENTS.md — Agent 工作手册（Token 节流版）

> 本文档是所有 AI Agent 在本仓库工作时的**第一读物**（唯一强制入口）。
> 目标：让 Agent 用「索引 → 按需加载」模式工作，避免每次会话盲目读取海量 PRD / specs。
> 项目：`smc-coworker-aios/portal` — pnpm + Turborepo monorepo（前端 DashTail + Hermes AI OS · 后端 Express/Drizzle · 共享 packages）

---

## 零、项目设计目标总览（功能集成指南）

> 本节定义各包的**产品定位与设计目标**，是后续功能集成的顶层引导。
> 开发新功能前先确认归属哪个包，再按对应设计目标决定实现路径。

### 系统全景架构

```
┌─────────────────────────────────────────────────────────────┐
│  用户桌面                                                     │
│  ┌──────────────────┐      ┌──────────────────┐             │
│  │  copilot-desktop │◄────►│  copilot-serve   │             │
│  │  (Electron GUI)  │ HTTP │  (常驻进程)       │             │
│  └────────┬─────────┘      └────────┬─────────┘             │
│           │ Bearer Token             │ 管理 hermes-agent     │
│           │                          │ 跨机器 task           │
└───────────┼──────────────────────────┼───────────────────────┘
            │                          │
    ┌───────▼───────┐          ┌───────▼───────┐
    │   frontend    │          │   backend     │
    │  (:3000)      │◄────────►│  (:8000)      │
    │  智能体应用前端│  /api/*  │  智能体应用后端│
    └───────────────┘          └───────────────┘
```

### 0.1 copilot-desktop — 桌面客户端（打包安装）

**定位**：面向终端用户的 Electron 桌面应用，负责本地环境引导、Portal 接入、Agent 管理的一站式入口。

| 设计目标 | 说明 |
|----------|------|
| 本地环境检测与安装 | 检查并安装 **Node.js 24.14.1**、**Python 3.12**、uv，部署 hermes-agent 运行时 |
| Portal 前端接入 | 配置 ai-os portal URL（frontend :3000），嵌入 WebView 加载 Portal Web |
| Backend 接入 | 配置 ai-os backend URL（backend :8000），所有 API 通过此地址路由 |
| 用户登录与 Token | 用户在桌面端登录后，Token 存储于本地安全存储，注入 Portal WebView 实现免登 |
| hermes-agent 管理 | 提供 Agent 安装/启停/配置/健康监控的管理界面 |
| 本地邮箱 | 集成本地邮箱功能页面（IMAP/POP3/SMTP，与 Portal Email 模块协同） |
| 多 Agent 应用 | 支持多个 hermes-agent Profile 并行运行，每个 Profile 独立 Gateway/端口/配置 |

**边界约束**：
- 不执行 LLM 推理（LLM 在 hermes-agent / Gateway）
- 不直接操作远程数据库（通过 backend API）
- GUI 仅通过 `window.*` Preload API 访问系统资源

**独立 git**：`copilot-desktop/`（参考 `copilot-desktop/AGENTS.md`）

---

### 0.2 copilot-serve — 本地常驻服务进程

**定位**：本地控制面守护进程，为 copilot-desktop 提供 Agent 运行时管理和跨机器协作能力。

| 设计目标 | 说明 |
|----------|------|
| hermes-agent 服务管理 | 多 Profile Gateway 生命周期（启停/健康/崩溃恢复/端口分配/日志） |
| 跨机器 task 交互 | 接收远程 Team Hub 派发的任务，本地执行并回报状态；支持多机协作 |
| API 供给 copilot-desktop | 提供 RESTful 接口（:8765），桌面端所有本地运行时操作通过此服务代理 |
| 审批与安全 | Workspace Guard + Approval Runtime，拦截高风险本地操作 |
| 进程持久化 | Windows Service / macOS launchd 方式常驻，桌面应用关闭后仍保持 Agent 运行 |

**边界约束**：
- 不提供 UI（UI 在 copilot-desktop）
- 不直接对外暴露（仅 127.0.0.1 监听）
- 不替代 backend 的业务逻辑（仅管理本地 Agent 运行时）

**独立 git**：`copilot-serve/`（参考 `copilot-serve/AGENT.md`）

---

### 0.3 frontend — 智能体应用前端

**定位**：基于 Web 的智能体应用平台 UI，提供所有 AI 业务功能的交互界面。

| 设计目标 | 说明 |
|----------|------|
| AI 工作台 | Hermes 对话、多 Agent 协作、Generative UI 等 AI 交互界面 |
| 业务模块 | Email 工作区、Documents 文档管理、Finance 财务分析、Risk 风控等 |
| 数据管理 | 用户/角色/权限/审计等管理后台页面 |
| 桌面端嵌入 | 作为 copilot-desktop WebView 的目标页面，支持 Token 注入免登 |
| CopilotKit AI | 全站 AI 能力（`/api/copilot`），页面级上下文注入 |

**边界约束**：
- 不处理本地 Agent 运行时（通过 copilot-desktop IPC 或 copilot-serve API）
- 不直接访问数据库（通过 backend API）
- 业务模块放在 `frontend/modules/<domain>/`

**包名**：`@portal/web`（端口 3000）

---

### 0.4 backend — 智能体应用后端

**定位**：云端/服务器部署的业务 API 服务，承载所有持久化数据操作和业务逻辑。

| 设计目标 | 说明 |
|----------|------|
| 认证与权限 | JWT Auth + Workspace 多租户 + RBAC 角色权限体系 |
| 业务 API | Documents / Email / 用户管理 / 审计日志等 RESTful 端点 |
| 数据持久化 | PostgreSQL（Drizzle ORM）+ S3/MinIO 对象存储 |
| 桌面端配置下发 | 为 copilot-desktop 提供 bootstrap 配置、用户偏好同步 |
| Agent 任务调度 | Team Task Hub（远程任务派发给 copilot-serve 执行） |

**边界约束**：
- 不管理本地进程（本地进程由 copilot-serve 管理）
- 不提供 UI（UI 在 frontend）
- 响应字段保持 `snake_case`

**包名**：`@portal/server`（端口 8000）

---

### 0.5 四包协作关系矩阵

| 场景 | copilot-desktop | copilot-serve | frontend | backend |
|------|----------------|---------------|----------|---------|
| 用户登录 | 发起登录请求 | — | 嵌入页面免登 | 验证凭证、签发 Token |
| 邮件收发 | 展示本地邮箱页 | — | Email 工作台 UI | IMAP/SMTP 服务、邮件存储 |
| Agent 启停 | 管理面板 UI | 执行启停/健康检查 | — | — |
| 跨机器任务 | 状态展示 | 接收/执行/回报 | 任务列表 UI | 任务派发/状态聚合 |
| 文档编辑 | WebView 嵌入 | — | Documents 工作台 | 版本存储/快照/权限 |
| AI 对话 | 嵌入 Portal 或本地 Chat | Gateway 进程管理 | Hermes 对话 UI | LLM 路由/上下文管理 |

---

### 0.6 功能归属决策树

```
新功能需求进来
  ├─ 需要本地文件/进程/环境操作？
  │    ├─ 需要 GUI → copilot-desktop
  │    └─ 纯后台服务 → copilot-serve
  ├─ 需要持久化存储/多用户/远程访问？
  │    ├─ API/数据层 → backend
  │    └─ 用户交互页面 → frontend
  ├─ 横跨多包？
  │    └─ 按「GUI → desktop / 进程管理 → serve / 页面 → frontend / API → backend」拆分
  └─ 不确定？→ 先问用户
```

---

## 一、30 秒速览（Agent 必读）

| 维度 | 值 |
|------|---|
| **运行时版本** | **Node.js 24.14.1**（`.nvmrc` / `.node-version` / `package.json#engines`）· **Python 3.12**（`.python-version`；`copilot-serve` 为 `>=3.12,<3.13`） |
| 仓库形态 | pnpm + Turborepo monorepo（独立 git 仓库，与 paperclip 无关联）；根目录另含 **独立 git 子项目** `copilot-desktop/`、`copilot-serve/`（各自 remote 更新，父仓库默认不跟踪其内容） |
| Workspace 包 | `@portal/web`（frontend）· `@portal/server`（backend）· `@portal/shared`（packages/shared）· `@portal/db`（packages/db）· `smc-ai-copilot`（copilot-desktop，Electron） |
| 依赖拓扑 | Portal：`shared` → `db` → `server` ；`web` → `shared`。桌面端：`copilot-desktop` → Portal Web（:3000）+ AI-OS Auth（:8000）+ `copilot-serve`（:8765，本地控制面） |
| 前端技术栈 | Next.js 14 App Router · TS 5 · React 18 · Tailwind · Shadcn/UI · Zustand · React Query · CopilotKit（端口 3000） |
| 后端技术栈 | Express 5 · Drizzle ORM · postgres-js · Pino · Zod · aws-sdk v3 (S3/MinIO)（端口 8000） |
| 路由壳（前端） | `frontend/app/[lang]/(dashboard)/` — 保留不动，所有新功能挂进来 |
| 业务模块（前端） | `frontend/modules/<domain>/`（hermes/finance/risk/forecast/copilotkit/documents/email…） |
| UI 基座 | `frontend/components/ui/`（Shadcn，**禁止魔改**，直接复用） |
| AI 接入（前端） | `/api/copilot` → CopilotKit Runtime → Hermes LLM |
| 后端 API | `backend/src/routes/` — `/api/v1/...`；documents 12 端点 + Auth/RBAC 20+ 端点已就位（替代废弃的 Python `ai-os-api/`，见 `ai-os-api/DEPRECATED.md`） |
| 数据层 | `packages/db/` Drizzle schema + migrations；PG 通过 `portal/.env` 的 `DATABASE_URL` 注入；8 张 Auth/RBAC 表（users/workspaces/memberships/roles/permissions/role_permissions/audit_events/refresh_tokens） |
| 共享契约 | `packages/shared/` — 常量 / TS 类型 / Zod 验证器，前后端共用；Auth/RBAC 常量/类型/验证器已就位 |
| 文档体系 | `specs/`（前端代码结构）· `docs/prd/`（PRD，含 `monorepo.md` 工程方案）· `docs/conventions/`（规约） |
| 工程配置 | 根级 `package.json` / `pnpm-workspace.yaml` / `turbo.json` / `.npmrc` / `.env.example` / `.github/workflows/ci.yml` |
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
  ├─ 写前端组件 / 加页面          → + specs/INDEX.md（+ L3 specs 对应章节）
  ├─ 改后端 / 加端点 / 改 schema → + docs/INDEX.md 第六节（backend/ + packages/）
  ├─ 改 Hermes / Finance / Risk / Email / Documents → + docs/INDEX.md 中对应 PRD 条目
  ├─ 改 monorepo 工程（workspace / turbo / tsconfig / CI） → + docs/prd/monorepo.md
  ├─ 改桌面端 Electron / 本地控制面 → 先读 `copilot-desktop/AGENTS.md` 或 `copilot-serve/AGENT.md`（独立 git，勿与 Portal 混改）
  ├─ 定命名或目录争议            → + docs/conventions/*
  └─ 跨多个领域 / 需求不清       → 先问用户，再选择性加载
```

> 默认只读 L1。**只有**任务明确落到某个域时才加载对应的 L2 / L3。

跨阶段工作流、验证证据与反偷懒约定见 [docs/conventions/agent-workflow.md](docs/conventions/agent-workflow.md)。

---

## 三、文档目录一句话地图

### 3.1 文档与规约

| 路径 | 作用 | 何时读 |
|------|------|--------|
| `AGENTS.md` | Agent 入口 | **每次** |
| `docs/INDEX.md` | 文档全景索引 | **每次**（或首次） |
| `docs/conventions/naming.md` | 命名规则 | 新建文件/改名时 |
| `docs/conventions/directories.md` | 目录归属规则 | 不确定放哪时 |
| `specs/INDEX.md` | 前端代码结构索引 | 写前端代码前 |
| `specs/project-structure.md` | 前端全量目录结构 | 仅在索引不够用时 |
| `specs/components.md` | UI/业务组件清单 | 引用组件时 |
| `specs/pages.md` | 页面路由清单 | 新增/定位页面时 |
| `specs/layout-structure.md` | Layout/Provider 嵌套 | 改布局/认证/i18n 时 |
| `docs/prd/monorepo.md` | **monorepo 工程架构**（workspace / turbo / tsconfig / CI / 依赖拓扑全套） | 改根配置 / 加 workspace 包 / 改构建链路时 |
| `docs/prd/finance_module.md` | Finance 模块 PRD | 改 `frontend/modules/finance` 时 |
| `docs/prd/integrate_copilot.md` | CopilotKit 接入 PRD | 改 AI 接入层时 |
| `docs/prd/hermes_dashboard_phase1.md` | Hermes 骨架 | 改 `frontend/modules/hermes` 基础 |
| `docs/prd/hermes_dashboard_phase2-8.md` | Hermes 分阶段增强 | 对应阶段任务时按需加载 |
| `docs/prd/hermes/wiki_spec.md` | Hermes Desktop / hermes-agent 与 Portal 对接说明（IPC、gateway、安装发布、邮件/文档 AI 契约索引） | 改 hermes-desktop 嵌入、本地 agent 安装/管理/对话桥接、`modules/email`/`modules/documents` 与桌面壳协同时 |
| `docs/prd/hermes/wiki_channel.md` | Hermes `hermesAPI` 与 IPC channel 全量表（含扁平附录 D；可用 `scripts/gen-hermes-preload-ipc-table.mjs` 从 preload 重生成） | 查 Main/Preload 通道名、对 `hermes-desktop` 做 IPC 级联改动时 |
| `docs/prd/hermes/wiki_renderer.md` | Hermes Desktop 渲染进程：页面如何挂 `hermesAPI`、Layout 视图表、Chat 流式订阅、远程-only 与各 Screen 契约 | 改 `hermes-desktop` 前端屏、嵌 WebView/Portal、对齐 Chat/Gateway 等行为时 |
| `docs/prd/generative-ui.md` | Generative UI 模块 PRD | 改 `frontend/modules/generative-ui` 时 |
| `docs/prd/document/core_target.md` | Documents（Univer 表格）总体方案 | 改文档模块前后端时 |
| `docs/prd/document/spec_detail.md` | Documents 系统明细 spec（域模型/存储/契约） | 改 Documents 数据模型/API 契约 |
| `docs/prd/auth_rbac.md` | Auth/RBAC 模块方案（JWT/Workspace 多租户/角色权限） | 改 `backend/src/auth-provider/`、`middleware/auth-v2.ts`、`frontend/modules/auth/` 时 |
| `docs/prd/email/core_email_prd.md` | Email 后端真实实现契约（Express + Drizzle + IMAP/POP3/SMTP） | 改 `backend/src/routes/email.ts`、`backend/src/services/email/`、`packages/db`、`packages/shared` 时 |
| `docs/prd/email/extend_with_react.md` | React Email 引入评估（模板渲染/编辑器/Tiptap 关系） | 评估邮件模板编辑器选型时 |
| `docs/prd/email/extend_with_copilo.md` | Email Phase 2 PRD：AI 工作台（三栏/Tiptap/Agent；模板系统在 Phase 3） | 改邮件 AI 面板、编辑工作台时 |

### 3.2 实现目录

| 路径 | 包名 | 作用 | 何时读 |
|------|------|------|--------|
| `frontend/` | `@portal/web` | Next.js 前端实现，端口 3000 | 改前端代码 |
| `frontend/modules/<domain>/` | — | 前端业务模块代码 | 改具体业务模块 |
| `frontend/modules/email/` | — | Email 前端（Phase 1 API + Phase 2：Tiptap 撰写、回复/转发/线程视图、列表多选批量、三栏+`EmailAIPanel`（邮件 AI）与 `HermesChatPanel`（Hermes 流式对话；首轮发消息前 `injectEmailToWorkspace` 将 `email-context/` 写入当前 runtime 会话；`lib/html-to-text` 补全 HTML 正文上下文；内嵌 `RuntimeWorkspacePanel`；按邮件 id 绑定 `hermes-panel-session-binding` 续会话）、CopilotKit `useCopilotReadable`/`useCopilotAction`、全屏撰写 AI；`app/api/email/ai-completion`；`frontend/vitest.config.ts`） | 改邮件工作区 |
| `frontend/modules/documents/` | — | Documents：`DocumentDetailPage` 侧栏 Tabs「AI 助手」`DocumentAIPanel`（`HermesChatPanel` + `workspaceInjector` / `workspace-document-inject` 写入 `document-context/`；`scopeKeyDocument` 续会话）与「数据操作」`SpreadsheetAIPanel`（CopilotKit Patch）；`@portal/shared` `DOCUMENT_TYPES` / `DOCUMENT_ENGINES` 已扩展 markdown·pdf·html 与对应引擎占位 | 改文档工作区、文档 AI、Univer 集成 |
| `frontend/middleware.ts` | — | `/api/*` 反代到 backend `/api/v1/*` | 改前后端代理或环境切换时 |
| `frontend/provider/workspace.layout.provider.tsx` | — | 独立壳层（仅 Header + flex 主内容）：`/[lang]/workspace`、`/[lang]/hermes`、`/[lang]/email` 等复用 | 改该壳层、全页 flex 高度策略时 |
| `frontend/app/[lang]/hermes/` | — | Hermes 独立路由组（与 `(dashboard)` 平级）：继承 `WorkspaceLayoutProvider`（无 Sidebar/Footer） | 迁移 Hermes 路由壳、调整 Hermes 页面布局 |
| `frontend/app/[lang]/email/` | — | Email 独立路由组（与 `(dashboard)` 平级）：继承 `WorkspaceLayoutProvider`（无 Sidebar/Footer）；`/email`、`/email/settings` | 迁移邮件路由壳、调整邮件页布局 |
| `backend/` | `@portal/server` | Express + Drizzle 后端实现，端口 8000 | 改后端 / 加端点 / 改路由 |
| `backend/src/auth-provider/` | — | AuthProvider 抽象 + JwtProvider 自建 JWT（jsonwebtoken + argon2id） | 改认证/JWT 逻辑 |
| `backend/src/routes/auth.ts` | — | 认证 4 端点（register/login/refresh/logout） | 改认证路由 |
| `backend/src/routes/workspaces.ts` | — | Workspace/Membership/Role/Permission 路由（18 端点） | 改 workspace/角色/权限路由 |
| `backend/src/routes/users.ts` | — | 用户 5 端点（me/userId CRUD） | 改用户管理路由 |
| `backend/src/routes/audit.ts` | — | 审计 2 端点 | 改审计日志路由 |
| `backend/src/routes/email.ts` | — | Email 账号/消息/文件夹/同步/附件端点（`/api/v1/email/*`） | 改邮件后端 API 契约 |
| `backend/src/services/auth/` | — | 认证业务（AuthService/TokenService/LoginLockoutService） | 改登录/注册/Token 逻辑 |
| `backend/src/services/rbac/` | — | RBAC 业务（Workspace/Membership/Role/Permission/User Service） | 改权限管理逻辑 |
| `backend/src/services/audit/` | — | 审计业务（AuditService，异步批量写入） | 改审计逻辑 |
| `backend/src/routes/documents.ts` | — | documents 12 端点 | 改 documents API 契约 |
| `backend/src/services/documents/` | — | documents 业务编排（service/repo/permission/events） | 改业务逻辑、事务、权限 |
| `backend/src/services/email/` | — | Email 账号、消息、SMTP、同步、加密、Provider 抽象与仓储 | 改邮件收发/同步/凭证逻辑 |
| `backend/src/storage/` | — | S3/MinIO 快照存储（aws-sdk v3） | 改快照存取 |
| `backend/src/middleware/` | — | auth-v2（Bearer Token + 旧头降级）/ rbac / audit-logger / logger / error-handler | 改鉴权/权限校验/审计/日志/错误响应结构 |
| `backend/tests/` | — | Vitest 单元测试 | 写后端测试 |
| `packages/shared/` | `@portal/shared` | 前后端共享：常量 + TS 类型 + Zod 验证器（含 documents/auth/email） | 改 API 契约 / 加共享类型 |
| `packages/db/` | `@portal/db` | Drizzle schema（documents/auth/email）+ migrations + `createDb` | 改 schema / 加表 / 生成迁移 |
| `tooling/tsconfig/` | — | 共享 TS 配置（`base.json`/`node.json`），被 backend + packages 继承 | 改全局编译选项 |
| `.github/workflows/ci.yml` | — | CI：install + typecheck + test + build | 改 CI 流水线 |
| `copilot-desktop/` | `smc-ai-copilot` | Electron 39 桌面壳（SMC Copilot）：嵌入 Portal `aios-home`（:3000）、AI-OS Auth（:8000）、Hermes Gateway 多 Profile；**独立 git**（如 `loudon84/ai-os-desktop`） | 改桌面 IPC/安装/多 Profile/Web Operator；读 `copilot-desktop/AGENTS.md` |
| `copilot-serve/` | `ai-copilot-serve` | Python 3.12 FastAPI 本地控制面（:8765）：Gateway 监管、Profile、审批/Workspace Guard；**独立 git**（`loudon84/ai-os-serve`），**不**在 pnpm workspace | 改本地 Hermes 运行时 API；读 `copilot-serve/AGENT.md` |
| `ai-os-api/` | — | **DEPRECATED** Python 后端，见 `ai-os-api/DEPRECATED.md`；**不再修改** | 仅历史参考 |

---

## 四、硬性工作约束（Agent 必守）

1. **不改路由壳**：`frontend/app/[lang]/(dashboard)/layout.tsx`、`frontend/provider/` 下 Provider 不改（除非 PRD 明确要求）。
2. **不改 UI 基座**：`frontend/components/ui/` 不魔改，有需要就在 `frontend/modules/<domain>/components/` 做组合。
3. **业务代码位置**：
   - 前端业务逻辑落在 `frontend/modules/<domain>/`
   - 后端业务逻辑落在 `backend/src/services/<domain>/`，路由薄壳放在 `backend/src/routes/<domain>.ts`
   - 前后端共享的常量 / 类型 / Zod 验证器放在 `packages/shared/src/`
   - Drizzle schema / migration 放在 `packages/db/src/`
   - 详见 `docs/conventions/directories.md`
4. **API 契约同步**：改后端端点 / 字段时**必须**同步更新 `packages/shared/`（类型 + 验证器）和前端调用方；后端响应字段保持 `snake_case`（与既有契约一致）。
5. **数据库变更流程**：改 `packages/db/src/schema/*.ts` → 跑 `pnpm db:generate` 生成 migration → 提交 SQL；不要手写 SQL migration。
6. **不修改已废弃的 `ai-os-api/`**：所有变更落到 `backend/`。
7. **命名统一**：文件名 `kebab-case`，React 组件名 `PascalCase`（详见 `docs/conventions/naming.md`）。
8. **文档归属**：PRD → `docs/prd/`；前端代码规格 → `specs/`；规约 → `docs/conventions/`。**不要**把这三类混放。
9. **中文优先**：所有交互响应、commit message、文档一律简体中文（代码标识符除外）。
10. **最小变更**：优先编辑已有文件；只在确有必要时新建。
11. **Agent 不要主动读**：`node_modules/`、`*/dist/`、`*/.next/`、`.turbo/`、`frontend/generated/raw/*.json`、`ai-os-api/`（体积大或已废弃）。桌面子项目默认在各自仓库开发；仅在任务明确涉及 Portal↔桌面协同时读 `copilot-desktop/`、`copilot-serve/`。
12. **功能完成后文档同步**（详见 `.cursor/rules/30-doc-sync-on-completion.mdc`）：
    - 代码结构变更（新增/删除模块、路由、导出、文档）→ 必须同步更新 `docs/INDEX.md` + 本文件第三节
    - 页面/功能变更（新增/删除页面、组件、Hook、Store）→ 必须按 `frontend/specs/INDEX.md` 第五节规则更新对应 specs
    - 禁止在未完成文档同步的情况下声称任务完成

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

### 场景 D：用户说「给 backend 加一个端点 / 改 documents API」
```
读：AGENTS.md → docs/INDEX.md 第六节
     + backend/src/routes/documents.ts（参考既有端点风格）
     + packages/shared/src/{validators,types}/documents.ts（同步契约）
     + 必要时 packages/db/src/schema/*.ts
不读：前端 specs / PRD（除非端点契约影响前端调用）
```

### 场景 E：用户说「改 monorepo 工程 / workspace / CI」
```
读：AGENTS.md → docs/prd/monorepo.md（按章节定位）
     + 相关根级配置文件（package.json / pnpm-workspace.yaml / turbo.json / .npmrc）
不读：业务模块 specs / PRD
```

### 场景 F：用户说「改桌面端 / copilot-desktop / copilot-serve」
```
读：AGENTS.md（本节地图）→ 目标子项目 AGENTS.md
     copilot-desktop/AGENTS.md  — Electron、IPC、嵌入 Portal
     copilot-serve/AGENT.md     — FastAPI 本地控制面、Gateway 监管
不读：frontend/specs（除非改 Portal 页面被桌面嵌入的部分）
注意：两目录为独立 git；在子目录内 commit/push，勿假定与 portal 主仓库同一 remote
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