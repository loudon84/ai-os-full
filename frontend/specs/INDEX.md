# specs/INDEX.md — 代码结构索引

> 面向 Agent 的**代码结构快速检索表**。每条条目回答「在哪里」与「读什么才能上手」。
> 比 `project-structure.md` 精简 80%，**仅当在此找不到答案时**才加载 `*.md` 详情。
> 当代码发生结构性变化时必须更新本索引。

---

## 一、顶层一眼索引

| 目标 | 位置 | 详情文档 |
|------|------|---------|
| 路由与页面 | `app/[lang]/` | `specs/pages.md` |
| API Route | `app/api/<resource>/route.ts` | `specs/project-structure.md` §4.2 |
| UI 原子（Shadcn） | `components/ui/` | `specs/components.md` §1 |
| 通用业务组件 | `components/<feature>/` | `specs/components.md` §2 |
| 布局/Header/Sidebar/Footer | `components/partials/` | `specs/layout-structure.md` |
| DashTail Layout/Menu 二开对照（Customizer·Store·menus 映射） | `specs/structure.md` | 本文档 + `specs/layout-structure.md` |
| Layout 设计规范/页面母版 | `docs/prd/design_layout_style.md` | `specs/layout-structure.md` §13-16 |
| Provider 链 | `provider/`（配 `app/[lang]/layout.tsx`） | `specs/layout-structure.md` §2 |
| 全局状态 Store | `store/index.ts`（主题+Sidebar） | `specs/layout-structure.md` §8 |
| 业务模块 | `modules/<domain>/` | 本文件 §二 |
| 国际化字典 | `app/dictionaries/{en,bn,ar}.json` | `specs/layout-structure.md` §10 |
| 认证配置 | `lib/auth.ts` + `provider/auth.provider.tsx` | `specs/layout-structure.md` §9 |
| 菜单配置 | `config/menus.ts` | `specs/project-structure.md` §5.7 |
| 主题系统 | `config/site.ts` + `config/thems.ts` + `store/index.ts` | `specs/layout-structure.md` §11 |
| 路径别名 | `@/*` → 仓库根（唯一） | `specs/project-structure.md` §7 |

---

## 二、业务模块（`modules/<domain>/`）索引

> 以下是每个 domain 的"门口地图"，能否快速定位核心文件的关键。

### 2.1 `modules/hermes/` — Hermes AI OS Dashboard

Hermes 是核心业务模块，目录较复杂。按"主题入口"索引：

| 主题 | 核心文件 | 用途 |
|------|---------|------|
| 对外导出入口 | `modules/hermes/index.ts` | 所有被 app 层引用的符号来源 |
| 页面组件 | `modules/hermes/pages/HermesDashboardPage.tsx`, `HermesSessionsPage.tsx`, `HermesSkillsPage.tsx`, `HermesSettingsPage.tsx` | 由 `app/[lang]/(dashboard)/hermes/*/page.tsx` 挂载 |
| Copilot 运行时 | `modules/hermes/copilot/runtime.ts`, `streaming-agent.ts`, `sse.ts`, `events-mapper.ts` | SSE/AG-UI 事件管线 |
| Copilot 工具与路由 | `modules/hermes/copilot/agent-router.ts`, `agent-toolsets.ts`, `frontend-tools.ts`, `interrupt-protocol.ts` | 多 agent 路由 + 前端工具 + 中断协议 |
| Copilot 类型 | `modules/hermes/copilot/types.ts`, `generated-ui-registry.tsx`, `forwarded-props.ts`, `dashboard-context.ts` | Tool 结果契约与上下文 |
| Tool UI 总索引 | `modules/hermes/tool-ui/registry.ts`, `types.ts` | 按 tool name 定位 UI 适配器 |
| Tool UI 细分 | `tool-ui/adapters/`, `cards/`, `mappers/`, `schemas/`, `mocks/`, `fixtures/` | 见 §2.2 |
| Copilot UI 壳 | `modules/hermes/components/copilot/hermes-copilot-panel.tsx`, `hermes-tool-renderer.tsx`, `interrupt-banner.tsx`, `interrupt-form-card.tsx`, `resume-action-bar.tsx` | AI 对话面板与中断交互 |
| Dashboard UI | `modules/hermes/components/dashboard/metrics-overview.tsx`, `clickable-metric-card.tsx` | Dashboard 指标卡片 |
| Dev Preview | `modules/hermes/dev/preview-registry.ts`, `preview-config.ts`, `schema-resolver.ts`, `story-seeds.ts` + `components/dev-preview/*` | 独立预览工作台（Phase 7） |
| Stores | `stores/hermes-agent-store.ts`, `hermes-tool-ui-store.ts`, `hermes-interrupt-store.ts`, `hermes-dashboard-context-store.ts`, `hermes-preview-store.ts` | 各 UI 子状态 |
| Hooks | `hooks/use-hermes-copilot.ts`, `use-active-hermes-agent.ts`, `use-tool-render-model.ts`, `use-hermes-interrupt.ts`, `use-preview-*.ts`, `use-dashboard-context.ts`, `use-dashboard-card-injection.ts`, `use-agent-toolset.ts`, `use-schema-validation.ts` | 分别对应 Copilot/Interrupt/Preview/Dashboard |
| API | `modules/hermes/api/`, `modules/hermes/services/` | 数据访问与 Gateway 封装 |
| 测试 | `modules/hermes/tests/` | 单测（`tool-ui-registry.spec.ts`、`tool-ui-schema.spec.ts`）+ e2e 用例（`hermes-dashboard-e2e-cases.md`） |

#### 2.1.1 Hermes 对应的 `app/` 挂载页

```
app/[lang]/(dashboard)/hermes/page.tsx                       → HermesDashboardPage
app/[lang]/(dashboard)/hermes/sessions/page.tsx              → HermesSessionsPage
app/[lang]/(dashboard)/hermes/skills/page.tsx                → HermesSkillsPage
app/[lang]/(dashboard)/hermes/settings/page.tsx              → HermesSettingsPage
app/[lang]/(dashboard)/hermes/dev/layout.tsx                 → Dev 工作台布局
app/[lang]/(dashboard)/hermes/dev/tool-ui/page.tsx           → Tool UI 预览首页
app/[lang]/(dashboard)/hermes/dev/tool-ui/{finance,risk,forecast}/page.tsx  → 域预览
```

#### 2.1.2 Hermes API Route

```
app/api/copilot/route.ts              → CopilotKit Runtime（统一入口）
app/api/hermes/activity/route.ts      → 活动流
app/api/hermes/config/route.ts        → 配置
app/api/hermes/dev/fixture/route.ts   → Dev 预览 fixture
app/api/hermes/health/route.ts        → 健康检查
app/api/hermes/memory/route.ts        → 记忆
app/api/hermes/metrics/route.ts       → 指标
app/api/hermes/models/route.ts        → 模型
app/api/hermes/sessions/route.ts      → 会话
app/api/hermes/skills/route.ts        → 技能
```

### 2.2 Hermes Tool UI 子索引（领域高频查询）

| 层 | 目录 | 命名模式 | 示例 |
|----|------|----------|------|
| 适配器 | `modules/hermes/tool-ui/adapters/` | `<domain>-tool-ui-adapter.tsx` | `finance-tool-ui-adapter.tsx`、`risk-*`、`forecast-*` |
| 通用卡片 | `modules/hermes/tool-ui/cards/` | `<topic>-card.tsx` | `generic-json-card.tsx`、`generic-table-card.tsx`、`tool-loading-card.tsx`、`tool-error-card.tsx` |
| Mappers | `modules/hermes/tool-ui/mappers/` | `<domain>-result-mapper.ts` | `finance-result-mapper.ts`、`risk-*`、`forecast-*` |
| Schemas | `modules/hermes/tool-ui/schemas/` | `<domain>-tool-result-schema.ts` + `tool-result-union-schema.ts` | 全部基于 zod |
| Mocks | `modules/hermes/tool-ui/mocks/` | `<domain>-tool-result-mock.ts` + `mock-factory.ts` | 为 Dev 预览与测试提供数据 |
| Fixtures | `modules/hermes/tool-ui/fixtures/` | `<domain>-<topic>.json` | `finance-kpi.json`、`risk-exposure.json`、`forecast-summary.json` 等 |

### 2.3 `modules/finance/` — Finance 展示模块

| 主题 | 文件 |
|------|-----|
| 对外入口 | `modules/finance/index.ts` |
| 页面 | `pages/FinanceWorkbenchPage.tsx`、`ReceivablesRiskPage.tsx`、`CashflowForecastPage.tsx`、`InvoiceAnomaliesPage.tsx`、`ApprovalsAuditPage.tsx`、`ReportCenterPage.tsx` |
| 展示组件（根） | `components/metric-kpi-card.tsx`、`cashflow-trend-chart.tsx`、`aging-table.tsx`、`forecast-summary-card.tsx`、`receivable-status-card.tsx`、`risk-exposure-summary-card.tsx`、`variance-waterfall-card.tsx` |
| 按子特性分组 | `components/{anomalies,approvals,forecast,layout,receivables,reports,shared,workbench}/` |
| 类型 | `types/finance-view.ts` |
| Hooks / Services / Mocks | `hooks/`、`services/`、`mocks/` |

#### 对应的 `app/` 路由

```
app/[lang]/(dashboard)/finance/page.tsx                  → FinanceWorkbenchPage
app/[lang]/(dashboard)/finance/receivables-risk/page.tsx → ReceivablesRiskPage
app/[lang]/(dashboard)/finance/cashflow-forecast/page.tsx → CashflowForecastPage
app/[lang]/(dashboard)/finance/invoice-anomalies/page.tsx → InvoiceAnomaliesPage
app/[lang]/(dashboard)/finance/approvals/page.tsx        → ApprovalsAuditPage
app/[lang]/(dashboard)/finance/reports/page.tsx          → ReportCenterPage
```

### 2.4 `modules/risk/` — Risk 展示模块

```
types/risk-view.ts
components/risk-alert-summary-card.tsx
components/risk-exposure-table.tsx
components/credit-limit-usage-card.tsx
components/overdue-customer-list-card.tsx
```

> 无独立 `app/` 路由，组件由 Hermes Tool UI 适配器调用。

### 2.5 `modules/forecast/` — Forecast 展示模块

```
types/forecast-view.ts
components/forecast-summary-card.tsx
components/forecast-cashflow-trend-chart.tsx
components/liquidity-warning-card.tsx
components/scenario-comparison-table.tsx
```

> 无独立 `app/` 路由，组件由 Hermes Tool UI 适配器调用。

### 2.6 `modules/copilotkit/` — CopilotKit 旧版接入层

```
components/  hooks/  lib/  provider/  registry/
```

> 迁移中。新功能优先进 `modules/hermes/copilot/`；此处仅供兼容回看。

### 2.7 `modules/auth/` — 认证与权限管控模块

| 主题 | 核心文件 | 用途 |
|------|---------|------|
| 对外导出入口 | `modules/auth/stores/auth-store.ts` | Zustand Auth Store（用户/权限/workspace 状态） |
| Token 管理 | `modules/auth/lib/token-manager.ts` | 内存 Token 存储 + 自动刷新（防并发竞态） |
| API 服务 | `modules/auth/services/auth.api.ts` | register / login / refresh / logout / getMe / getWorkspaces |
| Hooks | `modules/auth/hooks/index.ts` | useAuth（登录状态） / usePermission（权限码校验） |
| 守卫组件 | `modules/auth/components/AuthGuard.tsx` | 路由守卫（未登录→/login，无workspace→/workspace/select） |
| 权限守卫 | `modules/auth/components/PermissionGuard.tsx` | 按权限码控制 UI 元素可见性 |
| Workspace 切换 | `modules/auth/components/WorkspaceSwitcher.tsx` | 下拉切换当前 workspace |
| 登录表单 | `modules/auth/components/LoginForm.tsx` | 邮箱+密码登录 |
| 注册表单 | `modules/auth/components/RegisterForm.tsx` | 邮箱+密码+确认密码+显示名 |
| 页面 | `modules/auth/pages/LoginPage.tsx`、`RegisterPage.tsx`、`WorkspaceSelectPage.tsx` | 由 `app/(auth)/` 路由挂载 |

#### 对应的 `app/` 挂载页

```
app/(auth)/login/page.tsx              → LoginPage
app/(auth)/register/page.tsx           → RegisterPage
app/(auth)/workspace/select/page.tsx   → WorkspaceSelectPage
```

### 2.8 `modules/email/` — Email 邮件工作区模块

| 主题 | 核心文件 | 用途 |
|------|---------|------|
| 对外导出入口 | `modules/email/index.ts` | `EmailWorkspacePage` / `EmailSettingsPage` |
| 页面组件 | `pages/email-workspace-page.tsx`、`pages/email-settings-page.tsx` | 工作区布局 cookie；设置占位说明 |
| 工作区组件 | `components/email-workspace.tsx` | 未绑定账号 CTA、侧栏账号卡片+真实 folders+聊天、列表/详情、撰写浮层 |
| 账号与附件 | `email-account-form.tsx`、`email-account-card.tsx`、`email-attachment-list.tsx` | 绑定/编辑/测试/删除；附件 Bearer 下载 |
| 子组件 | `email-{header,sidebar-nav,list,detail,compose-form,spam-dialog,contact-list,chat-box,labels}.tsx` | 列表/详情/撰写接 `@portal/shared` 契约 |
| Hooks / Stores | `hooks/use-email-sync.ts`、`hooks/use-email-permission.ts`、`stores/email-store.ts`、`stores/email-account-store.ts` | 同步、RBAC 宽松校验、选中邮件与账号缓存 |
| Services / Types / Lib | `services/email-api.ts`、`types/email-result.ts`、`lib/email-errors.ts` 等 | `EmailResult<T>` 全量 Phase 1 API；错误归一化 |
| 测试 | `modules/email/tests/*.test.ts` | Vitest（`pnpm test` 使用 `vitest.config.ts`） |

#### 对应的 `app/` 挂载页

```
app/[lang]/(dashboard)/(apps)/email/page.tsx → EmailWorkspacePage
```

### 2.9 `modules/workspace/` — Workspace 壳（明细应用文件树面板）

用于“业务明细应用 Workspace Layout”中的 `workspace files` 区块（文件树/目录），作为主内容区旁的工作区资源入口（文档、工件、执行产物等）。

| 主题 | 核心文件 | 用途 |
|------|---------|------|
| 文件树面板 | `modules/workspace/components/WorkspaceFilesPanel.tsx` | Workspace files（tree/explorer）+ 搜索 + 展开/折叠 |
| Mock 数据 | `modules/workspace/mocks/workspace-files.ts` | 开发期 mock 文件树数据源（后续替换为真实 workspace） |

---

## 三、全局共享资源索引

| 资源 | 位置 | 说明 |
|------|------|------|
| Server Action（全局） | `action/auth-action.ts`, `calendar-action.ts`, `project-action.ts` | 模块级 action 进 `modules/<domain>/services/` |
| 通用 Hook | `hooks/use-media-query.ts`, `use-mounted.ts` | 跨域才放这里 |
| 通用工具 | `lib/utils.ts` (`cn`), `lib/type.ts`, `lib/interface.ts` | |
| 图表选项 | `lib/appex-chart-options.ts` | ApexCharts 预设 |
| 认证配置 | `lib/auth.ts` | NextAuth 选项 |
| Shadcn 组件清单 | 见 `specs/components.md` §1 | 50+ 组件 |
| SVG 图标 | `components/svg/index.ts` | 约 90+ 图标 |

---

## 四、开发工具与生成产物

| 资源 | 位置 | Agent 是否应读 |
|------|------|-------------|
| Storybook 配置 | `.storybook/main.ts`, `preview.tsx` | 仅改 storybook 时 |
| Story 路径 | `stories/`（镜像源文件路径） | 按需 |
| Story 生成脚本 | `scripts/gen-*.py` | 仅改生成逻辑时 |
| AST 扫描 | `tools/ast-grep/` + `generated/raw/*.json` | **默认跳过**，大体积且信息已被 specs 汇总 |

---

## 五、索引更新规则

修改代码结构后必须同步本文件：

1. 如果是 **modules/<domain>/** 下新增/重命名顶级目录：更新 §2。
2. 如果是新增 `app/` 路由：更新 §2 对应子节的"挂载页"块。
3. 如果是新增全局 Hook / Store / util：更新 §3。
4. 深层详情（模式、示例、数据流）仍放在 `specs/*.md` 对应详情文档里，本索引只做**指路**。
