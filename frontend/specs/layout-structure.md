# Layout 结构描述文档

> 本文档深入分析 `app/[lang]/(dashboard)/layout.tsx` 及其关联的 Provider 嵌套结构，
> 帮助 Agent 理解页面渲染的完整生命周期和布局模式。

---

## 一、Layout 嵌套全景图

```
middleware.ts
  |-- 检测 URL 语言前缀，缺失则重定向 /{locale}/...
  |-- 支持语言: en(默认), bn, ar
  |-- 排除路径: api, assets, docs, 静态文件, _next

app/[lang]/layout.tsx (RootLayout - 服务端组件)
  |-- <html lang={lang}>
  |   |-- <AuthProvider>                    next-auth SessionProvider, basePath="/api/auth"
  |   |   |-- <TanstackProvider>            React QueryClientProvider
  |   |   |   |-- <Providers>               ThemeProvider + <body> + Toast 通知
  |   |   |   |   |-- <GlobalCopilotProvider> CopilotKit 全局状态, runtimeUrl="/api/copilot"
  |   |   |   |   |   |-- <DirectionProvider lang={lang}> RTL/LTR 方向控制
  |   |   |   |   |   |   |-- {children}    ← 各子路由的 layout/page

app/[lang]/(dashboard)/layout.tsx (DashboardLayout - 服务端组件)
  |-- getServerSession(authOptions)         服务端认证检查
  |   |-- 未登录 → redirect("/auth/login")
  |-- getDictionary(lang)                   获取国际化翻译字典
  |-- <DashBoardLayoutProvider trans={trans}>  客户端组件
  |   |-- 未挂载 → <LayoutLoader />
  |   |-- 根据 layout 模式渲染:
  |   |   |-- <Header>                      顶部导航栏
  |   |   |-- <Sidebar>                     侧边栏 (horizontal 模式无)
  |   |   |-- <ContentWrapper>              内容区 (margin-left 根据 collapsed 状态)
  |   |   |   |-- <LayoutWrapper>
  |   |   |   |   |-- <motion.div>          页面切换动画 (framer-motion)
  |   |   |   |   |   |-- <main>{children}</main>
  |   |   |   |   |-- <MobileSidebar>       移动端侧边栏
  |   |   |   |   |-- <HeaderSearch>        头部搜索弹窗
  |   |   |-- <Footer>                      页脚
  |   |   |-- <ThemeCustomize>              主题定制面板 (Sheet 侧滑)

app/[lang]/workspace/layout.tsx（个人工作台 — 与 `(dashboard)` 平级）
  |-- getServerSession + redirect 同 DashboardLayout
  |-- <WorkspaceLayoutProvider trans={trans}>
  |   |-- 未挂载 → <LayoutLoader />
  |   |-- flex h-screen flex-col：Header（flex-shrink-0）+ main（flex-1 min-h-0 overflow-auto，class 含 `workspace-layout`）
  |   |-- main 的 marginRight 随 Global Copilot 开关（与 dashboard 同源 store）
  |   |-- `globals.scss`：`.workspace-layout .app-height` 覆盖全屏高度扣除（桌面 `-8rem`、≤768px `-7.6rem`），区别于 dashboard 下 `.app-height`
  |   |-- <HeaderSearch>
  |-- 无 Sidebar / Footer / ThemeCustomize；全局 Copilot 仍在 RootLayout

app/[lang]/hermes/layout.tsx（Hermes — 与 `(dashboard)` 平级）
  |-- getServerSession + redirect 同 DashboardLayout
  |-- <WorkspaceLayoutProvider trans={trans}>
  |   |-- 同 workspace：仅 Header + flex 主区 + HeaderSearch + Copilot 右侧避让
  |-- Hermes 子路由：/hermes、/hermes/sessions、/hermes/skills、/hermes/settings、/hermes/runtime、/hermes/dev/*

app/[lang]/email/layout.tsx（Email — 与 `(dashboard)` 平级）
  |-- getServerSession + redirect 同 DashboardLayout
  |-- <WorkspaceLayoutProvider trans={trans}>
  |   |-- 同 workspace：仅 Header + flex 主区 + HeaderSearch + Copilot 右侧避让
  |-- Email 子路由：/email、/email/settings
```

**EmailWorkspace 内部**：`ResizablePanelGroup` 横向三栏（窄屏为「主列表/详情」+「AI Panel」两栏比例约 72/28）：侧栏文件夹（宽屏）· 中间列表或详情（`EmailDetailPane` = 线程视图 + 正文 + `EmailActionBar`）· 右侧 `EmailAIPanel`（可折叠，`react-resizable-panels:layout` cookie 存 **3 个** size）。撰写支持浮层与全屏；全屏右侧为 `EmailComposeAIPanel`（润色/翻译当前正文）。

---

## 二、Provider 详细说明

### 2.1 AuthProvider (`provider/auth.provider.tsx`)

```tsx
// 客户端组件
<SessionProvider basePath="/api/auth">
  {children}
</SessionProvider>
```

- 基于 NextAuth 的 `SessionProvider`
- 使整个应用可通过 `useSession()` 访问认证状态
- basePath 指向 `/api/auth`，对应 `app/api/auth/[...nextauth]/route.ts`

### 2.2 TanstackProvider (`provider/providers.client.tsx`)

```tsx
// 客户端组件
const [queryClient] = useState(new QueryClient());
<QueryClientProvider client={queryClient}>
  {children}
</QueryClientProvider>
```

- 提供 TanStack React Query 的 QueryClient
- 使用 `useState` 确保 QueryClient 实例在重渲染间保持稳定
- 页面组件可通过 `useQuery`/`useMutation` 获取/变更服务端数据

### 2.3 Providers (`provider/providers.tsx`)

```tsx
// 客户端组件，渲染 <body> 标签
<body className={cn("dash-tail-app", inter.className, "theme-" + theme)}
      style={{ "--radius": `${radius}rem` }}>
  <ThemeProvider attribute="class" enableSystem={false} defaultTheme="light">
    <div className="h-full">
      {children}
      <ReactToaster />     // Radix Toast 渲染容器
    </div>
    <Toaster />            // react-hot-toast
    <SonnToaster />        // Sonner Toast
  </ThemeProvider>
</body>
```

- 渲染 `<body>` 标签，是整个应用的 body 入口
- 根路径 `/` 不应用主题 class 和 radius CSS 变量
- 非根路径应用 `theme-{theme}` class 和 `--radius` CSS 变量
- 包含三种 Toast 通知系统

### 2.4 GlobalCopilotProvider (`ai/provider/GlobalCopilotProvider.tsx`)

```tsx
// 客户端组件
<CopilotKit runtimeUrl="/api/copilot">
  {children}
</CopilotKit>
```

- 包裹 CopilotKit 运行时，连接 `/api/copilot` 端点
- 提供 AI 助手全局上下文

### 2.5 DirectionProvider (`provider/direction.provider.tsx`)

```tsx
// 客户端组件
const direction = lang === "ar" || isRtl ? "rtl" : "ltr";
<div dir={direction}>
  <RadixDirectionProvider dir={direction}>
    {children}
  </RadixDirectionProvider>
</div>
```

- 根据 URL 的 `lang` 参数（阿拉伯语 `ar`）或 store 的 `isRtl` 标志决定方向
- 同时设置 HTML `dir` 属性和 Radix UI 的 DirectionProvider
- 确保所有 Radix UI 组件也遵循 RTL/LTR 方向

---

## 三、Dashboard Layout 详细说明

### 3.1 服务端逻辑 (`(dashboard)/layout.tsx`)

```tsx
// 服务端组件 (async function)
const layout = async ({ children, params: { lang } }) => {
  // 1. 认证检查
  const session = await getServerSession(authOptions as NextAuthOptions);
  if (!session?.user?.email) {
    redirect("/auth/login");  // 未登录重定向
  }

  // 2. 获取国际化翻译
  const trans = await getDictionary(lang);

  // 3. 渲染客户端布局
  return (
    <DashBoardLayoutProvider trans={trans}>{children}</DashBoardLayoutProvider>
  );
};
```

**关键点：**
- 这是服务端组件，在服务端执行认证检查
- `getServerSession` 从 cookie 中获取会话
- `getDictionary(lang)` 加载对应语言的翻译 JSON
- 将 `trans` 传递给客户端组件 `DashBoardLayoutProvider`

### 3.2 客户端布局逻辑 (`provider/dashboard.layout.provider.tsx`)

#### 四种布局模式

| 模式 | 条件 | 结构 | Sidebar 宽度 (展开/折叠) |
|------|------|------|--------------------------|
| **vertical (module)** | 默认 | Header + Sidebar + ContentWrapper + Footer + ThemeCustomize(仅桌面) | 300px / 72px |
| **vertical (非module)** | `sidebarType !== "module"` | Header + Sidebar + ContentWrapper + Footer + ThemeCustomize | 248px / 72px |
| **semibox** | `layout === "semibox"` | Header + Sidebar + ContentWrapper(semibox) + Footer + ThemeCustomize | 272px / 72px |
| **horizontal** | `layout === "horizontal"` | Header + ContentWrapper(horizontal) + Footer + ThemeCustomize | 无侧边栏偏移 |

#### 布局模式联动关系

```
setLayout("semibox")    → 自动设置 sidebarType="popover"
setLayout("horizontal") → 自动设置 sidebarType="classic" + navbarType="sticky"
```

#### Copilot 侧边栏联动

- 当 Copilot 侧边栏打开时，内容区 `marginRight: COPILOT_SIDEBAR_WIDTH` (400px)
- 通过 `useGlobalCopilotStore` 的 `open` 状态控制

#### LayoutWrapper 子组件

```
LayoutWrapper
  |-- <motion.div>          页面切换动画 (opacity: 0→1, y: 15→0, 0.5s tween)
  |   |-- <main>{children}</main>
  |-- <MobileSidebar>       移动端侧边栏 (isMobile 时显示)
  |-- <HeaderSearch>        头部搜索弹窗 (基于 Command 组件)
```

---

## 四、Header 组件结构

```
Header (components/partials/header/)
  |-- 垂直布局:
  |   |-- <MenuBar> (vertical-header.tsx)
  |   |   |-- 折叠按钮 (Hamburger/Arrow)
  |   |   |-- <NavTools> (导航工具栏)
  |   |       |-- <Language>        语言切换 (en/bn/ar)
  |   |       |-- <FullScreenToggle> 全屏切换
  |   |       |-- <ThemeButton>     主题切换 (亮/暗/系统)
  |   |       |-- <Inbox>           收件箱下拉
  |   |       |-- <NotificationMessage> 通知下拉
  |   |       |-- <ProfileInfo>     用户头像下拉 (登出/个人资料)
  |
  |-- 水平布局:
  |   |-- <horizontalHeader> (horizontal-header.tsx)
  |   |   |-- Logo + 搜索按钮
  |   |-- <MainMenu> (horizontal-menu.tsx)
  |   |   |-- 基于 Radix NavigationMenu 的水平导航
  |   |-- <NavTools> (同上)
```

---

## 五、Sidebar 组件结构

```
Sidebar (components/partials/sidebar/)
  |-- 根据 sidebarType 选择:
  |   |-- "module"  → <ModuleSidebar>    现代模块化侧边栏
  |   |   |-- Logo
  |   |   |-- <MenuLabel>               菜单分组标签
  |   |   |-- <SingleIconMenu>          单图标菜单项
  |   |   |-- <NestedMenus>             嵌套子菜单
  |   |   |-- <MultiNested>             多层嵌套菜单
  |   |   |-- <LogoutFooter>            底部登出按钮
  |   |   |-- <MenuOverlayPortal>       折叠时悬浮菜单
  |   |
  |   |-- "classic" → <ClassicSidebar>  经典分组侧边栏
  |   |   |-- Logo
  |   |   |-- <SingleMenuItem>          单菜单项
  |   |   |-- <SubMenuItem>             子菜单项
  |   |   |-- <SubMenuHandler>          子菜单展开/折叠
  |   |
  |   |-- "popover" → <PopoverSidebar>  悬浮折叠侧边栏
  |   |   |-- (同 Classic 结构，折叠时悬浮显示)
  |   |
  |   |-- 移动端 → <MobileSidebar>
  |       |-- (独立实现，底部导航栏)
```

### 菜单数据来源

```
config/menus.ts
  |-- mainNav          → 水平布局 Header 导航
  |-- sidebarNav.modern   → Module 侧边栏 (nested 结构)
  |-- sidebarNav.classic  → Classic/Popover 侧边栏 (multi_menu + isHeader 分组)
```

**主导航分类：** Dashboard, Application, Components, Forms, Pages, Tables, Diagram, Chart, Maps, Icons

---

## 六、Footer 组件结构

```
Footer (components/partials/footer/)
  |-- 根据 footerType + isMobile 选择:
  |   |-- "hidden"  → null
  |   |-- isMobile  → <MobileFooter> (搜索/首页/设置)
  |   |-- "static"  → <FooterLayout> (版权信息)
  |   |-- "sticky"  → <FooterLayout> (固定底部)
```

---

## 七、ThemeCustomize 组件结构

```
ThemeCustomize (components/partials/customizer/theme-customizer.tsx)
  |-- 基于 Sheet (侧滑面板)
  |-- <SelectLayout>     布局选择: Vertical / Horizontal / Semi-Box
  |-- <SelectTheme>      明暗主题: Light / Dark
  |-- <ThemeChange>      主题色: 12套 (zinc/slate/stone/gray/neutral/red/rose/orange/green/blue/yellow/violet)
  |-- <SidebarChange>    侧边栏类型: Module / Classic / Popover
  |-- <HeaderStyle>      头部类型: sticky / static / hidden
  |-- <FooterStyle>      页脚类型: sticky / static / hidden
  |-- <RadiusInit>       圆角: 0 / 0.3 / 0.5 / 0.75 / 1.0
  |-- <RtlSwitcher>      RTL/LTR 切换
  |-- <SidebarImage>     侧边栏背景图片
```

---

## 八、状态管理数据流

### 8.1 useThemeStore (Zustand + localStorage 持久化)

| 状态 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `theme` | string | `"violet"` | 主题色方案 |
| `radius` | number | `0.5` | 全局圆角半径 (rem) |
| `layout` | string | `"vertical"` | 布局模式: vertical / semibox / horizontal |
| `navbarType` | string | `"sticky"` | 导航栏类型: sticky / floating / static |
| `footerType` | string | `"static"` | 页脚类型: sticky / static / hidden |
| `isRtl` | boolean | `false` | RTL 模式 |

### 8.2 useSidebar (Zustand + localStorage 持久化)

| 状态 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `collapsed` | boolean | `false` | 侧边栏折叠 |
| `sidebarType` | string | 根据 layout 决定 | 侧边栏类型: module / classic / popover |
| `subMenu` | boolean | `false` | 子菜单展开 |
| `sidebarBg` | string | `"none"` | 侧边栏背景 |
| `mobileMenu` | boolean | `false` | 移动端菜单开关 |

### 8.3 useGlobalCopilotStore (Zustand)

| 状态 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `open` | boolean | `false` | Copilot 侧边栏开关 |
| `sessionId` | string? | `undefined` | 当前会话 ID |

---

## 九、认证流程

```
1. 用户访问 /{lang}/dashboard
2. middleware.ts → 检测语言前缀，缺失则重定向
3. (dashboard)/layout.tsx → getServerSession()
4. 若未登录 → redirect("/auth/login")
5. 若已登录 → 渲染 DashBoardLayoutProvider
6. ProfileInfo 组件 → useSession() 获取用户信息
7. 登出 → signOut() → 清除 session → 重定向到 /auth/login
```

---

## 十、国际化流程

```
1. middleware.ts → 检测 URL 语言前缀
2. 缺失 → 根据 Accept-Language 匹配 → 重定向 /{locale}/...
3. [lang]/layout.tsx → 传递 lang 给 DirectionProvider
4. (dashboard)/layout.tsx → getDictionary(lang) 加载翻译
5. 翻译字典 → 传递给 DashBoardLayoutProvider → 传递给 Sidebar/Header
6. DirectionProvider → lang==="ar" || isRtl → RTL/LTR
7. 字典文件: app/dictionaries/{en,bn,ar}.json
```

---

## 十一、主题系统流程

```
1. config/site.ts → 默认主题配置 (theme: "violet", layout: "vertical", ...)
2. config/thems.ts → 12 套主题 CSS 变量 (light/dark 双模式)
3. useThemeStore → Zustand + localStorage 持久化
4. Providers → <body className={"theme-" + theme} style={{"--radius": radius}}>
5. ThemeProvider (next-themes) → attribute="class" → 切换 dark class
6. ThemeCustomize → 修改 useThemeStore → 触发重渲染 → CSS 变量生效
7. Tailwind CSS → darkMode: "class" → 根据 .dark class 切换暗色样式
```

---

## 十二、新增页面的 Layout 接入方式

### 方式一：加入 Dashboard 路由组（需要登录）

在 `app/[lang]/(dashboard)/` 下新建目录，自动继承 Dashboard Layout：
- 自动获得：Header + Sidebar + Footer + ThemeCustomize + 认证保护
- 需要创建 `layout.tsx`（可选，用于添加页面级布局）和 `page.tsx`

### 方式二：独立路由（不需要登录）

在 `app/[lang]/` 下直接新建目录（不在 `(dashboard)/` 内）：
- 仅继承 Root Layout（Provider 嵌套）
- 不获得 Dashboard 布局组件
- 不需要认证

### 方式三：路由组共享 Layout

使用 `(groupName)` 路由组（括号目录不影响 URL）：
- 同组内的页面共享一个 layout
- 例如 `(apps)/calendar` 和 `(apps)/chat` 共享 apps 级别的 layout（如果存在）

---

## 十三、Layout 设计规范（从 `docs/prd/design_layout_style.md` 提炼）

`ai-os-portal` 的主体布局不应被当作“单一后台模板”。更合适的模型是：

- **企业操作系统 Shell**：全局认证、国际化、主题与基础导航（Header + Sidebar）
- **AI Copilot 工作侧栏**：跨页面的 AI 助手（可开关，内容区联动）
- **多模块工作区**：不同模块套用不同“页面母版”（Template），但保持一致的状态与审计心智

**壳的边界（默认不改）：**
- `app/[lang]/layout.tsx`
- `app/[lang]/(dashboard)/layout.tsx`
- `provider/*`
- `components/ui/*`

除非 PRD 明确要求，否则新增能力应通过 **页面级 layout wrapper / 模块内组合组件** 来实现，而不是重写全局壳。

---

## 十四、页面母版（Page Templates）与适用范围

> 这里的“母版”是**页面结构的骨架约定**（块顺序 + 右侧 Inspector/Copilot 的使用方式），不是强制的组件库实现。其目的：让页面生成稳定、信息架构一致、状态覆盖完整。

### 14.1 `WorkspaceDashboardTemplate`

**适用：** Dashboard 工作台、Finance/Risk 主控台、运营概览（Stripe Dashboard 型）

**结构：**
```txt
PageHeader
KpiStrip / SummaryCards
FilterBar (可选)
DataTable / ChartGrid
RightInsightPanel (可选，或使用 Copilot/Inspector)
```

### 14.2 `DataManagementTemplate`

**适用：** 用户/任务/文件/知识库/审批等“列表管理页”（高信息密度表格为主）

**结构：**
```txt
PageHeader
FilterBar / Search
DataTable
BulkActionBar (可选)
RightDrawer / Inspector (可选)
```

### 14.3 `AgentWorkspaceTemplate`

**适用：** AI 助手工作页、会话中心、多 Agent 协作页（Slack/Teams 型 + 强执行态）

**结构：**
```txt
PageHeader (对象/会话/Agent 概览)
ContextPanel (选中实体、权限、引用来源)
Stream (会话流/任务流/文件流)
ExecutionTimeline / StepPanel
ResultPanel / References
PromptComposer (输入区)
```

### 14.4 `ExecutionDetailTemplate`

**适用：** Workflow / Agent Run / 审批流等“执行明细页”（Linear/Jira 型）

**结构：**
```txt
RunHeader (状态/Owner/时间/关键动作)
RunStatusSummary
ExecutionTimeline
StepLogViewer
Artifacts / Result
AuditInfo
```

### 14.5 `DocumentWorkspaceTemplate`

**适用：** 文档、知识库、Univer Datasheet 工作台（Notion/Docs 型）

**结构：**
```txt
DocumentTopBar (保存状态/权限/版本/分享)
DocumentTree / WorkspaceFiles
EditorCanvas (Block/Sheet/Markdown)
RightAIPanel (总结/改写/引用/RAG 来源)
VersionHistoryDrawer (可选)
```

### 14.6 `SettingsTemplate`

**适用：** Agent/Workflow/Tool/MCP/Skill 配置后台、RBAC、系统设置（Retool/Vercel Console 型）

**结构：**
```txt
SettingsTabs / SideNav
FormSection / ConfigTable
RightPreview (测试运行/说明/日志，可选)
DangerZone (高风险操作独立分区)
```

---

## 十五、AI 页面三栏工作系统（强制）

> 仅对 **AI/Agent/Workflow/任务执行类页面** 强制。其它页面可按需要使用两栏/单栏，但仍应保持状态覆盖与信息结构一致。

**三栏模型：**
```txt
┌───────────────┬──────────────────────────────┬───────────────┐
│ ModuleSidebar  │ WorkspaceContent             │ AI Copilot     │
│ (global nav)   │ (page templates above)      │ Sidebar        │
└───────────────┴──────────────────────────────┴───────────────┘
```

**Copilot 的约束与联动：**
- Copilot 侧边栏是全局渲染的（见 `GlobalCopilotSidebar` 在 `app/[lang]/layout.tsx`）
- 可开关：状态由 `useGlobalCopilotStore.open` 控制
- 打开时内容区联动：`marginRight: COPILOT_SIDEBAR_WIDTH`（400px）

**AI 页面必须包含的块（最低要求）：**
- Prompt 输入区
- Context 区（选中实体/权限/引用）
- Execution State 区（Running/Waiting human/Failed/Retry/Feedback）
- Result 区
- References / Sources
- Feedback / Retry / Approve 等动作

---

## 十六、业务明细应用 Workspace Layout（显式启用）

> 目标布局：左侧菜单（默认隐藏/收起） | workspace files（文件树） | 主内容 | AI Copilot（可隐藏）

**结构：**
```txt
Sidebar (default collapsed)
WorkspaceFiles (tree/explorer)
MainContent (detail/editor/table)
GlobalCopilotSidebar (toggle)
```

**触发方式（不做 URL 猜测，显式启用）：**
- 在“明细页目录”下新增 `layout.tsx`，用于包裹该明细页的页面组件并启用 Workspace Layout。
- 或在模块 page 组件内部显式包裹 `WorkspaceLayout` 组合组件（推荐放在 `modules/<domain>/components/layout/` 里统一复用）。

**推荐落点（可复用区块）：**
- `modules/workspace/components/WorkspaceFilesPanel.tsx`：workspace files 面板（文件树/搜索/展开）
- `modules/workspace/mocks/workspace-files.ts`：开发期 mock 数据（后续替换为真实数据源）

**最小交互规范：**
- 左侧模块菜单默认收起（避免抢占主内容宽度）
- Workspace files 支持搜索、展开/折叠；可作为文档/执行产物/工件的入口
- 主内容保持可滚动与最小宽度（避免被两侧栏挤压到不可用）
- Copilot 仍是全局侧栏：可隐藏，不应覆盖主内容
