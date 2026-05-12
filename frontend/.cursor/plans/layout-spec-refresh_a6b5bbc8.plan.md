---
name: layout-spec-refresh
overview: 基于 `docs/prd/design_layout_style.md` 抽取可执行的布局规范与页面母版定义，更新 `specs/layout-structure.md`（从“现状剖析”补全到“规范/触发规则”），并同步更新 `specs/INDEX.md` 作为指路索引。
todos:
  - id: layout-structure-add-guidelines
    content: 在 specs/layout-structure.md 追加 Layout 设计规范、6 个页面母版、AI 三栏强制规则、明细 WorkspaceLayout 显式启用规则
    status: completed
  - id: specs-index-add-layout-entry
    content: 在 specs/INDEX.md 补充“Layout 设计规范/页面母版”指路条目，并新增 modules/workspace 索引
    status: completed
isProject: false
---

# 基于 design_layout_style 的 Layout 规格更新

## 目标
- 将 `[docs/prd/design_layout_style.md](docs/prd/design_layout_style.md)` 中的“企业 OS Shell + Copilot + 多模块工作区”布局设计，提炼为**项目可执行的 Layout 规范**，并写回到 `[specs/layout-structure.md](specs/layout-structure.md)`（作为代码侧的 Layout 说明/约束）。
- 同步更新 `[specs/INDEX.md](specs/INDEX.md)`：让 Agent/开发者能一眼找到“布局规范”“页面级 Workspace Layout（明细页）”与相关文件入口。

## 关键结论（来自你已确认的选择）
- **三栏工作系统（ModuleSidebar | WorkspaceContent | AI Copilot）**：在 specs 里作为 **AI/Agent/Workflow/任务执行类页面强制**（其它页面仅作为参考，不写成默认必须）。
- **业务明细应用 layout（左侧菜单默认隐藏 | workspace files | 主内容 | Copilot）**：在 specs 里采用 **显式页面级 layout wrapper** 触发（而不是按 URL 自动猜测）。

## 具体修改点

### 1) 更新 `specs/layout-structure.md`
在保持现有“RootLayout/Provider/DashboardLayout 结构剖析”不变的前提下，新增/补强以下章节（只增补、少改动原有段落）：

- 新增 **“十三、Layout 设计规范（从 design_layout_style 提炼）”**：
  - 引用并摘要 `design_layout_style.md` 的核心定位：企业 OS Shell + Copilot 工作侧栏 + 多模块工作区。
  - 明确“哪些文件禁止改动”仍以现有壳为准：`app/[lang]/layout.tsx`、`app/[lang]/(dashboard)/layout.tsx`、`provider/*`（除非 PRD 明确）。

- 新增 **“十四、页面母版（Page Templates）与适用范围”**（来自 design_layout_style 的 6 个母版）：
  - `WorkspaceDashboardTemplate`
  - `DataManagementTemplate`
  - `AgentWorkspaceTemplate`
  - `ExecutionDetailTemplate`
  - `DocumentWorkspaceTemplate`
  - `SettingsTemplate`
  - 对每个母版给出：适用模块/页面类型、块结构顺序（PageHeader/KPI/FilterBar/Table/Timeline/Inspector 等），并标注“AI 页面强制包含的区块”（Prompt/Context/Execution/Result/References/Actions）。

- 新增 **“十五、AI 页面三栏工作系统（强制）”**：
  - 用 ASCII 图描述：左模块导航 + 中央工作区 + 右 Copilot。
  - 说明 Copilot 右侧栏：全局渲染、可开关、内容区联动（`COPILOT_SIDEBAR_WIDTH`）。

- 新增 **“十六、业务明细应用 Workspace Layout（显式启用）”**：
  - 明确结构：`Sidebar(默认隐藏/收起)` | `WorkspaceFiles` | `MainContent` | `Copilot`。
  - 明确触发方式：在明细页目录下提供 `layout.tsx`（或模块 page 组件内包裹 `WorkspaceLayout` 组件），用显式 wrapper 启用。
  - 给出推荐目录落点（不改代码，只给规范）：
    - `modules/workspace/components/WorkspaceFilesPanel.tsx`
    - `modules/workspace/mocks/workspace-files.ts`
  - 给出最小交互规范（文档级）：左侧菜单默认收起、Workspace files 支持搜索/展开、主内容支持滚动与最小宽度、Copilot 可隐藏。

> 备注：`specs/layout-structure.md` 当前到“十二、新增页面的 Layout 接入方式”结束；上述新增章节将追加到文件末尾，避免破坏既有索引与行文。

### 2) 更新 `specs/INDEX.md`
- 在“顶层一眼索引”补充一条**布局设计规范入口**（保持该文件“只指路不复制内容”的原则）：
  - 新增目标：`Layout 设计规范/页面母版` → 位置：`docs/prd/design_layout_style.md` → 详情文档：`specs/layout-structure.md`（用于代码结构与落点）

- 在“业务模块索引”新增一个轻量条目：
  - **`modules/workspace/` — Workspace 壳（明细应用文件树面板）**
    - 核心文件：`modules/workspace/components/WorkspaceFilesPanel.tsx`、`modules/workspace/mocks/workspace-files.ts`
    - 用途：为“业务明细应用 layout”提供 workspace files 区块（文件树/目录）

## 验收标准
- `specs/layout-structure.md` 同时回答：
  - 现状壳（layout/provider）怎么工作
  - 目标壳（AI 三栏 / 明细 workspace layout）怎么定义、何时用、怎么启用（显式 wrapper）
  - 6 个页面母版在项目中的“使用边界/块结构顺序”
- `specs/INDEX.md` 能让新同学/Agent 在 30 秒内找到：
  - 布局剖析文档（layout-structure）
  - 布局设计规范（design_layout_style）
  - 明细 workspace files 面板所在模块（modules/workspace）

## 影响文件
- `[specs/layout-structure.md](specs/layout-structure.md)`
- `[specs/INDEX.md](specs/INDEX.md)`