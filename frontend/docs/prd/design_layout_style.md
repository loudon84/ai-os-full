基于 `ai-os-portal` 的定位，不建议把主体 layout 参考做成「单一后台模板」。更合适的是：**企业操作系统 Shell + AI Copilot 工作侧栏 + 多模块工作区**。

你们现有项目已经具备这个基础：技术栈是 Next.js 14、React 18、Tailwind、Shadcn/UI、Zustand、React Query、CopilotKit；新功能应挂到 `app/[lang]/(dashboard)/`，Shadcn 基座不魔改，业务代码落到 `modules/<domain>/`。 当前 Dashboard Layout 已有 Header、Sidebar、ContentWrapper、Footer、ThemeCustomize，并且 Copilot 打开时内容区会联动右侧 400px 宽度。

## 1. 主体 Layout 参考方向

### A. Stripe Dashboard 型：财务 / 运营 / 风险主控台

适合模块：

* Finance Workbench
* Cashflow Forecast
* Risk Exposure
* Invoice / AR / AP
* Report Center

结构：

```txt
Left Sidebar: 模块导航
Top Header: 全局搜索 / 通知 / 用户 / 组织
Main Content:
  PageHeader
  KPI Strip
  FilterBar
  DataTable / Chart Grid
Right Drawer:
  详情 / 审批 / AI 解释
Global Copilot Sidebar:
  跨页面 AI 助手
```

设计特点：

* 信息密度高
* 表格、指标、趋势图并重
* 右侧详情 Drawer 承载 drill-down
* 主操作明确，例如「生成预测」「发起审批」「导出报告」

用于 AI-OS 时，Stripe 型最适合作为 **Finance / Risk / Admin 的默认页面母版**。

---

### B. Linear / Jira 型：任务、Agent Run、Workflow 执行中心

适合模块：

* Task Center
* Agent Run Detail
* Workflow Execution
* Approval / Ticket
* Human-in-the-loop 审批

结构：

```txt
Left Sidebar: 工作区 / 项目 / 队列
Main Content:
  状态分组
  任务列表
  执行状态
  Owner / Priority / SLA
Right Inspector:
  任务详情
  Agent Steps
  Audit Log
Bottom Action Bar:
  Approve / Reject / Retry / Assign
```

设计特点：

* 强调状态流转
* 每条任务必须能追踪责任人、时间、执行状态
* 右侧 Inspector 比弹窗更适合企业后台
* Agent 执行过程不要只做聊天，应做成 Timeline / Step / Log

用于 AI-OS 时，这一类应成为 **任务中心、审批中心、Agent 执行页** 的主要参考。

---

### C. Slack / Teams 型：人与 AI 共存的协同工作区

适合模块：

* 会话中心
* 多 Agent 协作页
* 部门工作区
* Bot 工作页

结构：

```txt
Left Rail:
  工作区 / Agent / Channel
Middle:
  会话流 / 任务流 / 文件流
Right Panel:
  Context / 引用 / 执行结果 / 成员
Composer:
  Prompt 输入 + 附件 + 工具选择
```

设计特点：

* 左侧不是纯菜单，而是工作空间切换
* 中间是持续流式工作内容
* 右侧是上下文与结果
* 底部输入区是核心操作入口

用于 AI-OS 时，适合 **AI 助手工作页、会话中心、部门协作页**。但不能做成普通聊天产品，要叠加任务状态、引用来源、执行结果和审批入口。

---

### D. Notion / Linear Docs 型：知识、文档、内容生产工作台

适合模块：

* Knowledge Base
* Document Studio
* Article Studio
* Prompt / Workflow 文档化
* Datasheet / Univer 文档工作台

结构：

```txt
Left Sidebar:
  文档树 / 知识库 / 最近打开
Main Editor:
  Block Editor / Datasheet / Markdown
Right AI Panel:
  摘要 / 改写 / 引用 / RAG 来源
Top Bar:
  保存状态 / 分享 / 权限 / 版本
```

设计特点：

* 主内容区最大化
* AI 不应该覆盖编辑器，而是右侧辅助
* 必须有保存状态、版本、引用来源
* 文档型页面最好弱化 Footer

用于 AI-OS 时，这是 **文档系统、知识库、Univer、文章生成** 的主参考。

---

### E. Retool / Vercel Console 型：开发者与运营配置后台

适合模块：

* Agent 配置
* Workflow 配置
* Tool / MCP / Skill 管理
* Integration 设置
* RBAC / Tenant / System Settings

结构：

```txt
Left Sidebar:
  系统模块
Main Content:
  Tabs
  FormSection
  Config Table
  JSON / Schema Editor
Right Preview:
  测试运行 / 配置说明 / 日志
```

设计特点：

* 配置项分组清晰
* 表单与表格为主
* 右侧预览或测试运行区很重要
* 所有危险操作放到独立 Danger Zone

用于 AI-OS 时，适合 **管理员、运营人员、AI 产品设计师** 使用的配置类页面。

---

## 2. AI-OS 推荐主 Layout：三栏工作系统

你们的主体 layout 最适合沉淀成这个模型：

```txt
┌──────────────────────────────────────────────────────────────┐
│ Global Header                                                  │
│ Logo / Command Search / Env / Notifications / User / AI入口     │
├───────────────┬──────────────────────────────┬───────────────┤
│ Module Sidebar│ Workspace Content             │ AI Copilot     │
│               │                              │ Sidebar        │
│ - Dashboard   │ PageHeader                    │               │
│ - Agents      │ Filters / Tabs                │ Context       │
│ - Tasks       │ Table / Cards / Editor        │ Suggestions   │
│ - Workflow    │ Timeline / Result             │ Tool Calls    │
│ - Knowledge   │ Empty/Loading/Error           │ References    │
│ - Finance     │                              │ Actions       │
└───────────────┴──────────────────────────────┴───────────────┘
```

现有布局已经支持 Header、Sidebar、ContentWrapper、移动端 Sidebar、HeaderSearch 和主题定制面板；Provider 链也已经包含 Auth、React Query、Theme、CopilotKit、DirectionProvider。 所以 Cursor 不应该重写全局 layout，而应基于现有壳扩展页面级 layout。

---

## 3. 不同模块的 Design 参考映射

| AI-OS 模块      | 推荐参考                                   | 页面结构                                  |
| ------------- | -------------------------------------- | ------------------------------------- |
| Dashboard 工作台 | Stripe + Vercel Console                | KPI + 任务 + 告警 + 快捷操作                  |
| AI 助手广场       | Slack App Directory + OpenAI GPTs      | Bot 卡片 + 分类 + 权限 + 使用状态               |
| AI 助手工作页      | Slack + ChatGPT Enterprise + Linear    | 会话流 + 上下文 + 执行状态 + 右侧结果               |
| 会话中心          | Slack / Teams                          | Thread 列表 + 消息区 + 详情侧栏                |
| 任务中心          | Linear / Jira                          | Table/List + 状态筛选 + 右侧详情              |
| Workflow 执行页  | Retool + Temporal UI + Flowise         | Step Timeline + Logs + Result + Retry |
| 知识库管理         | Notion + Confluence                    | 文档树 + 文档表 + 解析状态 + RAG 引用             |
| 文件中心          | Dropbox Business + Google Drive        | 文件表格 + 权限 + 处理状态 + 预览                 |
| 审批 / 工单       | Jira Service Management                | 队列 + SLA + 审批动作 + 审计                  |
| 组织 / RBAC     | Vercel Team Settings + Stripe Settings | 用户表 + 角色矩阵 + 权限策略                     |
| 系统设置          | Retool / Vercel Settings               | Tabs + FormSection + Danger Zone      |

---

## 4. Cursor 生成页面时的 Layout 规则

给 Cursor 的规则应明确：

```md
# AI-OS Portal Layout Design Rules

## 1. 不允许修改全局壳
禁止修改：
- app/[lang]/(dashboard)/layout.tsx
- app/[lang]/layout.tsx
- provider/*
- components/ui/*

除非 PRD 明确要求。新功能默认挂到 app/[lang]/(dashboard)/<module>/。

## 2. 页面必须使用现有 Dashboard Shell
所有业务页面自动继承：
- Auth 认证保护
- Header
- Sidebar
- Footer
- ThemeCustomize
- GlobalCopilotProvider
- DirectionProvider

## 3. 新功能页面必须采用 Page Workspace 模型
页面结构顺序：
1. PageHeader
2. Primary Action
3. Filter/Search 或 Tabs
4. Main Content
5. Right Drawer / Detail Panel
6. Empty / Loading / Error / Forbidden 状态

## 4. AI 页面必须额外包含
- Prompt 输入区
- Context 区
- Execution State 区
- Result 区
- References / Sources
- Feedback / Retry / Approve 操作

## 5. 页面级 Copilot 规则
如果页面涉及 AI 操作，必须注册 PageCopilotContext：
- pageId
- pageTitle
- module
- summary
- actions
- selectedEntity
- permissions

不得在页面里重新创建全局 Copilot Provider。
```

这一点和现有开发指引一致：新增 Dashboard 页面只需放入 `app/[lang]/(dashboard)/my-page/`，页面会自动获得认证保护、Header、Sidebar、Footer 和 ThemeCustomize。

---

## 5. 推荐沉淀 6 个页面母版

### 5.1 `WorkspaceDashboardTemplate`

用于首页、财务工作台、风险工作台。

```txt
PageHeader
KpiGrid
AlertStrip
TwoColumnGrid
RecentTasks
RightInsightPanel
```

### 5.2 `DataManagementTemplate`

用于用户、任务、文件、知识库、审批列表。

```txt
PageHeader
FilterBar
DataTable
BulkActionBar
RightDrawer
```

### 5.3 `AgentWorkspaceTemplate`

用于 AI 助手工作页。

```txt
AgentHeader
ContextPanel
MessageOrTaskStream
ExecutionTimeline
ResultPanel
PromptComposer
```

### 5.4 `ExecutionDetailTemplate`

用于 Workflow / Agent Run 详情。

```txt
RunHeader
RunStatusSummary
ExecutionTimeline
StepLogViewer
ArtifactResult
AuditInfo
```

### 5.5 `DocumentWorkspaceTemplate`

用于文档、知识库、Univer。

```txt
DocumentTopBar
DocumentTree
EditorCanvas
RightAIPanel
VersionHistoryDrawer
```

### 5.6 `SettingsTemplate`

用于系统设置、集成、RBAC。

```txt
SettingsSidebar
SettingsTabs
FormSection
ConfigTable
DangerZone
```

---

## 6. 当前阶段的建议取舍

不要一上来重做视觉系统。当前优先级应是：

1. **保留现有 CopilotSMC 壳**
   它已经有 Header、Sidebar、多布局、主题、RTL、Copilot 侧栏联动。

2. **新增 `docs/design/layout-patterns.md`**
   定义上面 6 个页面母版，作为 Cursor 生成页面前必须读取的 design 规则。

3. **新增 `modules/<domain>/components/layout/`**
   每个业务模块不要重复造 layout，统一组合：

   * `ModulePageHeader`
   * `ModuleFilterBar`
   * `ModuleRightDrawer`
   * `ModuleEmptyState`
   * `ModuleExecutionPanel`

4. **AI 页面统一走右侧 Copilot + 页面上下文注册**
   不要每个页面单独做 AI 聊天框。现有数据流是 `CopilotSessionPanel → /api/copilot → CopilotRuntime → Hermes LLM`，应继续复用。

5. **Cursor 每次生成页面前必须先判断页面类型**
   先分类为 Dashboard / DataTable / AgentWorkspace / ExecutionDetail / Document / Settings，再套对应母版。这样比直接让 Cursor “生成一个页面”稳定得多。
