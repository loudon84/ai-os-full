# smc-coworker-aios / portal

基于 Next.js 14 App Router 的 AI OS 门户前端，融合 CopilotSMC UI 壳层与 Hermes AI 业务模块（finance / risk / forecast / copilotkit）。

---

## 快速开始

```bash
pnpm install
pnpm dev
# http://localhost:3000
```

推荐使用 `pnpm`（仓库已提交 `pnpm-lock.yaml`）。Node 版本遵循 Next.js 14 的要求。

---

## 面向 AI Agent / 新协作者

**第一读物**：

| 文档 | 作用 |
|------|------|
| [`AGENTS.md`](./AGENTS.md) | Agent 工作手册与 Token 节流读取策略 |
| [`docs/INDEX.md`](./docs/INDEX.md) | 文档全景索引（PRD、规约、specs 的目录） |
| [`specs/INDEX.md`](./specs/INDEX.md) | 代码结构索引（哪里有什么） |

**规约**：

| 文档 | 作用 |
|------|------|
| [`docs/conventions/naming.md`](./docs/conventions/naming.md) | 编码与命名规则（kebab-case 文件 / PascalCase 组件等） |
| [`docs/conventions/directories.md`](./docs/conventions/directories.md) | 文档与代码归属目录规则 |

**产品需求**：

- [`docs/prd/`](./docs/prd/) — 模块与阶段 PRD（finance_module、integrate_copilot、hermes_dashboard_phase1~8）

**代码规格**：

- [`specs/`](./specs/) — project-structure / components / pages / layout-structure（详情）

---

## 核心技术栈

Next.js 14 · TypeScript 5 · React 18 · Tailwind · Shadcn/UI · Zustand · React Query · CopilotKit · ApexCharts / Recharts / Chart.js / Unovis · NextAuth.js

详见 [`specs/project-structure.md`](./specs/project-structure.md) §一。

---

## 目录一览（顶层）

```
app/           Next.js App Router（路由与 API Route）
components/    UI 原子与通用业务组件
modules/       业务模块：hermes / finance / risk / forecast / copilotkit
provider/      全局 Provider 链
config/        主题 / 菜单 / 站点配置
lib/ hooks/    跨域通用工具与 Hook
store/         全局 Zustand（主题、侧边栏）
action/        Server Action（跨模块）
specs/         代码结构规格
docs/          PRD 与规约
stories/       Storybook
tools/         AST 扫描等工具
```

完整结构请读 [`specs/INDEX.md`](./specs/INDEX.md)，必要时再扩到 [`specs/project-structure.md`](./specs/project-structure.md)。

---

## 开发约定（精华）

- 文件名 `kebab-case`，React 组件 `PascalCase`。
- 业务代码进 `modules/<domain>/`，不要魔改 `components/ui/*`。
- 不修改 `app/[lang]/layout.tsx` 的 Provider 链（除非 PRD 明确授权）。
- 新增文档必须同步登记到 [`docs/INDEX.md`](./docs/INDEX.md)。
- Commit：`<type>(<scope>): <中文概述>`。

完整规则见 [`docs/conventions/`](./docs/conventions/)。
