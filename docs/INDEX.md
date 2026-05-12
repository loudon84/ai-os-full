# docs/INDEX.md — 文档全景索引

> 本索引面向 Agent 与开发者，用于**按需加载**项目文档，避免一次性读入大量 PRD / specs。
> 加载策略见 `AGENTS.md` 的「Token 节流读取策略」。
> 文件大小为近似值（KB），用于判断是否启用 Read 的 `offset/limit`。

---

## 一、文档分区总览

| 分区 | 路径 | 定位 | 修改频率 |
|------|------|------|----------|
| Agent 入口 | `AGENTS.md`（根） | Agent 必读手册 | 低 |
| 文档索引 | `docs/INDEX.md` | **本文件**，按需加载地图 | 随文档变动 |
| 规约 | `docs/conventions/` | 命名、目录与 Agent 工作流规约 | 低 |
| 代码规格 | `specs/` | 前端代码结构快照 | 跟随代码 |
| 产品需求 | `docs/prd/` | 模块/阶段 PRD | 阶段性新增 |
| 前端实现 | `frontend/` | Next.js 14 + React 18（`@portal/web`，端口 3000） | 跟随代码 |
| 后端实现 | `backend/` | Express 5 + Drizzle（`@portal/server`，端口 8000）；documents API 已就位 | 跟随代码 |
| 工作区包 | `packages/` | `@portal/shared`（类型/Zod）· `@portal/db`（Drizzle schema/migrations） | 跟随代码 |
| 工具链 | `tooling/tsconfig/` | 共享 TypeScript 基础配置（`base.json` / `node.json`） | 低 |
| 工程配置 | 根级 | `package.json` / `pnpm-workspace.yaml` / `turbo.json` / `.npmrc` / `.env.example` / `.github/workflows/ci.yml` | 低 |
| 已废弃后端 | `ai-os-api/` | **DEPRECATED**：原 Python FastAPI documents API，已 100% 迁至 `backend/`；详见 [`ai-os-api/DEPRECATED.md`](../ai-os-api/DEPRECATED.md) | 不再维护 |
| README | `README.md` | 对外入门 | 低 |

> Portal 是 **pnpm + Turborepo monorepo**。依赖拓扑：`@portal/shared` → `@portal/db` → `@portal/server`；`@portal/web` 仅依赖 `@portal/shared`。

---

## 二、规约（`docs/conventions/`）

| 文档 | 大小 | 触发词 | 必读场景 |
|------|------|--------|----------|
| `docs/conventions/naming.md` | ~5 KB | 命名、重命名、rename、kebab、PascalCase | 新建/重命名文件、导出符号 |
| `docs/conventions/directories.md` | ~6 KB | 放哪里、归属、目录、放在 modules 还是 components | 拿不准代码/文档落点时 |
| `docs/conventions/agent-workflow.md` | ~6 KB | Agent 工作流、验证证据、生命周期、反偷懒、红旗 | 跨多阶段任务、交付前自检、需明确「何为完成」时 |
| `.cursor/rules/30-doc-sync-on-completion.mdc` | ~2 KB | 功能完成后文档同步、docs/INDEX.md 更新、specs 更新 | Agent 每次功能变更结束前自动触发（alwaysApply） |

> ⚠️ 有争议先查这两个文件，再继续写代码。

---

## 三、代码规格（`specs/` — 前端）

> `specs/` 为**前端**代码结构快照（`frontend/` 下的 `app/`、`modules/`、`components/`）。后端结构见第六节。

| 文档 | 大小 | 关注 | 触发词 | 跳过条件 |
|------|------|------|--------|----------|
| `specs/INDEX.md` | ~4 KB | **代码结构索引** | 任何「在哪里」类问题 | 从不跳过 |
| `specs/project-structure.md` | ~15 KB | 全量目录+数据流+别名 | 项目结构、数据流、路由组、别名 | 只做单点编辑时 |
| `specs/components.md` | ~13 KB | Shadcn/业务组件清单 | Button/Dialog/Form/组件可用性 | 不引用既有组件时 |
| `specs/pages.md` | ~14 KB | 全部页面路由一览 | 页面、路由、URL、error-page/auth | 不新增页面时 |
| `specs/layout-structure.md` | ~14 KB | Layout/Provider 嵌套 | layout、Provider、认证、i18n、RTL | 不改布局/认证时 |

---

## 四、产品需求（`docs/prd/`）

> PRD 单个文件最大 ~52 KB。**强烈建议** Agent 先读标题节，再 `offset/limit` 分段读。

### 4.1 基座与接入层

| 文档 | 大小 | 主题 | 触发词 | 关联代码 |
|------|------|------|--------|---------|
| `docs/prd/integrate_copilot.md` | ~52 KB | React 18 前端接入 CopilotKit 的总体方案 | CopilotKit、AI OS、`/api/copilot`、全站 AI | `app/api/copilot/`、`ai/`、`modules/copilotkit/` |
| `docs/prd/form/core_target.md` | ~55 KB | Form 模块：AI-OS Form Spec 协议 + 动态表单运行时 MVP | form、动态表单、RJSF、AiOsFormSpec、`/form/playground`、`/api/forms/submit` | `modules/form/`、`app/[lang]/(dashboard)/form/`、`app/api/forms/` |
| `docs/prd/generative-ui.md` | ~6 KB | Generative UI — AI 动态生成 sandbox React 组件 | Generative UI、sandbox、动态 UI、AG-UI 事件 | `modules/generative-ui/`、`app/[lang]/(dashboard)/generative-ui/` |
| `docs/prd/document/core_target.md` | ~52 KB | Documents 模块（Univer 表格）接入方案 | documents、文档、Univer、表格、snapshot、version | `modules/documents/`、`app/[lang]/(dashboard)/documents/` |
| `docs/prd/document/core_spec.md` | ~10 KB | Documents MVP 核心 spec（前端模块骨架 + Univer 约束） | documents spec、Univer adapter、readonly、dirty、save | `modules/documents/` |
| `docs/prd/document/spec_detail.md` | ~52 KB | Documents 系统明细 spec（域模型/存储/契约/实现） | Document API、MinIO、PostgreSQL、permission、version_conflict | `backend/`、`modules/documents/` |
| `docs/prd/auth_rbac.md` | ~15 KB | Auth/RBAC 模块方案（用户登录/JWT/Workspace 多租户/角色权限/审计） | auth、登录、JWT、RBAC、权限、workspace、membership、角色 | `backend/src/auth-provider/`、`backend/src/middleware/auth-v2.ts`、`backend/src/middleware/rbac.ts`、`frontend/modules/auth/` |
| `docs/prd/email/core_email_prd.md` | ~45 KB | Email 后端真实实现契约（Express + Drizzle + IMAP/POP3/SMTP + 附件 + 审计） | email backend、邮件后端、IMAP、POP3、SMTP、邮箱账号、收发、同步 | `backend/src/routes/email.ts`、`backend/src/services/email/`、`packages/db`、`packages/shared` |
| `docs/prd/email/extend_with_react.md` | ~28 KB | React Email 引入评估（模板渲染/编辑器/Tiptap 关系/落地架构） | react-email、邮件模板编辑器、@react-email/editor、Tiptap vs React Email | `modules/email/` |
| `docs/prd/email/extend_with_copilo.md` | ~18 KB | Email Phase 2 PRD：AI 工作台（三栏布局/Tiptap/Agent 任务；模板系统移至 Phase 3 未来规划） | 邮件 AI、Tiptap、Agent 任务、邮件工作台、AI Panel | `modules/email/`、`frontend/app/api/email/ai-completion/` |

### 4.2 工程架构

| 文档 | 大小 | 主题 | 触发词 | 关联代码 |
|------|------|------|--------|---------|
| `docs/prd/monorepo.md` | ~40 KB | Portal monorepo 架构方案（pnpm workspace + Turborepo + frontend/backend/packages 划分 + tsconfig/CI/.npmrc 全套配置） | monorepo、workspace、turbo、@portal/*、依赖拓扑、tsconfig 共享、CI、构建顺序 | 根级 + `tooling/` + `packages/` + `backend/` + `frontend/` |

---

## 五、前端模块（`frontend/`）

| 路径 | 包名 | 端口 | 说明 |
|------|------|------|------|
| `frontend/` | `@portal/web` | 3000 | Next.js 14 App Router · TS · React 18 · Tailwind · Shadcn/UI · Zustand · React Query · CopilotKit |
| `frontend/app/[lang]/(dashboard)/` | — | — | DashTail 路由壳，多数业务页面挂这里 |
| `frontend/app/[lang]/workspace/` | — | — | 个人工作台：独立 `layout.tsx` + `workspace.layout.provider`（无侧栏/底栏）；入口见顶栏头像下拉 |
| `frontend/app/[lang]/hermes/` | — | — | Hermes：独立 `layout.tsx`（auth+i18n）+ 继承 `workspace.layout.provider`（无侧栏/底栏） |
| `frontend/app/[lang]/email/` | — | — | Email：独立 `layout.tsx`（auth+i18n）+ 继承 `workspace.layout.provider`（无侧栏/底栏）；`/email`、`/email/settings` |
| `frontend/modules/<domain>/` | — | — | 业务模块（hermes / finance / risk / forecast / copilotkit / documents / email / generative-ui / **auth** …） |
| `frontend/modules/email/` | — | — | Email 前端：真实 `/api/email/*` 接入、账号绑定/同步/列表详情/发信/附件；`vitest.config.ts` + `modules/email/tests/*` |
| `frontend/app/(auth)/` | — | — | 认证路由组（login / register / workspace/select），独立 layout 无 Sidebar/Header |
| `frontend/middleware.ts` | — | — | 反代 `/api/*` → backend `/api/v1/*`，Authorization 头透传 |

---

## 六、后端与共享（`backend/` + `packages/`）

| 路径 | 包名 | 用途 | 触发词 |
|------|------|------|--------|
| `backend/` | `@portal/server` | Express 5 + Pino + CORS，端口 8000；`/api/v1/documents`、Auth/RBAC、`/api/v1/email` 基础端点已就位 | 改后端、加端点、改路由、改中间件 |
| `backend/src/auth-provider/` | — | AuthProvider 抽象接口 + JwtProvider 自建 JWT 实现（jsonwebtoken + argon2id） | 改认证提供者、JWT 逻辑 |
| `backend/src/routes/auth.ts` | — | 认证 4 端点（register / login / refresh / logout） | 认证路由、登录/注册 |
| `backend/src/routes/workspaces.ts` | — | Workspace + Membership + Role + Permission 路由（5+6+4+3=18 端点） | workspace/角色/权限管理 |
| `backend/src/routes/users.ts` | — | 用户 5 端点（me / userId CRUD） | 用户管理 |
| `backend/src/routes/audit.ts` | — | 审计 2 端点（全局 + workspace 级） | 审计日志查询 |
| `backend/src/routes/email.ts` | — | Email 账号、消息、文件夹、同步、附件端点（`/api/v1/email/*`） | 邮件后端 API、邮箱账号、收发、同步 |
| `backend/src/services/auth/` | — | 认证业务（AuthService / TokenService / LoginLockoutService） | 登录/注册/Token 业务逻辑 |
| `backend/src/services/rbac/` | — | RBAC 业务（Workspace / Membership / Role / Permission / User Service） | 权限管理业务逻辑 |
| `backend/src/services/audit/` | — | 审计业务（AuditService，异步队列 + 批量写入） | 审计事件写入/查询 |
| `backend/src/services/documents/` | — | 业务编排（service / repository / permission / events / errors / checksum） | 业务逻辑、事务、权限 |
| `backend/src/services/email/` | — | Email 账号/消息服务、AES 凭证加密、SMTP 发送、IMAP/POP3 Provider 抽象、同步骨架、仓储 | 邮件收发、连接测试、同步、凭证安全 |
| `backend/src/storage/` | — | S3/MinIO 快照存储（aws-sdk v3） | 快照存储、bucket、checksum |
| `backend/src/middleware/` | — | auth-v2（Bearer Token + 旧头降级）、rbac（权限码校验）、audit-logger（异步审计）、logger、error-handler | 鉴权、权限校验、审计、日志、错误响应 |
| `backend/tests/` | — | Vitest 单元测试（checksum / version-conflict / permission / email-foundation） | 写后端测试 |
| `packages/shared/` | `@portal/shared` | 前后端共享：常量（`DOCUMENT_*`、`SNAPSHOT_*`、`USER_*`、`WORKSPACE_*`、`MEMBERSHIP_*`、`PERMISSION_*`、`AUDIT_*`、`EMAIL_*`）+ TS 类型 + Zod 验证器；`zod` 是运行时依赖 | 改 API 契约、加共享类型 |
| `packages/db/` | `@portal/db` | Drizzle schema（documents + auth/rbac + email）+ migrations + `createDb` 客户端 + 种子数据脚本 | 改 schema、加表、生成迁移 |
| `packages/db/src/migrations/` | — | Drizzle Kit 生成的 SQL（`pnpm db:generate`） | 迁移文件 |
| `tooling/tsconfig/` | — | `base.json` / `node.json` 共享 TS 配置，被 backend 与 packages 继承 | 改编译选项 |

### 6.1 常用命令

```bash
pnpm install                  # 安装所有 workspace 依赖
pnpm dev                      # turbo 并行启动 web (3000) + server (8000)
pnpm dev:web                  # 仅前端
pnpm dev:server               # 仅后端
pnpm typecheck                # 全量类型检查
pnpm test                     # 全量测试
pnpm build                    # 全量构建
pnpm db:generate              # 生成 Drizzle migration（读 .env）
pnpm db:migrate               # 执行 migration 到 PG（读 .env）
```

> `packages/db/{drizzle.config.ts,src/migrate.ts}` 已自动加载 `portal/.env`，无需手动 export `DATABASE_URL`。

### 6.2 已废弃

| 路径 | 状态 | 替代品 |
|------|------|--------|
| `ai-os-api/` | **DEPRECATED** | `backend/`，迁移映射见 [`ai-os-api/DEPRECATED.md`](../ai-os-api/DEPRECATED.md) |

---

## 七、生成/辅助资源（Agent **默认跳过**）

| 路径 | 说明 | 为何跳过 |
|------|------|----------|
| `frontend/generated/raw/*.json` | AST 扫描原始输出 | 体积大、信息已被 specs 汇总 |
| `frontend/tools/ast-grep/` | 代码扫描配置 | 仅更新扫描规则时读 |
| `frontend/scripts/*.py` | Storybook 生成脚本 | 仅改生成逻辑时读 |
| `frontend/.storybook/` | Storybook 配置 | 仅改 Storybook 时读 |
| `frontend/stories/**` | 已生成的 stories | 仅改具体 story 时读 |
| `frontend/debug-storybook.log` | 调试日志 | 无参考价值 |
| `node_modules/`、`.turbo/`、`*/dist/`、`*/.next/` | 构建产物 | 体积大、非必需 |
| `ai-os-api/` | 已废弃 Python 后端 | 仅历史参考，见 `DEPRECATED.md` |

---

## 八、索引维护规则

新增/重命名文档时**必须**同步更新本文件：

1. 把文档加入上面正确的分区表。
2. 注明 **大小估计**、**触发词**、**必读/跳过场景**。
3. 更新 `AGENTS.md` 第三节「文档目录一句话地图」。
4. 若是新类别，先看 `docs/conventions/directories.md` 确认落点。
5. 后端/共享包结构变化时，同步更新第六节。

> 本索引不复制 PRD/specs 的原文；它只提供「去哪里找」。保持小体积是它最大的价值。
