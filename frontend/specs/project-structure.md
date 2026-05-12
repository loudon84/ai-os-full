# 项目代码结构文档

> 本文档描述项目完整代码结构，供 Agent 在开发时从代码结构与组件清单完成功能落点。
> 项目名称：DashTail (smc-coworker-aios/portal)

---

## 一、技术栈概览

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 14.1.3 |
| 语言 | TypeScript | ^5.4.5 |
| UI 库 | React | 18.2.0 |
| 样式 | Tailwind CSS + SCSS | 3.3.3 |
| UI 组件 | Shadcn/UI (Radix UI + CVA) | 50+ 组件 |
| 图标 | Lucide React + @iconify/react | - |
| 动画 | framer-motion | ^10.16.3 |
| 状态管理 | Zustand (全局) + React Query (服务端) | ^4.4.1 / ^5.8.3 |
| 表单 | react-hook-form + zod | ^7.48.2 / ^3.22.4 |
| 认证 | NextAuth.js + bcrypt | ^4.24.5 |
| 图表 | ApexCharts + Recharts + Chart.js + Unovis | 4 套 |
| AI | CopilotKit | ^1.56.2 |
| 国际化 | 自实现 ([lang] 路由 + middleware) | en/bn/ar |
| 开发工具 | Storybook 10 + AST-Grep | ^10.3.5 / ^0.42.1 |

---

## 二、目录结构总览

```
portal/
├── app/                        # Next.js App Router 路由
│   ├── [lang]/                 #   国际化动态路由
│   │   ├── layout.tsx          #     根 Layout (Provider 嵌套)
│   │   ├── page.tsx            #     根页面 (重定向)
│   │   ├── error.tsx           #     全局错误边界
│   │   ├── not-found.tsx       #     404 页面
│   │   ├── workspace/          #     个人工作台（WorkspaceLayoutProvider，与 dashboard 平级）
│   │   ├── hermes/             #     Hermes（同上）
│   │   ├── email/              #     邮件工作区（同上）
│   │   ├── (dashboard)/        #     Dashboard 路由组 (需登录)
│   │   ├── auth/               #     认证页面 (无需登录)
│   │   ├── error-page/         #     错误页面 (401~503)
│   │   ├── finance/            #     金融模块 (空)
│   │   └── utility/            #     工具页面 (即将上线/维护中)
│   ├── api/                    #   API Routes (REST)
│   │   ├── auth/               #     NextAuth
│   │   ├── copilot/            #     CopilotKit 运行时
│   │   ├── boards/             #     看板 CRUD
│   │   ├── calendars/          #     日历 CRUD
│   │   ├── chat/               #     聊天系统
│   │   ├── comments/           #     评论 CRUD
│   │   ├── email/              #     邮件 CRUD
│   │   ├── projects/           #     项目 CRUD
│   │   ├── tasks/              #     任务/子任务 CRUD
│   │   └── user/               #     用户注册
│   ├── assets/                 #   静态资源 (SCSS)
│   ├── dictionaries/           #   国际化字典 (en/bn/ar JSON)
│   └── dictionaries.ts         #   字典加载工具
│
├── components/                 # 组件库
│   ├── ui/                     #   Shadcn/UI 基础组件 (50+)
│   ├── auth/                   #   认证业务组件 (登录/验证表单)
│   ├── files/                  #   文件管理组件
│   ├── landing-page/           #   落地页组件 (14 个区块)
│   ├── partials/               #   布局局部组件
│   │   ├── header/             #     头部 (导航/搜索/通知/语言/主题/用户)
│   │   ├── sidebar/            #     侧边栏 (module/classic/popover/mobile)
│   │   ├── footer/             #     页脚 (static/sticky/mobile)
│   │   └── customizer/         #     主题定制器 (10 个配置项)
│   ├── task-board/             #   任务看板组件 (拖拽/看板/列表)
│   ├── svg/                    #   SVG 图标 (90+)
│   └── *.tsx                   #   通用业务组件 (8 个)
│
├── ai/                         # AI Copilot 模块
│   ├── components/             #   UI 组件 (7 个)
│   ├── hooks/                  #   Hooks (3 个)
│   ├── lib/                    #   类型+配置+客户端
│   ├── provider/               #   CopilotKit Provider
│   └── registry/               #   页面上下文注册表
│
├── provider/                   # Provider 层
│   ├── auth.provider.tsx       #   NextAuth SessionProvider
│   ├── dashboard.layout.provider.tsx  # Dashboard 布局 Provider
│   ├── workspace.layout.provider.tsx  # 个人工作台布局（Header + flex 主区）
│   ├── direction.provider.tsx  #   RTL/LTR 方向 Provider
│   ├── providers.client.tsx    #   React Query Provider
│   └── providers.tsx           #   主题+Toast+Body Provider
│
├── config/                     # 配置层
│   ├── axios.config.ts         #   Axios HTTP 配置
│   ├── calendar.config.ts      #   日历配置
│   ├── menus.ts                #   菜单/导航配置
│   ├── project-config.ts       #   项目管理 API 封装
│   ├── site.ts                 #   站点配置 (主题/布局默认值)
│   ├── thems.ts                #   12 套主题 CSS 变量
│   └── user.config.ts          #   用户注册 API 封装
│
├── lib/                        # 工具库
│   ├── appex-chart-options.ts  #   ApexCharts 配置选项
│   ├── auth.ts                 #   NextAuth 认证配置
│   ├── interface.ts            #   接口定义
│   ├── type.ts                 #   类型定义
│   └── utils.ts                #   工具函数 (cn 等)
│
├── store/                      # 状态管理
│   └── index.ts                #   useThemeStore + useSidebar (Zustand)
│
├── hooks/                      # 自定义 Hooks
│   ├── use-media-query.ts      #   媒体查询
│   └── use-mounted.ts          #   挂载状态
│
├── action/                     # Server Actions
│   ├── auth-action.ts          #   用户注册
│   ├── calendar-action.ts      #   日历事件增删改
│   └── project-action.ts       #   项目/看板/任务/子任务/评论 CRUD
│
├── tools/                      # 开发工具
│   └── ast-grep/               #   AST 代码扫描
│       ├── scan.ts
│       ├── sgconfig.yml
│       └── rules/              #   扫描规则 (5 个 YAML)
│
├── generated/                  # 生成数据
│   └── raw/                    #   AST 扫描结果 (6 个 JSON)
│
├── scripts/                    # 构建脚本
│   └── *.py                    # Python 脚本 (6 个，生成 Storybook Stories)
├── modules/                    # 独立模块（含 email 业务工作区）
├── docs/                       # 文档
│   └── prd/                    #   PRD 文档
│
├── specs/                      # 规格描述文档 (本目录)
│   ├── components.md           #   组件清单与示例
│   ├── pages.md                #   页面清单与简述
│   ├── layout-structure.md     #   Layout 结构描述
│   └── project-structure.md    #   项目代码结构 (本文档)
│
├── middleware.ts               # Next.js 中间件 (i18n)
├── next.config.js              # Next.js 配置
├── tailwind.config.ts          # Tailwind CSS 配置
├── tsconfig.json               # TypeScript 配置
├── postcss.config.js           # PostCSS 配置
└── package.json                # 项目依赖
```

---

## 三、数据流架构

### 3.1 页面数据流

```
用户请求
  → middleware.ts (i18n 重定向)
  → app/[lang]/layout.tsx (Provider 初始化)
  → app/[lang]/(dashboard)/layout.tsx (认证检查 + 翻译加载)
  → page.tsx (页面组件)
    → Server Component (直接 fetch/await)
    → Client Component
      → useQuery (React Query 缓存)
      → useMutation (React Query 变更)
      → Server Action (action/) → revalidatePath
```

### 3.2 CRUD 数据流

```
UI 组件 (Client Component)
  → Server Action (action/*.ts)
    → API 封装 (config/project-config.ts)
      → axios (HTTP 客户端)
        → API Route (app/api/*/route.ts)
          → 内存数据 (data.ts) / 外部服务
    → revalidatePath("/") (缓存失效)
```

### 3.3 AI Copilot 数据流

```
CopilotSessionPanel (UI)
  → sendCopilotMessage (ai/lib/ai-os-client.ts)
    → POST /api/copilot
      → CopilotRuntime + OpenAIAdapter
        → Hermes LLM 后端
```

### 3.4 认证数据流

```
登录表单 (LogInForm)
  → signIn("credentials"/"github"/"google") (next-auth/react)
    → POST /api/auth/[...nextauth]
      → NextAuth JWT 策略
        → Session Cookie

Dashboard Layout
  → getServerSession(authOptions) (服务端)
    → Session Cookie → 用户信息
    → 未登录 → redirect("/auth/login")
```

---

## 四、关键模块说明

### 4.1 路由组织策略

| 路由组 | 路径 | 是否需要登录 | 共享 Layout |
|--------|------|-------------|-------------|
| `(dashboard)` | `app/[lang]/(dashboard)/` | 是 | Header + Sidebar + Footer + ThemeCustomize |
| `(home)` | `(dashboard)/(home)/` | 是 | Dashboard Layout + 首页子布局 |
| `(apps)` | `(dashboard)/(apps)/` | 是 | Dashboard Layout + 应用子布局 |
| `(chart)` | `(dashboard)/(chart)/` | 是 | Dashboard Layout + 图表子布局 |
| `(components)` | `(dashboard)/(components)/` | 是 | Dashboard Layout + 组件展示子布局 |
| `(forms)` | `(dashboard)/(forms)/` | 是 | Dashboard Layout + 表单子布局 |
| `(diagram)` | `(dashboard)/(diagram)/` | 是 | Dashboard Layout + 流程图子布局 |
| `(invoice)` | `(dashboard)/(invoice)/` | 是 | Dashboard Layout + 发票子布局 |
| `(map)` | `(dashboard)/(map)/` | 是 | Dashboard Layout + 地图子布局 |
| `(tables)` | `(dashboard)/(tables)/` | 是 | Dashboard Layout + 表格子布局 |
| `(icons)` | `(dashboard)/(icons)/` | 是 | Dashboard Layout + 图标子布局 |
| `auth` | `app/[lang]/auth/` | 否 | Auth Layout |
| `error-page` | `app/[lang]/error-page/` | 否 | Error Page Layout |
| `utility` | `app/[lang]/utility/` | 否 | Utility Layout |

### 4.2 API 路由与 Server Action 对照

| 业务域 | API Route | Server Action | 数据文件 |
|--------|-----------|---------------|---------|
| 认证 | `/api/auth/[...nextauth]` | - | - |
| 用户注册 | `/api/user/register` | `addUser` (auth-action) | `api/user/data.ts` |
| 项目 | `/api/projects` | `addProjectAction/deleteProjectAction/editProjectAction/viewProjectAction` | `api/projects/data.ts` |
| 看板 | `/api/boards` | `addBoardAction/editBoardAction/swapBoardAction/deleteBoardAction` | `api/boards/data.ts` |
| 任务 | `/api/tasks` | `addTaskAction/deleteTaskAction/updateTaskAction` | `api/tasks/data.ts` |
| 子任务 | `/api/tasks/subtasks` | `addSubTaskAction/deleteSubTaskAction/updateSubTaskAction` | `api/tasks/data.ts` |
| 评论 | `/api/comments` | `postCommentAction` | `api/comments/data.ts` |
| 日历 | `/api/calendars` | `AddEvent/deleteEventAction/updateEventAction` | `api/calendars/data.ts` |
| 聊天 | `/api/chat` | - | `api/chat/data.ts` |
| 邮件 | `/api/email/*` → middleware proxy → backend `/api/v1/email/*` | 客户端直接调用 `modules/email/services/email-api.ts`（Bearer 由 `config/axios.config.ts` 注入） | - |
| Copilot | `/api/copilot` | - | - |

### 4.3 状态管理职责划分

| Store/Hook | 位置 | 职责 | 持久化 |
|------------|------|------|--------|
| `useThemeStore` | `store/index.ts` | 主题色/圆角/布局/导航栏/页脚/RTL | localStorage |
| `useSidebar` | `store/index.ts` | 侧边栏折叠/类型/子菜单/背景/移动端 | localStorage |
| `useGlobalCopilotStore` | `ai/hooks/useGlobalCopilotStore.ts` | Copilot 侧边栏开关/会话ID | 无 |
| `useSession` | next-auth/react | 认证会话 | Cookie |
| `useQuery/useMutation` | @tanstack/react-query | 服务端数据缓存/变更 | 内存 |

---

## 五、开发指引

### 5.1 新增 Dashboard 页面

```
1. 创建目录: app/[lang]/(dashboard)/my-page/
2. 创建 page.tsx:
   export default function MyPage() {
     return <div>My Page</div>;
   }
3. (可选) 创建 layout.tsx 添加页面级布局
4. 页面自动获得: 认证保护 + Header + Sidebar + Footer + ThemeCustomize
5. URL: /{lang}/my-page
```

### 5.2 新增 API 路由

```
1. 创建目录: app/api/my-resource/
2. 创建 route.ts:
   export async function GET(request) { ... }
   export async function POST(request) { ... }
3. (可选) 创建 data.ts 存放内存数据
4. URL: /api/my-resource
```

### 5.3 新增 Server Action

```
1. 在 action/ 下创建或追加:
   "use server";
   export async function myAction(data: MyType) {
     // 调用 API 封装
     await myApiCall(data);
     revalidatePath("/");
   }
2. 在 Client Component 中:
   import { myAction } from "@/action/my-action";
   <form action={myAction}>...</form>
   // 或
   <button onClick={() => myAction(data)}>...</button>
```

### 5.4 新增 UI 组件

```
1. 在 components/ui/ 下创建组件文件
2. 基于 Radix UI 原语 + Tailwind CSS + CVA (class-variance-authority)
3. 使用 cn() (lib/utils.ts) 合并 className
4. 导出组件和子组件
5. 在 (dashboard)/(components)/ 下创建展示页面 (可选)
```

### 5.5 新增业务组件

```
1. 在 components/ 对应目录下创建组件
2. 使用 UI 基础组件组合
3. 通过 props 传入数据，通过 callback 传出事件
4. 复杂表单使用 react-hook-form + zod
5. 数据获取使用 useQuery，变更使用 useMutation + Server Action
```

### 5.6 新增 AI Copilot 页面上下文

```
1. 在 ai/registry/page-context-registry.ts 注册:
   myPage: {
     pageId: "my-page",
     pageTitle: "我的页面",
     module: "my-module",
     summary: "页面功能描述",
     actions: [
       { id: "my-action", label: "动作名称", description: "动作描述" }
     ]
   }
2. 在页面组件中使用:
   const context = usePageCopilotContext({ pageId: "my-page", ... });
   <CopilotSessionPanel context={context} />
```

### 5.7 新增菜单项

```
1. 在 config/menus.ts 中添加菜单项:
   {
     title: "My Page",
     icon: MyIcon,
     href: "/my-page",
   }
2. 同时添加到 mainNav (水平布局) 和 sidebarNav.modern/classic (侧边栏)
3. 添加国际化翻译到 dictionaries/{en,bn,ar}.json
```

---

## 六、配置文件速查

| 文件 | 用途 | 关键配置 |
|------|------|---------|
| `config/site.ts` | 站点默认配置 | theme: "violet", layout: "vertical", sidebarType: "module", radius: 0.5 |
| `config/menus.ts` | 菜单/导航配置 | mainNav + sidebarNav (modern/classic) |
| `config/thems.ts` | 12 套主题 CSS 变量 | 每套含 light/dark 双模式完整 CSS 变量 |
| `config/axios.config.ts` | Axios HTTP 配置 | baseURL, interceptors |
| `config/project-config.ts` | 项目管理 API 封装 | 全量 CRUD 函数 |
| `lib/auth.ts` | NextAuth 配置 | providers, JWT, session 回调 |
| `middleware.ts` | i18n 中间件 | locales: [bn, en, ar], defaultLocale: "en" |
| `next.config.js` | Next.js 配置 | SVG 转 React, 远程图片域名 |
| `tailwind.config.ts` | Tailwind 配置 | darkMode: "class", CSS 变量颜色系统 |
| `tsconfig.json` | TypeScript 配置 | strict, 路径别名 @/* → ./* |

---

## 七、路径别名

| 别名 | 实际路径 | 用途 |
|------|---------|------|
| `@/*` | `./*` (项目根目录) | 所有模块导入 |

常用导入路径：
```tsx
import { Button } from "@/components/ui/button";        // UI 组件
import { useThemeStore } from "@/store";                 // 状态管理
import { cn } from "@/lib/utils";                        // 工具函数
import { siteConfig } from "@/config/site";              // 站点配置
import { menusConfig } from "@/config/menus";            // 菜单配置
import { getDictionary } from "@/app/dictionaries";      // 国际化
import { authOptions } from "@/lib/auth";                // 认证配置
```

---

## 八、文件命名约定

| 模式 | 示例 | 说明 |
|------|------|------|
| `page.tsx` | `dashboard/page.tsx` | Next.js 页面组件 |
| `layout.tsx` | `(dashboard)/layout.tsx` | Next.js 布局组件 |
| `loading.tsx` | `projects/loading.tsx` | Next.js 加载状态 |
| `error.tsx` | `(dashboard)/error.tsx` | Next.js 错误边界 |
| `route.ts` | `api/projects/route.ts` | Next.js API 路由 |
| `*.tsx` | `project-grid.tsx` | React 组件 |
| `*.ts` | `data.ts` | 数据/类型/工具 |
| `source-code.ts` | `button/source-code.ts` | 组件展示页的源码数据 |
| `*-form.tsx` | `login-form.tsx` | 表单组件 |
| `*-action.ts` | `project-action.ts` | Server Action |
| `use-*.ts` | `use-media-query.ts` | 自定义 Hook |
| `*.config.ts` | `axios.config.ts` | 配置文件 |
| `*.scss` | `globals.scss` | 全局样式 |
| `*.json` | `en.json` | 国际化字典 |
