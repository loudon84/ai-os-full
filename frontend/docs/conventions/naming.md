# 编码与命名规则

> 本仓库统一命名规则。**Agent 与人工新建/重命名文件前必须对照本文件**。
> 当本文件与历史代码冲突时：优先执行本规则，但**不要在非必要改动中批量重命名**历史文件——等到功能性变更一起改。

---

## 一、通用原则

1. **文件名**：`kebab-case`（短横线小写）
2. **导出符号**：
   - React 组件 / TS 类型 / TS 接口：`PascalCase`
   - 函数 / 变量 / Hook 变量：`camelCase`
   - 常量：`UPPER_SNAKE_CASE`（仅当真正"常量"语义时；普通配置值用 `camelCase`）
3. **目录名**：`kebab-case`。路由组用括号 `(group)`，动态段用 `[param]`。
4. **语言**：代码标识符用英文；用户可见文案、commit、文档用简体中文。
5. **文件一物一名**：一个文件**只默认导出**一个主要组件/实体；辅助导出允许 `named export`。

---

## 二、命名速查表（按类别）

### 2.1 Next.js 内置（不可变）

| 模式 | 示例 | 说明 |
|------|------|------|
| `page.tsx` | `dashboard/page.tsx` | 路由页面 |
| `layout.tsx` | `(dashboard)/layout.tsx` | 布局组件 |
| `loading.tsx` | `projects/loading.tsx` | 加载状态 |
| `error.tsx` | `[lang]/error.tsx` | 错误边界 |
| `not-found.tsx` | `[lang]/not-found.tsx` | 404 |
| `route.ts` | `api/projects/route.ts` | API 路由 |
| `middleware.ts` | 根目录 | Next.js 中间件 |

### 2.2 React 组件（业务 / UI）

| 类型 | 文件名 | 导出 | 示例 |
|------|-------|------|------|
| UI 原子（`components/ui/`） | `kebab-case.tsx` | 命名导出 + 子组件 | `button.tsx` 导出 `Button` |
| 业务组件 | `kebab-case.tsx` | 默认导出或命名导出 | `delete-confirmation-dialog.tsx` 导出 `DeleteConfirmationDialog` |
| 领域组件（`modules/<domain>/components/`） | `kebab-case.tsx` | 命名导出 | `metric-kpi-card.tsx` 导出 `MetricKpiCard` |
| 页面组件（`modules/<domain>/pages/`） | `kebab-case.tsx` | 默认导出 + `*Page` 命名 | `hermes-dashboard-page.tsx` 导出 `HermesDashboardPage` |

> **Hermes 存量不一致说明**：当前 `modules/hermes/components/shared/HermesMetricCard.tsx` 与 `modules/hermes/pages/HermesDashboardPage.tsx` 仍为 PascalCase 文件名。新文件一律走 kebab-case；历史文件在下次触及该文件的功能性改动时一并重命名。

### 2.3 Hook / Store / Service

| 类型 | 文件名模式 | 导出模式 | 示例 |
|------|-----------|----------|------|
| React Hook | `use-<kebab>.ts(x)` | `useXxx` | `use-media-query.ts` 导出 `useMediaQuery` |
| Zustand Store | `<domain>-<name>-store.ts` | `useXxxStore` | `hermes-interrupt-store.ts` 导出 `useHermesInterruptStore` |
| Service（纯函数/类） | `<name>-service.ts` 或 `<name>.service.ts` | 命名导出 | `hermes-finance.service.ts` |
| Provider 组件 | `<name>.provider.tsx` | 默认导出 `XxxProvider` | `direction.provider.tsx` |
| 配置文件 | `<name>.config.ts` | 命名/默认导出 | `axios.config.ts` |

### 2.4 Server Action / Form / Type

| 类型 | 文件名 | 导出 | 示例 |
|------|-------|------|------|
| Server Action | `<domain>-action.ts` | `doXxxAction` | `project-action.ts` |
| 表单组件 | `<name>-form.tsx` | `XxxForm` | `login-form.tsx` |
| TS 类型 | `<domain>-<thing>.ts` 或 `<domain>.types.ts` | 命名导出 types | `finance-view.ts`、`hermes.types.ts` |
| TS Schema（zod） | `<domain>-<thing>-schema.ts` | 命名导出 `xxxSchema` | `finance-tool-result-schema.ts` |

### 2.5 Tool UI（Hermes 专属）

| 子类别 | 目录 | 文件名 | 示例 |
|--------|------|-------|------|
| 适配器 | `modules/hermes/tool-ui/adapters/` | `<domain>-tool-ui-adapter.tsx` | `finance-tool-ui-adapter.tsx` |
| 卡片 | `modules/hermes/tool-ui/cards/` | `<thing>-card.tsx` | `generic-json-card.tsx` |
| Mapper | `modules/hermes/tool-ui/mappers/` | `<domain>-result-mapper.ts` | `risk-result-mapper.ts` |
| Mock | `modules/hermes/tool-ui/mocks/` | `<domain>-tool-result-mock.ts` | `forecast-tool-result-mock.ts` |
| Schema | `modules/hermes/tool-ui/schemas/` | `<domain>-tool-result-schema.ts` | `risk-tool-result-schema.ts` |
| Fixture | `modules/hermes/tool-ui/fixtures/` | `<domain>-<topic>.json` | `finance-kpi.json`、`risk-exposure.json` |

### 2.6 样式 / 数据 / 其他

| 类型 | 规则 |
|------|------|
| SCSS | `kebab-case.scss`；全局样式 `globals.scss` |
| i18n 字典 | `app/dictionaries/<locale>.json`（locale = `en`/`bn`/`ar`） |
| Story | `<name>.stories.tsx`，位置镜像目标文件（见 directories.md） |
| 测试 | `<name>.spec.ts(x)` 或 `<name>.test.ts(x)` |
| 文档 | `kebab-case.md`；PRD 文件名 `<domain>_<purpose>.md`（历史下划线风格保留） |

---

## 三、组件内部命名

```tsx
// 文件：modules/finance/components/metric-kpi-card.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { MetricKpiViewModel } from "@/modules/finance/types/finance-view";

export interface MetricKpiCardProps {
  data: MetricKpiViewModel;
  onClick?: () => void;
}

export function MetricKpiCard({ data, onClick }: MetricKpiCardProps) {
  // ...
}
```

要点：

- **Props 接口**：`<ComponentName>Props`，与组件同文件导出。
- **ViewModel / DTO**：后缀 `ViewModel` / `Dto` / `Payload` / `Result`。
- **Event handlers**：以 `on` 开头（props）、`handle` 开头（内部）：`onClick` / `handleClick`。
- **Boolean**：以 `is` / `has` / `can` / `should` 开头：`isLoading`、`hasError`。

---

## 四、导入路径别名

| 别名 | 映射 | 用途 |
|------|------|------|
| `@/` | 仓库根 | 唯一别名，**不要新增别名** |

推荐导入次序：

```ts
// 1. React / Next / 第三方库
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

// 2. UI 基础（@/components/ui/*）
import { Button } from "@/components/ui/button";

// 3. 通用能力（@/lib, @/hooks, @/config, @/provider, @/store）
import { cn } from "@/lib/utils";

// 4. 同域 modules 模块
import { useHermesCopilot } from "@/modules/hermes/hooks/use-hermes-copilot";

// 5. 本地相对路径（./、../）
import { buildPayload } from "./payload";
```

---

## 五、禁用模式（Agent 产出前自检）

1. ❌ `camelCase.tsx` / `PascalCase.tsx` 作为**新建**文件名（新文件一律 kebab-case）。
2. ❌ 魔改 `components/ui/*`（应在 `modules/<domain>/components/` 或 `components/<业务>/` 里包装）。
3. ❌ 新增仅用于别名的 barrel 文件（只在模块对外导出时使用 `modules/<domain>/index.ts`）。
4. ❌ 把 Server Action 直接丢进 `app/` 某个页面里（应当落在 `action/` 或 `modules/<domain>/services/`）。
5. ❌ 使用 `any` 或 `@ts-ignore` 除非附注释说明原因（生产代码禁止）。
6. ❌ 文件内定义超过 1 个默认导出的 React 组件。
7. ❌ 在业务代码中硬编码中文文案（走字典 / i18n；当前未上线的可先写中文，但加 TODO）。

---

## 六、Commit / 分支命名

| 对象 | 规则 | 示例 |
|------|------|------|
| Commit | `<type>(<scope>): <中文概述>` | `feat(hermes): 新增 Tool UI 预览页` |
| type | `feat / fix / docs / refactor / chore / test / style` | |
| scope | 模块名（hermes/finance/risk/forecast/ui/layout 等） | |
| 分支 | `<type>/<domain>-<short-desc>` | `feat/hermes-preview-panel` |

> 单次 commit 范围聚焦于单个 domain，优先小颗粒多次提交。
