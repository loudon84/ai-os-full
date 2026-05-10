---
version: alpha
name: ai-os-portal
description: 企业级 AI Work Operating System（AI OS Portal）前端的可执行设计系统规范。与项目现有 Tailwind + shadcn/ui + CSS 变量 token 体系对齐，约束页面在高信息密度、强状态、强任务导向场景下的一致视觉与交互。
---

## Overview

ai-os-portal 是企业内部的 AI Work 操作系统前端门户。它不是营销官网，也不是“卡片堆砌”的泛后台模板。

**核心气质：**
- 专业、克制、可审计
- 高信息密度，但依然清晰可扫读
- 强状态感（Loading/Empty/Error/Forbidden + AI 运行态）
- 强任务导向（下一步动作明确、风险可控、可回溯）

**硬约束：**
- 只使用项目内的 Tailwind 语义 token 与 shadcn/ui 组件（`components/ui/*`）。不要引入外部 UI Kit。
- 禁止在页面里硬编码颜色值（hex/rgb/hsl 固定值）；颜色只能来自语义类（如 `bg-background`、`text-foreground`、`bg-primary`、`text-muted-foreground`、`border-border`）。
- 不改全局 layout/provider（除非 PRD 明确要求）。

参考：`docs/prd/design_init.md`、`tailwind.config.ts`、`app/assets/scss/globals.scss`、`app/assets/scss/theme.scss`。

---

## Visual Theme & Atmosphere

**关键词：** enterprise, calm, dense, traceable, stateful

**默认页面观感：**
- 版面更像“控制台/工作台”，而不是“展示页”
- 信息分组清晰：对象信息、状态、关键指标、操作区、明细/日志区
- 视觉层级由排版、间距、边框与轻阴影完成（避免夸张投影）

**避免：**
- 营销风大 Hero、装饰性渐变铺底、纯图文卡片墙
- 过度圆角、拟物按钮、发光边框
- 用颜色替代信息架构（颜色只作为强调/状态，不作为主要结构）

---

## Color Palette & Roles (Token-first)

本项目颜色来自 CSS 变量（HSL 三元组），Tailwind 通过语义 token 引用：
- Tailwind 配置：`tailwind.config.ts`
- 变量定义：`app/assets/scss/globals.scss`（基础默认）与 `app/assets/scss/theme.scss`（多主题）

### Semantic Surfaces（表面与层级）
- **Page background**: `bg-background`
- **Text default**: `text-foreground`
- **Card surface**: `bg-card text-card-foreground`
- **Popover surface**: `bg-popover text-popover-foreground`
- **Muted surface**: `bg-muted text-muted-foreground`
- **Border**: `border-border`
- **Input border / field**: `border-input`
- **Focus ring**: `ring-ring`

### Brand / Primary（主色与强调）
- **Primary**: `bg-primary text-primary-foreground`
- **Primary scale**（用于图表/徽标/细分层级，不用于大面积填充）:
  - `bg-primary-50 ... bg-primary-950`
  - `text-primary-50 ... text-primary-950`

### Neutral / Default scale（中性色阶）
- `bg-default-50 ... bg-default-950`
- `text-default-50 ... text-default-950`

### Status Colors（语义状态）
- **Success**: `bg-success text-success-foreground`
- **Warning**: `bg-warning text-warning-foreground`
- **Info**: `bg-info text-info-foreground`
- **Error / Destructive**: `bg-destructive text-destructive-foreground`

### Do / Don’t（颜色）
**Do**
- 永远使用语义 token：`bg-* / text-* / border-* / ring-*`
- 用 `muted` 与 `default` 色阶做“密度管理”（次要信息弱化，而不是缩小字体到不可读）

**Don’t**
- 不要在业务页面写 `bg-[#...]` / `text-[#...]` / `hsl(…)` 常量
- 不要用过多颜色表达层级；层级优先用排版与间距

---

## Typography Rules

### Fonts
- **Base font**: `Inter`（见 `app/[lang]/layout.tsx`）
- **Code font**: 优先使用系统 monospace（若项目已有统一 code 字体约定则遵循之）

### Hierarchy（建议层级，偏“信息密度控制台”）
- **Page title**：18–20px，600；用于页面主标题与对象标题
- **Section title**：14–16px，600；用于分区标题（如“概览/明细/日志/结果”）
- **Body**：14px，400；默认正文
- **Caption / Meta**：12–13px，400/500；用于时间、owner、ID、标签说明

### Do / Don’t（排版）
**Do**
- 标题少而准；更多使用“字段标签 + 值”的结构化排版
- 元信息（owner/time/status）一行可扫读，避免换行折叠

**Don’t**
- 不要用超大标题制造“空旷感”
- 不要用极浅灰 + 小字号堆叠次要信息导致不可读

---

## Layout Principles

### Dashboard page skeleton（默认页面骨架）
- **PageHeader**：标题 + 面包屑 + 关键操作（右侧 actions）
- **Summary / KPI row**（可选）：关键指标、状态、下一步动作
- **Main content**：
  - 左：对象/列表/表格
  - 右：详情/上下文/执行状态/审计信息（如果需要）

### Spacing
- 优先使用 Tailwind spacing scale（4px 基准）
- 页面区块之间保持一致节奏：常用 `gap-4/6`，section padding 常用 `py-6` 级别

### Containers
- Tailwind container screens（见 `tailwind.config.ts`）：`sm/md/lg/xl/2xl` 与固定 padding（15px）

---

## Depth & Elevation

项目已定义轻阴影：
- `shadow-sm`（见 `tailwind.config.ts` 的 `boxShadow.sm`）

**原则：**
- 默认用 **border**（`border-border`）表达分组
- 仅在“可点击卡片/浮层/关键强调块”使用 `shadow-sm`
- 不要引入复杂多层投影系统

---

## Component Stylings (shadcn/ui-first)

> 组件必须复用 `components/ui/*`。需要业务组件时，在 `modules/<domain>/components/` 组合封装，不要改 `components/ui/`。

### Buttons
- **Primary action**：`Button`（默认/primary 语义），用于“下一步/确认/提交”
- **Secondary action**：用于“取消/返回/次要路径”
- **Destructive**：删除/终止/清空，必须有二次确认（`AlertDialog`）

### Forms
- 使用 `react-hook-form` + `zod`（项目约束）
- 错误提示紧贴字段；不要把错误堆在页面顶部

### Tables / Lists
- 表格默认高密度但可读：列对齐、数值右对齐、状态列使用 `Badge`
- Empty 状态必须说明“为什么为空 + 下一步怎么做”

### Feedback / Toast
- 成功/失败/提示使用统一 Toast（`components/ui/toast` / `toaster`）
- Error 信息不要只写“失败”，应包含可行动的下一步（重试/检查权限/联系谁）

---

## Do’s and Don’ts（AI OS Portal 特化）

### Do
- 每个页面必须实现：**Loading / Empty / Error / Forbidden**
- 每个业务对象必须暴露：**status / owner / time / next action**
- 所有操作可追踪：重要操作需在 UI 上能回溯“谁、何时、做了什么”

### Don’t
- 不要只做“展示页”，没有动作与状态流转
- 不要在路由层堆业务逻辑（业务代码归 `modules/<domain>/`）

---

## Responsive Behavior

### Breakpoints
基于 Tailwind（与项目 container screens 一致）：
- `sm 640` / `md 768` / `lg 1024` / `xl 1280` / `2xl 1392`

### Collapsing strategy（企业控制台优先）
- 小屏优先把“右侧详情/日志”收进 `Sheet` 或 Tabs
- 表格在小屏：减少列、把次要列折叠到行详情（而不是横向无限滚动作为默认）

---

## Agent Prompt Guide（用于后续生成页面）

当你要生成/重构任何 UI（页面或组件）时，必须：
- 先读：`AGENTS.md`、`docs/INDEX.md`、`docs/prd/design_init.md`、本 `DESIGN.md`
- 先输出 Page Spec，再写代码（Page Spec 内容见 `docs/prd/design_init.md` 的要求）

生成代码时遵守：
- 只能使用项目现有 shadcn/ui + Tailwind 语义 token
- 颜色禁止硬编码；所有样式优先语义 token
- 页面必须包含 Loading/Empty/Error/Forbidden
- AI 页面必须包含：输入区/上下文区/执行状态/执行 timeline/结果区/引用/反馈动作

