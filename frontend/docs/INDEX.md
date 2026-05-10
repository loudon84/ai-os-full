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
| 规约 | `docs/conventions/` | 命名与目录规则 | 低 |
| 代码规格 | `specs/` | 现有代码结构快照 | 跟随代码 |
| 产品需求 | `docs/prd/` | 模块/阶段 PRD | 阶段性新增 |
| README | `README.md` | 对外入门 | 低 |

---

## 二、规约（`docs/conventions/`）

| 文档 | 大小 | 触发词 | 必读场景 |
|------|------|--------|----------|
| `docs/conventions/naming.md` | ~5 KB | 命名、重命名、rename、kebab、PascalCase | 新建/重命名文件、导出符号 |
| `docs/conventions/directories.md` | ~6 KB | 放哪里、归属、目录、放在 modules 还是 components | 拿不准代码/文档落点时 |

> ⚠️ 有争议先查这两个文件，再继续写代码。

---

## 三、代码规格（`specs/`）

| 文档 | 大小 | 关注 | 触发词 | 跳过条件 |
|------|------|------|--------|----------|
| `specs/INDEX.md` | ~4 KB | **代码结构索引** | 任何「在哪里」类问题 | 从不跳过 |
| `specs/project-structure.md` | ~15 KB | 全量目录+数据流+别名 | 项目结构、数据流、路由组、别名 | 只做单点编辑时 |
| `specs/components.md` | ~13 KB | Shadcn/业务组件清单 | Button/Dialog/Form/组件可用性 | 不引用既有组件时 |
| `specs/pages.md` | ~14 KB | 全部页面路由一览 | 页面、路由、URL、error-page/auth | 不新增页面时 |
| `specs/layout-structure.md` | ~14 KB | Layout/Provider 嵌套 | layout、Provider、认证、i18n、RTL | 不改布局/认证时 |

---

## 四、产品需求（`docs/prd/`）

> PRD 单个文件最大 ~52 KB。**强烈建议**Agent 先读标题节，再 `offset/limit` 分段读。

### 4.1 基座与接入层

| 文档 | 大小 | 主题 | 触发词 | 关联代码 |
|------|------|------|--------|---------|
| `docs/prd/integrate_copilot.md` | ~52 KB | React 18 前端接入 CopilotKit 的总体方案 | CopilotKit、AI OS、`/api/copilot`、全站 AI | `app/api/copilot/`、`ai/`、`modules/copilotkit/` |
| `docs/prd/form/core_target.md` | ~55 KB | Form 模块：AI-OS Form Spec 协议 + 动态表单运行时 MVP | form、动态表单、RJSF、AiOsFormSpec、`/form/playground`、`/api/forms/submit` | `modules/form/`、`app/[lang]/(dashboard)/form/`、`app/api/forms/` |
| `docs/prd/generative-ui.md` | ~6 KB | Generative UI — AI 动态生成 sandbox React 组件 | Generative UI、sandbox、动态 UI、AG-UI 事件 | `modules/generative-ui/`、`app/[lang]/(dashboard)/generative-ui/` |
| `docs/prd/document/core_target.md` | ~52 KB | Documents 模块（Univer 表格）接入方案 | documents、文档、Univer、表格、snapshot、version | `modules/documents/`、`app/[lang]/(dashboard)/documents/` |
| `docs/prd/document/core_spec.md` | ~10 KB | Documents MVP 核心 spec（前端模块骨架 + Univer 约束） | documents spec、Univer adapter、readonly、dirty、save | `modules/documents/` |
| `docs/prd/document/spec_detail.md` | ~52 KB | Documents 系统明细 spec（域模型/存储/契约/实现） | Document API、MinIO、PostgreSQL、permission、version_conflict | `apps/backend/`、`modules/documents/` |
| `docs/prd/email/core_email_prd.md` | ~45 KB | Email 后端真实实现契约（Express + Drizzle + IMAP/POP3/SMTP + 附件 + 审计） | email backend、邮件后端、IMAP、POP3、SMTP、邮箱账号、收发、同步 | `backend/src/routes/email.ts`、`backend/src/services/email/`、`packages/db`、`packages/shared` |

### 4.2 Hermes Dashboard 分阶段 PRD

> 8 个 phase 是递进的代码骨架说明。Agent 按"任务对应哪一阶段"加载**单个**文件。

| 阶段 | 文件 | 大小 | 本期目标 | 新增代码落点 |
|------|------|------|----------|-------------|
| Phase 1 | `hermes_dashboard_phase1.md` | ~45 KB | Dashboard 目录树 + 关键 page/hooks/route 骨架 | `modules/hermes/`、`app/[lang]/(dashboard)/hermes/` |
| Phase 2 | `hermes_dashboard_phase2.md` | ~10 KB | Copilot 前端工具层 + `/api/copilot` Route + Dashboard 继续会话 | `modules/hermes/copilot/`、`app/api/copilot/` |
| Phase 3 | `hermes_dashboard_phase3.md` | ~32 KB | Streaming SSE + Tool UI 渲染 + 多 Agent 路由（risk/forecast） | `modules/hermes/copilot/streaming-agent.ts` 等 |
| Phase 4 | `hermes_dashboard_phase4.md` | ~24 KB | Agent-specific Toolset + `pre_llm_call` 上下文注入 + Resume/Interrupt | `modules/hermes/copilot/agent-toolsets.ts`、`interrupt-protocol.ts` |
| Phase 5 | `hermes_dashboard_phase5.md` | ~33 KB | 完整 Tool UI 卡片库；领域展示适配层示例 | `modules/hermes/tool-ui/adapters/` |
| Phase 6 | `hermes_dashboard_phase6.md` | ~33 KB | Risk/Forecast 专属展示组件 + Tool Result Schema + Mock 工厂 + 联调用例 | `modules/risk/`、`modules/forecast/`、`modules/hermes/tool-ui/schemas/`、`mocks/` |
| Phase 7 | `hermes_dashboard_phase7.md` | ~24 KB | Storybook / Dev Preview 页面 + Mock 切换面板 + Tool UI 调试工作台 | `modules/hermes/dev/`、`stories/modules/hermes/`、`app/[lang]/(dashboard)/hermes/dev/tool-ui/` |
| Phase 8 | `hermes_dashboard_phase8.md` | ~24 KB | 同 Phase 7（历史快照，先读 phase7） | 同上 |

### 4.3 如何挑对 PRD 文件

```
任务涉及…               → 优先读
─────────────────────────────────
"把 AI 助手装进来"        → integrate_copilot.md
"Hermes 基础骨架"         → phase1
"Hermes 实现对话"         → phase2
"Hermes SSE/多 agent"     → phase3
"Hermes 中断/恢复"        → phase4
"Hermes 卡片库"          → phase5
"Risk/Forecast 展示"      → phase6
"Storybook/Dev 预览"      → phase7
```

---

## 五、生成/辅助资源（Agent **默认跳过**）

| 路径 | 说明 | 为何跳过 |
|------|------|----------|
| `generated/raw/*.json` | AST 扫描原始输出 | 体积大、信息已被 specs 汇总 |
| `tools/ast-grep/` | 代码扫描配置 | 仅更新扫描规则时读 |
| `scripts/*.py` | Storybook 生成脚本 | 仅改生成逻辑时读 |
| `.storybook/` | Storybook 配置 | 仅改 Storybook 时读 |
| `stories/**` | 已生成的 stories | 仅改具体 story 时读 |
| `debug-storybook.log` | 调试日志 | 无参考价值 |

---

## 六、索引维护规则

新增/重命名文档时**必须**同步更新本文件：

1. 把文档加入上面正确的分区表。
2. 注明 **大小估计**、**触发词**、**必读/跳过场景**。
3. 更新 `AGENTS.md` 第三节「文档目录一句话地图」。
4. 若是新类别，先看 `docs/conventions/directories.md` 确认落点。

> 本索引不复制 PRD/specs 的原文；它只提供「去哪里找」。保持小体积是它最大的价值。
