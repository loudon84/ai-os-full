---
name: ai-os-portal DESIGN.md
overview: 为 `ai-os-portal` 增加一份可被 Agent 直接消费的 `DESIGN.md` 设计系统规范，参考 awesome-design-md 的 Stitch 风格结构，并与现有 Tailwind/Shadcn 的语义 token（CSS 变量）保持一致。
todos:
  - id: read_theme_tokens
    content: 梳理现有 CSS 变量与 Tailwind 语义 token（globals.scss/theme.scss/tailwind.config.ts）并形成 DESIGN.md 的 token 对照
    status: completed
  - id: write_design_md
    content: 在根目录新增 DESIGN.md，按 Stitch/awesome-design-md 的章节结构写入 ai-os-portal 设计系统（基于现有 token）
    status: completed
  - id: update_docs_index
    content: 更新 docs/INDEX.md，把 DESIGN.md 纳入按需加载索引（含触发词与必读场景）
    status: completed
  - id: optional_update_agents
    content: （可选）更新 AGENTS.md：UI 相关任务额外读取 DESIGN.md
    status: completed
isProject: false
---

# ai-os-portal 设计系统规范（DESIGN.md）落地计划

## 目标与范围
- **目标**：在项目根目录新增 `DESIGN.md`，让后续任何页面/组件生成都能遵循一致的视觉与交互规范（而不是“凭感觉写 UI”）。该文件结构参考 awesome-design-md 的 Stitch `DESIGN.md` 范式（主题/色彩/字体/组件/布局/层级/Do&Don't/响应式/Prompt 指南）。
- **对齐现状**：严格复用你们现有 Tailwind 语义色与 CSS 变量体系，不引入新 UI 库、不魔改 `components/ui/`。

## 关键现状（用于写进 DESIGN.md 的“真实约束”）
- **颜色与语义 token**：Tailwind 扩展颜色来自 CSS 变量，例如 `background/foreground/border/input/ring` 与 `primary.* / default.*` 等（见 `tailwind.config.ts`）。
- **变量来源**：默认 token 在 `app/assets/scss/globals.scss`（`:root` 与 `.dark`），并且存在多套 theme（如 `.theme-zinc/.theme-slate/...`）在 `app/assets/scss/theme.scss`。
- **架构/页面生成约束**：`docs/prd/design_init.md` 已定义“企业 AI Work OS 气质”“Page Spec First”“shadcn/ui only”“必须覆盖 Loading/Empty/Error/Forbidden”等规则。

## 实施方案
- 在根目录新增 `[DESIGN.md](DESIGN.md)`，内容包含：
  - **Visual_Theme_&_Atmosphere**：定义 ai-os-portal 的气质（企业级、克制、高信息密度、强状态/强任务/可追踪），并明确禁止营销风、装饰性大渐变、纯卡片堆砌。
  - **Color_Palette_&_Roles**：用“语义角色 → 对应 token 名称”的方式描述（例如 `Background=bg-background`、`Text=text-foreground`、`Primary=primary.*`、`Status=success/warning/info/destructive`），强调 **禁止硬编码色值**，优先 `bg-*/text-*/border-*` 语义类。
  - **Typography_Rules**：基于当前根布局使用的 `Inter`（见 `app/[lang]/layout.tsx`）定义标题/正文/说明/代码（如需要 monospace）层级与字重规则，并给出“信息密度优先”的行高与间距建议。
  - **Component_Stylings**：以 shadcn/ui 组件为中心（`Button/Input/Select/Dialog/Sheet/Tabs/Table/Badge/Toast/Skeleton` 等），规定：
    - 按钮层级（primary/secondary/ghost/destructive）、禁用态、loading 态
    - 表单校验（错误提示位置/样式）、必填标识
    - 表格/列表的密度、表头、行 hover、空态
    - AI 页面特有区块（输入区/上下文/执行状态/结果/引用/反馈）在视觉上如何分组
  - **Layout_Principles**：Dashboard 页面结构（PageHeader + 内容区 + actions），网格/间距尺度、卡片与分割线使用原则。
  - **Depth_&_Elevation**：与现有 `boxShadow.sm`（见 `tailwind.config.ts`）对齐，规定“何时用阴影 vs 边框”。
  - **Do’s_and_Don’ts**：把 `docs/prd/design_init.md` 的禁忌与强制项（状态覆盖、模块边界、shadcn/ui only、不要改 layout/provider）提炼为设计层守则。
  - **Responsive_Behavior**：断点与折叠策略（基于 Tailwind 默认断点 + 项目 container screens），以及表格/侧栏在小屏行为。
  - **Agent_Prompt_Guide**：给后续开发/Agent 一段可复制的提示词（比如“生成页面前先读 DESIGN.md + Page Spec；所有颜色只用语义 token；必须包含四态”等）。

## 文档索引联动
- 更新 `[docs/INDEX.md](docs/INDEX.md)`：在“规约/资源”区域新增一条 `DESIGN.md` 的入口说明（触发词：design system / UI风格 / 视觉规范 / 组件样式），让 Agent 按需加载更顺畅。
- 可选（如果你同意）：在 `AGENTS.md` 的“入口级必读”里增加一句“若任务涉及 UI，请额外读取 `DESIGN.md`”。（这会改变 Agent 默认阅读路径，属于轻微流程增强，计划里会单独标记。）

## 验收标准（完成后如何判断有效）
- 新增 `DESIGN.md` 能清晰回答：
  - 页面要“像什么”（气质）
  - 颜色/字体/间距怎么用（token 与层级）
  - 常见组件在各种状态下怎么表现
  - AI 页面信息架构如何映射到可复用的 UI 区块
- 文档不引入任何与现有实现冲突的“新 token / 新 UI 框架”，只约束使用方式。

## 主要参考
- awesome-design-md（DESIGN.md 作为可读设计系统文档的概念与章节结构）。
- `docs/prd/design_init.md`（你们项目对 Cursor/Agent 的 UI 生成约束）。
- `tailwind.config.ts`、`app/assets/scss/globals.scss`、`app/assets/scss/theme.scss`（现有 token 与主题实现）。