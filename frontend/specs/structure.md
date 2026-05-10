# DashTail Layout / Menu 机制与本项目对照（二开速查）

> 目的：对照 [DashTail 官方 Layout Customization](https://dash-tail.vercel.app/docs/layout-customization) 与 [Menu Customization](https://dash-tail.vercel.app/docs/menu-customization) 所描述的产品能力，映射到本仓库**真实代码路径**，便于后续在 Cursor 中改布局、改菜单、改主题定制器而不迷路。  
> 更完整的 Provider 嵌套与生命周期见 `specs/layout-structure.md`。

---

## 一、DashTail 官方文档在说什么（摘要）

### 1.1 站点默认配置（`site.js` / 本仓库 `config/site.ts`）

官方示例中的 `siteConfig` 字段与本项目对应关系：

| 官方字段 | 含义 | 本项目字段 |
|---------|------|-----------|
| `layout` | `vertical` / `horizontal` / `semi-box`（文档写法） | `layout`: `vertical` \| `horizontal` \| `semibox`（代码里无连字符） |
| `hideSideBar` | 是否隐藏侧栏 | `config/site.ts` 保留字段；**实际侧栏显隐由 layout 分支 + `sidebarType` 决定** |
| `sidebarType` | `popover` / `classic` / `module` | 一致，存于 `useSidebar().sidebarType` |
| `navbarType` | `sticky` / `floating` / `static` | 一致；本项目 UI 另支持 `hidden` |
| `footerType` | `sticky` / `static` / `hidden` | 一致 |
| `theme`、`radius`、`sidebarBg` 等 | 主题色、圆角、侧栏背景 | `useThemeStore` + `useSidebar` |

官方文档还展示在 `main-layout.jsx` 里按 `layout === "reverse"` 分支渲染不同壳层；**本仓库等价物是** `provider/dashboard.layout.provider.tsx` 中对 `semibox` / `horizontal` / `vertical（module 与 non-module）` 的多分支。

### 1.2 菜单配置（`config/menus.js` / 本仓库 `config/menus.ts`）

官方说明三类结构：

- **Vertical Menu**：维护 `sidebarNav.modern` 树（多列 / 现代侧栏）。
- **Vertical Collapsed Menu**：维护 `sidebarNav.classic` 树（经典可折叠侧栏）。
- **Horizontal Menu**：维护 `mainNav` 数组（顶栏横向 mega / dropdown）。

本项目**数据源统一在** `config/menus.ts` 的 `menusConfig`：

- `mainNav` → 横向布局顶栏 `components/partials/header/horizontal-menu.tsx`。
- `sidebarNav.modern` → **仅** `components/partials/sidebar/module/index.tsx`（Module 侧栏）。
- `sidebarNav.classic` → `classic/index.tsx` 与 `popover/index.tsx`（Popover 也用 classic 数据）。

---

## 二、状态从哪里来：Zustand 双 Store

文件：`store/index.ts`。

### 2.1 `useThemeStore`（持久化到 `localStorage`，键名 `theme-store`）

| 状态 | 默认值来源 | 作用 |
|------|-----------|------|
| `theme` | `siteConfig.theme` | 与 `config/thems.ts` 配色方案联动（Customizer 里 SelectTheme / ThemeChange） |
| `radius` | `siteConfig.radius` | 写入 `body` 的 `--radius`（见 `provider/providers.tsx`） |
| `layout` | `siteConfig.layout` | 驱动 Dashboard 壳层主分支 |
| `navbarType` | `siteConfig.navbarType` | Header 粘滞/悬浮/静态/隐藏 |
| `footerType` | `siteConfig.footerType` | Footer 粘滞/静态/隐藏 |
| `isRtl` | 初始 `false` | 与 `DirectionProvider`、Tailwind `rtl:` 前缀联动 |

**副作用（二开必看）**：`setLayout` 内硬编码规则：

- `layout === "semibox"` → 强制 `useSidebar.setState({ sidebarType: "popover" })`。
- `layout === "horizontal"` → 强制 `sidebarType: "classic"`，且 `navbarType: "sticky"`。

因此 Customizer 里改 Layout 会**覆盖**用户之前选的 Sidebar Layout（符合 DashTail「布局与侧栏样式绑定」的产品逻辑，但扩展时要留意）。

### 2.2 `useSidebar`（持久化到 `localStorage`，键名 `sidebar-store`）

| 状态 | 默认值来源 | 作用 |
|------|-----------|------|
| `collapsed` | `false` | 侧栏折叠；内容区 `margin` 在 `dashboard.layout.provider` 与 Header/Footer 里成对变化 |
| `sidebarType` | `semibox` 时为 `popover`，否则 `siteConfig.sidebarType` | 选择 `module` / `classic` / `popover` 三种侧栏组件 |
| `subMenu`、`mobileMenu` 等 | — | Module 侧栏二级面板、移动端行为 |
| `sidebarBg` | `siteConfig.sidebarBg` | 侧栏背景图等（Customizer `sidebar-image.tsx`） |

---

## 三、Theme Customizer 如何控制各维度

入口：`components/partials/customizer/theme-customizer.tsx`（`Sheet` 侧滑 + 右下角齿轮触发器）。

### 3.1 Layout（整体壳层模式）

- **UI**：`components/partials/customizer/select-layout.tsx`。
- **写入**：`useThemeStore.setLayout("vertical" | "horizontal" | "semibox")`。
- **生效**：`provider/dashboard.layout.provider.tsx` 按 `layout` 选择是否渲染 `Sidebar`、`content-wrapper` 的 margin 类名、`page-min-height-*` 等。

与官方文档一致：三种布局；**命名注意**代码为 `semibox` 而非 `semi-box`。

### 3.2 Direction（LTR / RTL）

- **UI**：`components/partials/customizer/rtl-switch.tsx`。
- **写入**：`useThemeStore.setRtl(boolean)`，并 `router.push` 切换语言前缀为 `en` 或 `ar`。
- **生效**：
  - `provider/direction.provider.tsx`：`dir={isRtl ? "rtl" : "ltr"}` + Radix `DirectionProvider`。
  - 布局类名大量使用 Tailwind `ltr:` / `rtl:`（如 `ltr:xl:ml-[300px] rtl:xl:mr-[300px]`）。

**二开注意**：RtlSwitcher 当前把路径写成 ``/`${lang}/${pathname.split("/")[2]}` ``，仅保留第一段业务路径，**多段路径或 `bn` 等语言需改逻辑**，否则与 middleware 的 locale 列表不一致。

### 3.3 Sidebar Layout（侧栏组件形态）

- **UI**：`components/partials/customizer/sidebar-change.tsx`。
- **写入**：`useSidebar.setSidebarType("module" | "classic" | "popover")`。
- **生效**：`components/partials/sidebar/index.tsx` 按 `sidebarType` 挂载 `ModuleSidebar` / `ClassicSidebar` / `PopoverSidebar`；小屏下 `popover`/`classic` 走 `MobileSidebar`。

**与 Layout 的互斥**（Customizer 内 `disabled`）：

- `semibox`：`module` 禁用（且 `setLayout("semibox")` 会强制 popover）。
- `horizontal`：`module` 禁用（且会强制 `classic`）。
- `classic` 选项在 `semibox` 下禁用。

### 3.4 Navbar Type

- **UI**：`components/partials/customizer/header-style.tsx`。
- **写入**：`useThemeStore.setNavbarType("sticky" | "static" | "floating" | "hidden")`。
- **生效**：`components/partials/header/index.tsx`：
  - `horizontal`：仅当 `navbarType !== "hidden"` 渲染；`sticky` 加在 `ClassicHeader`；**`floating` 选项在 horizontal 下不渲染**（与官方「顶栏+横菜单」组合一致）。
  - `semibox`：`sticky` 为 `sticky top-6`，并带与侧栏宽度对齐的 `ml`/`mr`。
  - `classic/popover` 非 module：`floating` 走单独分支（`has-sticky-header`、`sticky top-6`、浮动卡片样式）。
  - `hidden`：整个 `Header` 返回 `null`。

官方文档只列 `sticky | floating | `static`；本项目扩展了 `hidden`，且 horizontal 下隐藏 floating 单选项。

### 3.5 Footer Type

- **UI**：`components/partials/customizer/footer-style.tsx`。
- **写入**：`useThemeStore.setFooterType("sticky" | "static" | "hidden")`。
- **生效**：`components/partials/footer/index.tsx`：

  - `hidden` → 不渲染。
  - `sticky` → 在对应 `FooterLayout` 上加 `sticky bottom-0`。
  - 不同 `layout` + `sidebarType` 组合下，Footer 与 Header 一样要带 `ltr:xl:ml-[…]` / `rtl:xl:mr-[…]` 与侧栏宽度对齐。

**特殊**：`sidebarType === "module"` 且非移动端时走 `MobileFooter`（见 Footer 组件内 `useMediaQuery` 与 `isMobile` 变量命名——此处 `isMobile` 实际表示 `min-width: 768px` 为 true，即平板及以上）。

### 3.6 Theme Customize 挂载差异（本项目相对模板的改动）

在 `dashboard.layout.provider.tsx` 末尾：

- `semibox` / `horizontal` / 非 `module` 的 vertical：**始终**渲染 `<ThemeCustomize />`。
- **`sidebarType === "module"` 的 vertical 默认分支**：仅 `{isMobile && <ThemeCustomize />}`（此处 `isMobile` 为 `(min-width: 768px)`，即中等屏以上才显示浮动齿轮）。  
  若桌面窄屏看不到定制器，属于此条件分支导致，二开时可统一为始终挂载。

---

## 四、CSS / 类名：与 `layout-structure` 与 `globals.scss` 的关系

### 4.1 官方所说的「类名切换」在本项目中的体现

DashTail 习惯用 body/wrapper 类切换布局；本项目 **Next App Router** 主要在：

- **`provider/providers.tsx`**：`body` 上 `dash-tail-app`、`theme-{theme}`、`--radius`。
- **`dashboard.layout.provider.tsx`**：`content-wrapper` + Tailwind 工具类控制主区左右 margin（随 `collapsed` 在 72px / 248px / 272px / 300px 等之间切换）。
- **`app/assets/scss/globals.scss`**：补充**最小高度**与 semibox 内边距：

```276:311:e:\git-ai\smc-coworker-aios\ai-os-portal\app\assets\scss\globals.scss
.page-min-height {
  min-height: calc(var(--vh, 1vh) * 100 - 117px);
}

.page-min-height-semibox {
  min-height: calc(var(--vh, 1vh) * 100 - 200px);
}

.page-min-height-horizontal {
  min-height: calc(var(--vh, 1vh) * 100 - 170px);
}
// ...
@media (min-width: 1280px) {
  .semibox-content-wrapper {
    margin-left: 56px;
    margin-right: 56px;
  }
}
.layout-padding {
  padding-bottom: 112px;
}
@media (min-width: 768px) {
  .layout-padding {
    padding-bottom: 37px;
  }
}
```

二开新布局时：若 Header/Footer 高度变化，需同步调整这些 `calc(100vh - …px)` 中的常数，否则出现「主区高度不够 / 双滚动条」。

### 4.2 与截图工位类页面的关系

业务页面（如含 `WorkspaceFilesPanel` 的详情布局）在 `dashboard.layout.provider.tsx` 的 `isDetailView` 分支中**额外包一层** flex + 边框容器；侧栏折叠逻辑用 `useEffect` 在详情页强制 `collapsed`。这与 Theme Customizer 正交：**Customizer 改的是全局壳层**，详情工位是壳层内的 `children` 结构扩展。

---

## 五、菜单二开：应改哪些文件

| 目标 | 首要文件 | 说明 |
|------|----------|------|
| 改顶栏横向菜单 | `config/menus.ts` → `mainNav` | 仅 `layout === "horizontal"` 时由 `horizontal-menu.tsx` 消费 |
| 改 Module 双列侧栏 | `config/menus.ts` → `sidebarNav.modern` | `module/index.tsx` 写死读 `modern` |
| 改 Classic / Popover 侧栏树 | `config/menus.ts` → `sidebarNav.classic` | 两处侧栏共享同一数据源，需保持结构兼容组件 |
| 改菜单类型与 `sidebarNav` 的映射 | `module/index.tsx` / `classic/index.tsx` / `popover/index.tsx` | 例如让 Popover 使用 `modern` 需改 `menus = menusConfig.sidebarNav.xxx` |
| 图标、路由、多语言 key | `config/menus.ts` + `lib/utils` 的 `translate` | 与 `trans` 字典联动（Dashboard `getDictionary`） |

官方文档中的 `nested` / `child` / `megaMenu` 等字段，在本项目 `MenuItemProps` 中均有对应；**新增层级**时需同时看 `menu-item.tsx`、`nested-menus.tsx`、`horizontal-menu.tsx` 是否解析该字段。

---

## 六、与 DashTail 文档的差异清单（避免照抄官方字符串）

1. **layout 取值**：代码为 `semibox`，不是 `semi-box`。
2. **文档示例 `reverse` 布局**：本模板未使用 `reverse` 键，而用 `semibox` + 不同 Header 样式达到类似「半盒」效果。
3. **Navbar**：Customizer 增加 `hidden`；horizontal 布局下不展示 `floating`。
4. **Direction**：除 CSS `dir` 外，Rtl Switch 会改路由 locale，且实现上仅简化为 `en`/`ar`。
5. **ThemeCustomize 可见性**：`module` 竖向布局下与 `useMediaQuery("(min-width: 768px)")` 耦合，与官方「始终右下角齿轮」可能不一致。
6. **本项目增值**：`content-wrapper` 上根据 Copilot 侧栏 `marginRight`（`COPILOT_SIDEBAR_WIDTH`）预留空间，不属于 DashTail 原版文档范围。

---

## 七、推荐阅读顺序（Cursor Agent）

1. `config/site.ts` — 默认值与注释中的合法枚举。  
2. `store/index.ts` — `setLayout` 副作用。  
3. `provider/dashboard.layout.provider.tsx` — 三种 layout 的 DOM 结构差异（二开新 layout 从这里复制分支）。  
4. `components/partials/header/index.tsx` — `navbarType` 全分支。  
5. `components/partials/footer/index.tsx` — `footerType` 与 margin 对齐。  
6. `components/partials/sidebar/index.tsx` + 三个子目录 — 菜单数据源与交互。  
7. `specs/layout-structure.md` — Provider 链与 i18n。  
8. 官方：[Layout Customization](https://dash-tail.vercel.app/docs/layout-customization)、[Menu Customization](https://dash-tail.vercel.app/docs/menu-customization) — 理解产品意图与命名历史。

---

## 八、维护说明

当以下任一处发生结构性变更时，应同步更新本文档与 `specs/INDEX.md` 中的引用：

- `setLayout` / `setSidebarType` 规则；
- `dashboard.layout.provider.tsx` 分支或 `content-wrapper` margin 约定；
- `menusConfig` 形状或某侧栏组件改读不同 key；
- `globals.scss` 中 `page-min-height*` 或 `layout-padding` 计算方式。
