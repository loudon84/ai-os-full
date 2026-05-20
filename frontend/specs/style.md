# CopilotSMC 样式与主题系统 Wiki

> 本文档提炼自 CopilotSMC 官方文档及项目实际代码，供 LLM 在样式/主题/色彩相关任务中快速引用。
> 来源：https://dash-tail.vercel.app/docs/introduction

---

## 1. 技术栈概览

| 维度 | 技术 | 版本 |
|------|------|------|
| CSS 框架 | Tailwind CSS | 3.3.3 |
| 动画插件 | tailwindcss-animate | ^1.0.6 |
| className 合并 | tailwind-merge + clsx | ^1.14.0 / ^2.0.0 |
| 组件变体 | class-variance-authority (cva) | ^0.7.0 |
| 暗/亮切换 | next-themes | ^0.2.1 |
| CSS 预处理 | Sass | ^1.66.1 |
| 后处理 | PostCSS + Autoprefixer | 8.4.28 / 10.4.15 |
| 动画 | framer-motion | ^10.16.3 |
| 字体 | Google Fonts `Inter` | next/font/google |
| UI 基座 | Shadcn/UI | 55 组件 |

---

## 2. 三层主题架构

CopilotSMC 采用 **Shadcn/UI + Tailwind CSS 变量 + next-themes** 三层架构：

```
┌─────────────────────────────────────────────┐
│ Layer 1: next-themes                         │
│   → 给 <html> 添加/移除 .dark class          │
│   → attribute="class", defaultTheme="light"  │
├─────────────────────────────────────────────┤
│ Layer 2: CSS 变量 (globals.scss + theme.scss)│
│   → :root 定义默认 violet 主题变量            │
│   → .theme-xxx 类覆盖当前主题的 CSS 变量       │
│   → .dark .theme-xxx 覆盖暗色变量             │
├─────────────────────────────────────────────┤
│ Layer 3: Tailwind 配置 (tailwind.config.ts)   │
│   → colors 通过 hsl(var(--xxx)) 引用 CSS 变量 │
│   → borderRadius 通过 var(--radius) 引用      │
│   → 支持 <alpha-value> 透明度通道              │
└─────────────────────────────────────────────┘
```

### 2.1 主题切换流程

```
用户选择主题 (zinc/slate/.../violet)
  → useThemeStore.setTheme(name)       [Zustand, 持久化 localStorage]
  → <body className="theme-violet">    [触发 theme.scss 中的 .theme-violet CSS 变量覆盖]
  → CSS 变量生效 → Tailwind hsl(var(--xxx)) 自动更新 → 组件重渲染

用户切换 dark/light
  → next-themes setTheme("light"/"dark")  [给 <html> 添加/移除 .dark]
  → .dark .theme-violet 变量覆盖生效

用户调整圆角
  → useThemeStore.setRadius(value)    [0 / 0.3 / 0.5 / 0.75 / 1.0]
  → <body style="--radius: 0.5rem">   [Tailwind borderRadius 通过 var(--radius) 生效]
```

---

## 3. 站点默认配置

**文件**: `config/site.ts`

| 属性 | 默认值 | 可选值 |
|------|--------|--------|
| `theme` | `"violet"` | zinc, slate, stone, gray, neutral, red, rose, orange, green, blue, yellow, violet |
| `layout` | `"vertical"` | vertical, semi-box, horizontal |
| `sidebarType` | `"module"` | module, classic, popover |
| `navbarType` | `"sticky"` | sticky, floating, static |
| `footerType` | `"static"` | static, sticky, hidden |
| `sidebarBg` | `"none"` | none, ... |
| `radius` | `0.5` | 0, 0.3, 0.5, 0.75, 1.0 |

---

## 4. Tailwind CSS 配置详解

**文件**: `tailwind.config.ts`

### 4.1 darkMode

```ts
darkMode: ["class"]  // 通过 .dark class 切换
```

### 4.2 container

| 属性 | 值 |
|------|-----|
| 居中 | `true` |
| padding DEFAULT/sm/lg | `15px` |
| padding xl/2xl | `0` |
| screen sm | `640px` |
| screen md | `768px` |
| screen lg | `1024px` |
| screen xl | `1280px` |
| screen 2xl | `1392px` |

### 4.3 颜色系统

所有颜色基于 HSL CSS 变量，支持 `<alpha-value>` 透明度通道：

| Tailwind Token | CSS 变量 | 色阶 |
|----------------|----------|------|
| `background` | `--background` | 单值 |
| `foreground` | `--foreground` | 单值 |
| `primary` | `--primary` + `--primary-50`~`--primary-950` | 11 阶 + DEFAULT + foreground |
| `secondary` | `--secondary` | DEFAULT + foreground |
| `default` | `--default-50`~`--default-950` | 11 阶（灰阶） |
| `muted` | `--muted` | DEFAULT + foreground |
| `accent` | `--accent` | DEFAULT + foreground |
| `popover` | `--popover` | DEFAULT + foreground |
| `card` | `--card` | DEFAULT + foreground |
| `border` | `--border` | 单值 |
| `input` | `--input` | 单值 |
| `ring` | `--ring` | 单值 |
| `destructive` | `--destructive` | DEFAULT + foreground + 硬编码 700 `#be185d` |
| `success` | `--success` | DEFAULT + foreground + 硬编码 700 `#15803d` |
| `info` | `--info` | DEFAULT + foreground + 硬编码 700 `#0f766e` |
| `warning` | `--warning` | DEFAULT + foreground + 硬编码 700 `#a16207` |

**使用模式**：

```tsx
// Tailwind class 中直接使用语义色
<div className="bg-primary text-primary-foreground" />
<div className="border-border bg-card" />
<div className="text-destructive bg-destructive/10" />  // /10 = 10% 透明度

// 色阶使用（primary 有 50~950）
<div className="bg-primary-50" />   // 最浅
<div className="bg-primary-950" />  // 最深
<div className="text-default-500" /> // 灰阶中间色
```

### 4.4 borderRadius

基于 `--radius` CSS 变量动态计算：

| Token | 计算 | 默认值 (radius=0.5) |
|-------|------|---------------------|
| `lg` | `var(--radius)` | `0.5rem` (8px) |
| `md` | `calc(var(--radius) - 2px)` | `0.375rem` (6px) |
| `sm` | `calc(var(--radius) - 4px)` | `0.25rem` (4px) |

### 4.5 boxShadow

| Token | 值 |
|-------|-----|
| `sm` | `0px 1px 2px 0px rgba(15,22,36,0.06), 0px 1px 3px 0px rgba(15,22,36,0.10)` |

### 4.6 animation

| 动画名 | 关键帧 | 时长/缓动 |
|--------|--------|-----------|
| `accordion-down` | height: 0 → var(--radix-accordion-content-height) | 0.2s ease-out |
| `accordion-up` | height: var(...) → 0 | 0.2s ease-out |
| `slideDownAndFade` | opacity:0 translateY(-2px) → opacity:1 translateY(0) | 400ms cubic-bezier(0.16,1,0.3,1) |
| `slideUpAndFade` | opacity:0 translateY(2px) → opacity:1 translateY(0) | 400ms cubic-bezier(0.16,1,0.3,1) |
| `slideLeftAndFade` | opacity:0 translateX(2px) → opacity:1 translateX(0) | 400ms cubic-bezier(0.16,1,0.3,1) |
| `slideRightAndFade` | opacity:0 translateX(-2px) → opacity:1 translateX(0) | 400ms cubic-bezier(0.16,1,0.3,1) |

---

## 5. CSS 变量详解

### 5.1 默认主题变量（:root = violet）

**文件**: `app/assets/scss/globals.scss`

#### Light 模式

| 变量 | HSL 值 | 色彩描述 |
|------|--------|----------|
| `--background` | `0 0% 100%` | 纯白 |
| `--foreground` | `222.2 84% 4.9%` | 深蓝黑 |
| `--card` | `0 0% 100%` | 纯白 |
| `--card-foreground` | `222.2 84% 4.9%` | 深蓝黑 |
| `--popover` | `0 0% 100%` | 纯白 |
| `--popover-foreground` | `222.2 84% 4.9%` | 深蓝黑 |
| `--primary` | `250 92% 70%` | 淡紫（violet 主色） |
| `--primary-foreground` | `240 100% 98%` | 近白 |
| `--secondary` | `214.3 31.8% 91.4%` | 浅灰蓝 |
| `--secondary-foreground` | `222.2 47.4% 11.2%` | 深蓝 |
| `--muted` | `220 14.3% 95.9%` | 极浅灰 |
| `--muted-foreground` | `215.4 16.3% 46.9%` | 中灰 |
| `--accent` | `214.3 31.8% 91.4%` | 浅灰蓝 |
| `--accent-foreground` | `222.2 47.4% 11.2%` | 深蓝 |
| `--destructive` | `0 84.2% 60.2%` | 红色 |
| `--destructive-foreground` | `0 85.7% 97.3` | 浅红 |
| `--success` | `142.1 70.6% 45.3%` | 绿色 |
| `--success-foreground` | `138.5 76.5% 96.7%` | 浅绿 |
| `--warning` | `24.6 95% 53.1%` | 橙色 |
| `--warning-foreground` | `33.3 100% 96.5%` | 浅黄 |
| `--info` | `188.7 94.5% 42.7%` | 青色 |
| `--info-foreground` | `183.2 100% 96.3%` | 浅青 |
| `--border` | `214.3 31.8% 91.4%` | 浅灰蓝 |
| `--input` | `214.3 31.8% 91.4%` | 浅灰蓝 |
| `--ring` | `262.1 83.3% 57.8%` | 紫色（焦点环） |
| `--radius` | `0.5rem` | 基础圆角 |

#### Dark 模式

| 变量 | HSL 值 | 与 Light 差异 |
|------|--------|--------------|
| `--background` | `222.2 47.4% 11.2%` | 深蓝黑 |
| `--foreground` | `210 40% 98%` | 近白 |
| `--card` | `215 27.9% 16.9%` | 深灰蓝 |
| `--primary` | `254 86% 58%` | 亮紫 |
| `--secondary` | `215.3 25% 26.7%` | 深灰蓝 |
| `--muted` | `215 27.9% 16.9%` | 深灰蓝 |
| `--border` | `215.3 25% 26.7%` | 深灰蓝 |
| `--ring` | `263.4 70% 50.4%` | 亮紫 |
| `--destructive/success/warning/info` | **不变** | 语义色在 dark 下保持一致 |

#### Primary 色阶（violet，Light）

| 变量 | HSL | 描述 |
|------|-----|------|
| `--primary-50` | `240 100% 98%` | 极浅紫 |
| `--primary-100` | `243 91% 95%` | |
| `--primary-200` | `243 100% 92%` | |
| `--primary-300` | `244 97% 85%` | |
| `--primary-400` | `247 95% 76%` | |
| `--primary-500` | `250 92% 70%` | = --primary |
| `--primary-600` | `254 86% 58%` | |
| `--primary-700` | `255 72% 50%` | |
| `--primary-800` | `255 71% 42%` | |
| `--primary-900` | `255 70% 35%` | |
| `--primary-950` | `255 70% 35%` | 最深紫 |

#### Default 色阶（slate 灰阶，Light）

| 变量 | HSL |
|------|-----|
| `--default-50` | `210 40% 98%` |
| `--default-100` | `210 40% 96.1%` |
| `--default-200` | `214.3 31.8% 91.4%` |
| `--default-300` | `212.7 26.8% 83.9%` |
| `--default-400` | `215 20.2% 65.1%` |
| `--default-500` | `215.4 16.3% 46.9%` |
| `--default-600` | `215.3 19.3% 34.5%` |
| `--default-700` | `215.3 25% 26.7%` |
| `--default-800` | `217.2 32.6% 17.5%` |
| `--default-900` | `222.2 47.4% 11.2%` |
| `--default-950` | `222.2 84% 4.9%` |

> Dark 模式下 default 色阶**反转**：50 ↔ 950，100 ↔ 900，以此类推。

---

## 6. 12 主题色系

**文件**: `config/thems.ts`（JS 主题定义） + `app/assets/scss/theme.scss`（CSS 类选择器）

每个主题通过 `.theme-xxx` 和 `.dark .theme-xxx` 两个 CSS 类选择器定义完整变量集。

| 主题名 | primary (Light) | primary (Dark) | 独有 radius | 色系描述 |
|--------|-----------------|----------------|------------|----------|
| `zinc` | `240 5.9% 10%` | `0 0% 98%` | 0.5rem | 冷灰 |
| `slate` | `222.2 47.4% 11.2%` | `210 40% 98%` | 0.5rem | 蓝灰 |
| `stone` | `24 9.8% 10%` | `60 9.1% 97.8%` | 0.95rem | 暖灰 |
| `gray` | `220.9 39.3% 11%` | `210 20% 98%` | 0.35rem | 中性灰 |
| `neutral` | `0 0% 9%` | `0 0% 98%` | 默认 | 纯灰 |
| `red` | `0 72.2% 50.6%` | `0 72.2% 50.6%` | 0.4rem | 红色 |
| `rose` | `346.8 77.2% 49.8%` | `346.8 77.2% 49.8%` | 0.5rem | 玫红 |
| `orange` | `24.6 95% 53.1%` | `20.5 90.2% 48.2%` | 0.95rem | 橙色 |
| `green` | `142.1 76.2% 36.3%` | `142.1 70.6% 45.3%` | 默认 | 绿色 |
| `blue` | `221.2 83.2% 53.3%` | `217.2 91.2% 59.8%` | 默认 | 蓝色 |
| `yellow` | `47.9 95.8% 53.1%` | `47.9 95.8% 53.1%` | 默认 | 黄色 |
| `violet` | `250 92% 70%` | `254 86% 58%` | 0.5rem | 紫色（默认） |

### 6.1 添加新主题的步骤

1. 在 `config/thems.ts` 的 `themes` 数组中添加新主题对象（含 name, label, activeColor, cssVars.light, cssVars.dark）
2. 在 `app/assets/scss/theme.scss` 中添加 `.theme-xxx` 和 `.dark .theme-xxx` 两个选择器块，定义所有 CSS 变量
3. 在 `config/site.ts` 中将 `theme` 改为新主题名
4. **必须使用 HSL 颜色值**（不含 `hsl()` 函数包裹，只写 `H S% L%` 三部分）

---

## 7. 全局 CSS 样式

**文件**: `app/assets/scss/globals.scss`

### 7.1 base 层

```css
* { @apply border-border; }     /* 全局边框色 */
html { @apply scroll-smooth; }  /* 平滑滚动 */
body { @apply bg-[#EEF1F9] dark:bg-background text-foreground text-sm; }
/* body 浅色背景为 #EEF1F9（非纯白），暗色跟随 --background */
```

### 7.2 工具类

| 类名 | 作用 |
|------|------|
| `.page-min-height` | `min-height: calc(var(--vh, 1vh) * 100 - 117px)` |
| `.page-min-height-semibox` | `min-height: calc(var(--vh, 1vh) * 100 - 200px)` |
| `.page-min-height-horizontal` | `min-height: calc(var(--vh, 1vh) * 100 - 170px)` |
| `.app-height` | `height: calc(var(--vh, 1vh) * 100 - 11.1rem)` |
| `.no-scrollbar` | 隐藏滚动条 |
| `.has-sticky-header` | 吸顶 header 模糊背景效果 |
| `.animate-stripes` | 进度条条纹动画 |
| `.dash-tail-app` | Leaflet 地图 z-index 修复 |
| `.input-group` | 输入框组合（圆角/边框合并） |
| `.loginwrapper` | 登录页 100vh 高度 |
| `.layout-padding` | 布局底部 padding（移动端 112px，桌面 37px） |
| `.avatarGroup` | 头像组悬停上移效果 |

### 7.3 SCSS Partials

| 导入 | 用途 |
|------|------|
| `partials/calendar.scss` | 日期选择器样式 |
| `partials/react-slect` | React Select 样式 |
| `partials/map` | Leaflet 地图样式 |
| `partials/shepherd` | 引导教程样式 |

---

## 8. CSS 导入链路

**文件**: `app/[lang]/layout.tsx`

```ts
import "../assets/scss/globals.scss";                     // Tailwind 指令 + :root 变量 + 基础样式
import "../assets/scss/theme.scss";                       // 12 主题类选择器
import "@univerjs/preset-sheets-core/lib/index.css";     // Univer 电子表格
import "simplebar-react/dist/simplebar.min.css";          // 自定义滚动条
import "flatpickr/dist/themes/light.css";                 // 日期选择器浅色
```

---

## 9. 主题切换机制详解

### 9.1 Zustand Store

**文件**: `store/index.ts`

- `useThemeStore`：管理 theme / radius / layout / navbarType / footerType / isRtl，持久化到 localStorage
- `useSidebar`：管理侧栏折叠/类型/子菜单/背景/移动菜单，持久化到 localStorage

### 9.2 next-themes Provider

**文件**: `provider/providers.tsx`

```tsx
<ThemeProvider attribute="class" enableSystem={false} defaultTheme="light">
```

- `attribute="class"` → 通过 `.dark` class 切换
- `enableSystem={false}` → 不跟随系统偏好
- `defaultTheme="light"` → 默认亮色

### 9.3 body 动态绑定

```tsx
// app/[lang]/layout.tsx 中 <body> 的 className 和 style
<body
  className={cn("dash-tail-app", inter.className, "theme-" + theme)}
  style={{ "--radius": radius + "rem" } as React.CSSProperties}
>
```

### 9.4 ThemeCustomizer 组件

**文件**: `components/partials/customizer/theme-customizer.tsx`

以 Sheet（侧滑面板）提供完整主题定制，包含：
- SelectLayout（布局选择）
- SelectTheme（主题色选择）
- RtlSwitcher（RTL 开关）
- ThemeChange（12 色切换）
- SidebarChange（侧栏类型）
- SidebarImage（侧栏背景图）
- RadiusInit（5 档圆角：0 / 0.3 / 0.5 / 0.75 / 1.0）
- HeaderStyle（header 样式）
- FooterStyle（footer 样式）

---

## 10. 布局系统

### 10.1 三种预置布局

| 布局 | 值 | 描述 |
|------|-----|------|
| 垂直 | `vertical` | 侧栏在左，内容在右（默认） |
| 半盒 | `semi-box` | 内容区有左右 margin（xl+ 下 56px） |
| 水平 | `horizontal` | 顶部导航，无侧栏 |

### 10.2 添加新布局

1. 在 `app/[lang]/(dashboard)/main-layout.tsx` 中添加 `if (layout === "your-layout")` 分支
2. 在 `config/site.ts` 中设置 `layout: "your-layout"`

### 10.3 侧栏类型

| 类型 | 值 | 描述 |
|------|-----|------|
| 模块式 | `module` | 图标 + 展开子菜单（默认） |
| 经典式 | `classic` | 完整菜单 + 折叠子菜单 |
| 弹出式 | `popover` | 折叠图标 + hover 弹出子菜单 |

### 10.4 Header 样式

| 类型 | 值 |
|------|-----|
| 吸顶 | `sticky` |
| 浮动 | `floating` |
| 静态 | `static` |

### 10.5 Footer 样式

| 类型 | 值 |
|------|-----|
| 静态 | `static` |
| 吸顶 | `sticky` |
| 隐藏 | `hidden` |

---

## 11. 字体配置

唯一字体：**Inter**（Google Fonts），通过 `next/font/google` 加载。

```ts
const inter = Inter({ subsets: ["latin"] })
// <body className={cn("dash-tail-app", inter.className, ...)}>
```

无其他自定义字体。

---

## 12. Shadcn/UI 组件基座

**目录**: `components/ui/` — **禁止魔改**，直接复用。

完整组件清单（55 个）：

```
accordion, affix, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumbs,
button, calendar, card, card-snippet, carousel, checkbox, cleave, collapsible,
command, dialog, drawer, dropdown-menu, form, hover-card, input, input-group,
kbd, label, menubar, navigation-menu, pagination, popover, progress, radio-group,
rating, resizable, scroll-area, select, separator, sheet, skeleton, slider,
sonner, steps, switch, table, tabs, textarea, timeline, toast, use-toast,
toaster, toggle, tooltip, tree, watermark
```

组件变体使用 `class-variance-authority (cva)`，className 合并使用 `cn() = twMerge(clsx(...))`。

---

## 13. 工具函数（样式相关）

**文件**: `lib/utils.ts`

| 函数 | 作用 |
|------|------|
| `cn(...inputs)` | `twMerge(clsx(inputs))` — className 合并去重 |
| `RGBToHex(r, g, b)` | RGB → Hex 转换 |
| `hslToHex(hsl)` | HSLA 字符串 → Hex |
| `hexToRGB(hex, alpha?)` | Hex → RGB/RGBA |

---

## 14. PostCSS 配置

**文件**: `postcss.config.js`

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

---

## 15. LLM 编码指南

### 15.1 写颜色时的规则

- **必须使用语义 Token**：`bg-primary`, `text-muted-foreground`, `border-border`
- **禁止硬编码 Hex/RGB**（除非是 destructive/success/info/warning 的 700 色阶）
- **透明度用 `/xx`**：`bg-primary/10` = 10% 不透明度
- **色阶用数字后缀**：`bg-primary-50`（最浅）~ `bg-primary-950`（最深）
- **灰阶用 default**：`text-default-500`, `bg-default-100`

### 15.2 写圆角时的规则

- 使用 `rounded-lg` / `rounded-md` / `rounded-sm`（由 `--radius` 动态驱动）
- **禁止**硬编码 `rounded-[8px]` 等
- 如需全圆角用 `rounded-full`

### 15.3 写间距时的规则

- 使用 Tailwind 标准间距：`p-4` = 1rem, `gap-6` = 1.5rem
- container 自带 padding：DEFAULT 15px, xl/2xl 0

### 15.4 暗色适配规则

- **语义色自动适配**：`bg-background` / `text-foreground` 自动随 dark 切换
- **禁止**写 `dark:bg-white` 等硬覆盖（除非极特殊场景）
- body 浅色背景为 `#EEF1F9`，暗色为 `--background`

### 15.5 添加新主题的 Checklist

- [ ] `config/thems.ts` — 添加主题对象（name, label, activeColor, cssVars.light/dark）
- [ ] `app/assets/scss/theme.scss` — 添加 `.theme-xxx` + `.dark .theme-xxx`，含完整 `--primary-50~950` 和 `--default-50~950` 色阶
- [ ] `config/site.ts` — 设置 `theme: "xxx"`（可选，仅改默认）
- [ ] 验证 light + dark 两套变量完整性

### 15.6 添加新布局的 Checklist

- [ ] `app/[lang]/(dashboard)/main-layout.tsx` — 添加 `if (layout === "xxx")` 分支
- [ ] `config/site.ts` — 设置 `layout: "xxx"`（可选，仅改默认）
- [ ] 确认继承 Header / Sidebar / Footer / ThemeCustomize

---

## 16. 外部依赖样式

| 依赖 | CSS 导入 | 说明 |
|------|----------|------|
| simplebar-react | `simplebar-react/dist/simplebar.min.css` | 自定义滚动条 |
| flatpickr | `flatpickr/dist/themes/light.css` | 日期选择器浅色主题 |
| @univerjs/preset-sheets-core | `@univerjs/preset-sheets-core/lib/index.css` | Univer 电子表格 |
| styled-components | CSS-in-JS 运行时注入 | 部分组件使用 |
| framer-motion | JS 动画，无 CSS 导入 | 布局切换动画 |

---

*最后更新：2026-05-09*
*来源：CopilotSMC 官方文档 https://dash-tail.vercel.app/docs + 项目代码分析*
