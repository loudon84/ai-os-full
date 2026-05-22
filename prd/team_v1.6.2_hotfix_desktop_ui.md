下面按你修正后的目标重新定义：**Workspaces 保持三栏结构**，顶部保留 Status Cards 操作区，`Left Sidebar` 与 `Right Panel` 都支持隐藏 / 显示，中心页始终作为主内容区。

当前修复不要再做成「左｜右」两栏，也不要把 profile 状态按钮、功能入口按钮直接堆在普通页面流里。Workspaces 应该是一个独立的 workspace shell。

---

# Workspaces 三栏布局修复方案

## 1. 修正后的 Layout Decision

### route type

`navigation.workspaces` 对应桌面内置 React Workspace，不是 WebView，不是普通页面。

### selected page template

`AgentWorkspaceTemplate / Custom Workspace Shell`

原因：Workspaces 是多 Profile 的 Hermes 工作台，需要同时承载：

* 顶部状态卡
* 左侧功能导航
* 中心业务页面
* 右侧 Hermes Workspace / Inspector / Runtime Panel

### shell inheritance

保留 Electron 主壳层：

* 保留顶部应用菜单 / tab bar
* 保留 workspace renderer 统一入口
* Workspaces 内部自己管理三栏布局
* 不新增新的 BrowserWindow
* 不让 Renderer 直接访问 Node / SQLite / Gateway

Electron 架构上，Renderer 只能通过 Preload 暴露的 API 与 Main 通讯，Renderer 本身没有 Node 权限；这也是当前 desktop 架构的硬约束。

### Workspaces 目标结构

```txt
WorkspacesScreen
├─ WorkspaceStatusCards              顶部状态卡 / profile switch / setting / git pull-push
├─ WorkspaceBody
│  ├─ WorkspaceLeftSidebar            可折叠
│  ├─ WorkspaceCenterPage             动态页面内容
│  └─ WorkspaceRightPanel             可折叠 Hermes workspace
```

---

# 2. 当前问题判断

从截图看，当前 Workspaces 出现了三个问题：

## 2.1 Layout Shell 没有接管页面

现在页面内容像普通 HTML flow 一样从上往下排：

```txt
profile buttons
chat / sessions / skills buttons
failed dynamic import error
```

这说明 `Workspaces` 没有进入稳定的 `grid/flex shell`，功能入口没有被放进 `Left Sidebar`，右侧 Hermes Workspace 也没有作为独立 panel 渲染。

## 2.2 页面动态导入失败

报错：

```txt
Failed to fetch dynamically imported module:
http://localhost:5173/src/screens/Workspaces/pages/Memory/Memory.tsx
```

这类错误一般来自：

```ts
import(`/src/screens/Workspaces/pages/${page}/${page}.tsx`)
```

或 registry 中直接拼接路径。

Vite 对动态 import 的运行时字符串支持有限，尤其是 Electron + vite dev server 场景下，大小写、文件不存在、没有 default export、HMR stale 都会导致这种错误。

修复原则：**不要用运行时字符串拼接 import 路径**。改成静态 registry 或 `import.meta.glob`。

## 2.3 Workspaces / AIOSWorkspace 入口可能重复

当前 repo 中 `WorkspaceRenderer` 已经引入 `AIOSWorkspaceScreen`，说明 Workspaces 是通过 workspace renderer 统一路由出来的。 当前 `AIOSWorkspaceScreen` 又导入了 `AIOSWorkspaceShell`。

修复时不要再生成第二套平行入口。应该统一：

```txt
WorkspaceRenderer
  └─ WorkspacesScreen / AIOSWorkspaceScreen
      └─ WorkspaceThreeColumnLayout
```

如果现在同时存在：

```txt
src/screens/AIOSWorkspace/**
src/screens/Workspaces/**
```

建议让其中一个成为兼容 wrapper，避免两个布局系统互相抢状态。

---

# 3. 目标 UI 结构

## 3.1 总体结构

```txt
┌──────────────────────────────────────────────────────────────┐
│ Status Cards                                                 │
│ [Profile switch] [setting] [Git pull] [Git push]             │
├──────────────┬─────────────────────────────┬─────────────────┤
│ Left Sidebar │ Center Main Page            │ Right Panel     │
│ - chat       │                             │ Hermes workspace│
│ - sessions   │  active page content         │ runtime/context │
│ - skills     │                             │ files/logs      │
│ - tools      │                             │ inspector       │
│ - memory     │                             │                 │
│ - providers  │                             │                 │
│ - models     │                             │                 │
│ - settings   │                             │                 │
├──────────────┴─────────────────────────────┴─────────────────┤
```

## 3.2 折叠规则

| 区域               |          展开宽度 | 折叠状态       |
| ---------------- | ------------: | ---------- |
| Left Sidebar     |         220px | 48px 或 0px |
| Center Main Page |           自适应 | 始终显示       |
| Right Panel      | 320px / 360px | 0px        |
| Status Cards     |   72px / 88px | 始终显示       |

建议左侧折叠后保留 48px icon rail，右侧折叠后完全隐藏。

---

# 4. 文件级修复清单

按你现在的路径，建议以 `src/renderer/src/screens/Workspaces/` 为主。如果当前实际主入口仍叫 `AIOSWorkspace`，则保留 wrapper，把真实布局迁到 `Workspaces`。

## 4.1 新增 / 重构文件

```txt
src/renderer/src/screens/Workspaces/
├─ WorkspacesScreen.tsx
├─ layout/
│  └─ WorkspaceThreeColumnLayout.tsx
├─ context/
│  └─ WorkspaceLayoutContext.tsx
├─ registry/
│  └─ workspace-pages.tsx
├─ components/
│  ├─ WorkspaceStatusCards.tsx
│  ├─ WorkspaceLeftSidebar.tsx
│  ├─ WorkspaceCenterPage.tsx
│  ├─ WorkspaceRightPanel.tsx
│  ├─ WorkspacePanelToggle.tsx
│  └─ WorkspacePageErrorBoundary.tsx
├─ pages/
│  ├─ Chat/Chat.tsx
│  ├─ Sessions/Sessions.tsx
│  ├─ Skills/Skills.tsx
│  ├─ Tools/Tools.tsx
│  ├─ Memory/Memory.tsx
│  ├─ Providers/Providers.tsx
│  ├─ Models/Models.tsx
│  └─ Settings/Settings.tsx
└─ types.ts
```

## 4.2 修改文件

```txt
src/renderer/src/components/workspace/WorkspaceRenderer.tsx
src/renderer/src/screens/AIOSWorkspace/AIOSWorkspaceScreen.tsx
src/renderer/src/types/desktop-shell.ts
src/renderer/src/workspace/workspace-registry.ts
```

---

# 5. 核心代码结构

## 5.1 WorkspacesScreen

```tsx
import { WorkspaceLayoutProvider } from "./context/WorkspaceLayoutContext";
import { WorkspaceThreeColumnLayout } from "./layout/WorkspaceThreeColumnLayout";

export interface WorkspacesScreenProps {
  profile: string;
  activePanel?: string;
  onPanelChange?: (panel: string) => void;
}

export function WorkspacesScreen({
  profile,
  activePanel,
  onPanelChange,
}: WorkspacesScreenProps): React.JSX.Element {
  return (
    <WorkspaceLayoutProvider
      initialProfile={profile}
      initialPage={activePanel ?? "chat"}
      onPageChange={onPanelChange}
    >
      <WorkspaceThreeColumnLayout />
    </WorkspaceLayoutProvider>
  );
}
```

---

## 5.2 WorkspaceThreeColumnLayout

关键点：

* 外层必须 `h-full min-h-0 overflow-hidden`
* 顶部 status cards 固定高度
* 下方 body 使用 CSS grid
* 左右 panel 通过状态控制宽度
* 中间区域 `min-w-0 min-h-0 overflow-hidden`

```tsx
import { WorkspaceStatusCards } from "../components/WorkspaceStatusCards";
import { WorkspaceLeftSidebar } from "../components/WorkspaceLeftSidebar";
import { WorkspaceCenterPage } from "../components/WorkspaceCenterPage";
import { WorkspaceRightPanel } from "../components/WorkspaceRightPanel";
import { useWorkspaceLayout } from "../context/WorkspaceLayoutContext";

export function WorkspaceThreeColumnLayout(): React.JSX.Element {
  const { leftCollapsed, rightCollapsed } = useWorkspaceLayout();

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <WorkspaceStatusCards />

      <div
        className="grid min-h-0 flex-1 overflow-hidden"
        style={{
          gridTemplateColumns: `${
            leftCollapsed ? "48px" : "220px"
          } minmax(0, 1fr) ${rightCollapsed ? "0px" : "340px"}`,
        }}
      >
        <WorkspaceLeftSidebar />
        <WorkspaceCenterPage />
        {!rightCollapsed ? <WorkspaceRightPanel /> : null}
      </div>
    </section>
  );
}
```

---

## 5.3 WorkspaceLayoutContext

```tsx
import React from "react";
import type { WorkspacePageKey } from "../types";

interface WorkspaceLayoutState {
  activeProfile: string;
  activePage: WorkspacePageKey;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  setActiveProfile: (profile: string) => void;
  setActivePage: (page: WorkspacePageKey) => void;
  toggleLeft: () => void;
  toggleRight: () => void;
}

const WorkspaceLayoutContext = React.createContext<WorkspaceLayoutState | null>(
  null,
);

export function WorkspaceLayoutProvider({
  initialProfile,
  initialPage,
  onPageChange,
  children,
}: {
  initialProfile: string;
  initialPage: string;
  onPageChange?: (page: string) => void;
  children: React.ReactNode;
}): React.JSX.Element {
  const [activeProfile, setActiveProfile] = React.useState(initialProfile);
  const [activePage, setActivePageState] =
    React.useState<WorkspacePageKey>(normalizePage(initialPage));
  const [leftCollapsed, setLeftCollapsed] = React.useState(false);
  const [rightCollapsed, setRightCollapsed] = React.useState(false);

  const setActivePage = React.useCallback(
    (page: WorkspacePageKey) => {
      setActivePageState(page);
      onPageChange?.(page);
    },
    [onPageChange],
  );

  return (
    <WorkspaceLayoutContext.Provider
      value={{
        activeProfile,
        activePage,
        leftCollapsed,
        rightCollapsed,
        setActiveProfile,
        setActivePage,
        toggleLeft: () => setLeftCollapsed((v) => !v),
        toggleRight: () => setRightCollapsed((v) => !v),
      }}
    >
      {children}
    </WorkspaceLayoutContext.Provider>
  );
}

export function useWorkspaceLayout(): WorkspaceLayoutState {
  const ctx = React.useContext(WorkspaceLayoutContext);
  if (!ctx) {
    throw new Error("useWorkspaceLayout must be used inside WorkspaceLayoutProvider");
  }
  return ctx;
}

function normalizePage(value: string): WorkspacePageKey {
  const allowed: WorkspacePageKey[] = [
    "chat",
    "sessions",
    "skills",
    "tools",
    "memory",
    "providers",
    "models",
    "settings",
  ];
  return allowed.includes(value as WorkspacePageKey)
    ? (value as WorkspacePageKey)
    : "chat";
}
```

---

## 5.4 workspace-pages.tsx：修复动态 import

不要使用字符串拼接路径。改成静态 registry。

```tsx
import React from "react";
import type { WorkspacePageKey } from "../types";

const ChatPage = React.lazy(() => import("../pages/Chat/Chat"));
const SessionsPage = React.lazy(() => import("../pages/Sessions/Sessions"));
const SkillsPage = React.lazy(() => import("../pages/Skills/Skills"));
const ToolsPage = React.lazy(() => import("../pages/Tools/Tools"));
const MemoryPage = React.lazy(() => import("../pages/Memory/Memory"));
const ProvidersPage = React.lazy(() => import("../pages/Providers/Providers"));
const ModelsPage = React.lazy(() => import("../pages/Models/Models"));
const SettingsPage = React.lazy(() => import("../pages/Settings/Settings"));

export const WORKSPACE_PAGE_REGISTRY: Record<
  WorkspacePageKey,
  React.LazyExoticComponent<() => React.JSX.Element>
> = {
  chat: ChatPage,
  sessions: SessionsPage,
  skills: SkillsPage,
  tools: ToolsPage,
  memory: MemoryPage,
  providers: ProvidersPage,
  models: ModelsPage,
  settings: SettingsPage,
};
```

每个页面必须有 default export：

```tsx
export default function Memory(): React.JSX.Element {
  return <div className="h-full overflow-auto p-4">Memory</div>;
}
```

这样能直接解决截图里的：

```txt
Failed to fetch dynamically imported module ... Memory.tsx
```

---

## 5.5 WorkspaceCenterPage

```tsx
import React from "react";
import { WORKSPACE_PAGE_REGISTRY } from "../registry/workspace-pages";
import { useWorkspaceLayout } from "../context/WorkspaceLayoutContext";
import { WorkspacePageErrorBoundary } from "./WorkspacePageErrorBoundary";

export function WorkspaceCenterPage(): React.JSX.Element {
  const { activePage } = useWorkspaceLayout();
  const Page = WORKSPACE_PAGE_REGISTRY[activePage];

  return (
    <main className="min-h-0 min-w-0 overflow-hidden border-x bg-background">
      <WorkspacePageErrorBoundary resetKey={activePage}>
        <React.Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading {activePage}...
            </div>
          }
        >
          <Page />
        </React.Suspense>
      </WorkspacePageErrorBoundary>
    </main>
  );
}
```

---

# 6. Left Sidebar 规范

左侧只放功能导航，不放 Profile 状态，不放 Not deployed 卡片。

```txt
Left Sidebar
├─ collapse button
├─ chat
├─ sessions
├─ skills
├─ tools
├─ memory
├─ providers
├─ models
└─ settings
```

按钮点击只做一件事：

```ts
setActivePage("memory")
```

不要在 Sidebar 中直接 import 页面，也不要在 Sidebar 中渲染页面。

---

# 7. Status Cards 规范

顶部状态区才显示：

```txt
[Profiles switch] [setting] [Git pull] [Git push]
```

以及 profile runtime 状态：

```txt
default       running
writer        not deployed
research      not deployed
engineer      not deployed
finance       not deployed
sales         not deployed
```

当前 multi profile 方案要求每个 profile 独立端口、独立 Profile Home、独立 SOUL/MEMORY/skills；角色名称不要带端口，端口只作为 runtime 配置。

所以 UI 文案应改成：

```txt
写作生文专家
not deployed
port: 9601
```

不要显示成：

```txt
写作生文专家Not deployed
```

也不要把它做成页面 tab。

---

# 8. Right Panel 规范

右侧 panel 不是主导航，是 Hermes workspace inspector。

建议 tabs：

```txt
Right Panel
├─ Runtime
│  ├─ active profile
│  ├─ gateway status
│  ├─ port
│  └─ start / stop / restart
├─ Workspace
│  ├─ current workspace path
│  ├─ allowed workspace status
│  └─ context files
├─ Logs
│  ├─ gateway logs
│  └─ task events
└─ Context
   ├─ current session
   ├─ selected profile
   └─ injected context
```

HermesLocalService 规划里，Runtime API、Profiles API、Tasks API、Logs API 都应该由本地控制面提供，不应由 Renderer 直接访问 SQLite 或进程句柄。

---

# 9. WorkspaceRenderer 对接方式

`WorkspaceRenderer` 内部遇到 `navigation.workspaces` 或 `aios-workspace` 时，只渲染一个 Workspaces 主入口。

示意：

```tsx
if (module.id === "navigation.workspaces" || module.id === "aios-workspace") {
  return (
    <WorkspaceShell>
      <WorkspacesScreen
        profile={activeProfile}
        activePanel={secondaryPanel}
        onPanelChange={onSecondaryPanelChange}
      />
    </WorkspaceShell>
  );
}
```

如果当前代码仍然使用：

```tsx
<AIOSWorkspaceScreen ... />
```

则让它成为 wrapper：

```tsx
import { WorkspacesScreen } from "../Workspaces/WorkspacesScreen";

export function AIOSWorkspaceScreen(props: AIOSWorkspaceScreenProps) {
  return <WorkspacesScreen {...props} />;
}
```

这样避免 `AIOSWorkspace` 与 `Workspaces` 两套页面分裂。

---

# 10. Cursor 执行稿

直接给 Cursor 的任务可以这样写：

```txt
目标：
修复 ai-os-desktop ver1.6 Workspaces 页面布局。Workspaces 必须保持三栏结构：
顶部 Status Cards；下方 Left Sidebar + Center Main Page + Right Panel。
Left Sidebar 与 Right Panel 均可隐藏 / 显示。
修复 Memory 页面动态 import 失败问题。

禁止：
1. 不改 Electron Main / Preload IPC，除非已有 API 类型不匹配。
2. 不让 Renderer 直接访问 Node、SQLite、Hermes 进程。
3. 不再把 profile status buttons 渲染到普通页面流。
4. 不使用运行时字符串拼接 import 页面路径。
5. 不新增第二套 Workspaces 入口。

修改：
1. 新增或重构：
   - src/renderer/src/screens/Workspaces/WorkspacesScreen.tsx
   - src/renderer/src/screens/Workspaces/layout/WorkspaceThreeColumnLayout.tsx
   - src/renderer/src/screens/Workspaces/context/WorkspaceLayoutContext.tsx
   - src/renderer/src/screens/Workspaces/registry/workspace-pages.tsx
   - src/renderer/src/screens/Workspaces/components/WorkspaceStatusCards.tsx
   - src/renderer/src/screens/Workspaces/components/WorkspaceLeftSidebar.tsx
   - src/renderer/src/screens/Workspaces/components/WorkspaceCenterPage.tsx
   - src/renderer/src/screens/Workspaces/components/WorkspaceRightPanel.tsx
   - src/renderer/src/screens/Workspaces/components/WorkspacePageErrorBoundary.tsx

2. 确保以下页面文件存在，并且都有 default export：
   - pages/Chat/Chat.tsx
   - pages/Sessions/Sessions.tsx
   - pages/Skills/Skills.tsx
   - pages/Tools/Tools.tsx
   - pages/Memory/Memory.tsx
   - pages/Providers/Providers.tsx
   - pages/Models/Models.tsx
   - pages/Settings/Settings.tsx

3. 修改 WorkspaceRenderer：
   - navigation.workspaces / aios-workspace 只进入 WorkspacesScreen
   - 不在 WorkspaceRenderer 中直接渲染子页面

4. 修改 AIOSWorkspaceScreen：
   - 如果当前仍被 WorkspaceRenderer 使用，则作为 WorkspacesScreen wrapper
   - 删除内部重复布局逻辑

5. 修复动态导入：
   - 删除 import(`/src/screens/Workspaces/pages/${page}/${page}.tsx`)
   - 改为 React.lazy 静态 registry

6. 样式要求：
   - Workspaces 根节点：h-full min-h-0 overflow-hidden
   - Status Cards：shrink-0
   - Body：grid min-h-0 flex-1 overflow-hidden
   - Center：min-w-0 min-h-0 overflow-hidden
   - 页面内部滚动，不允许整个 Electron content 乱滚动
```

---

# 11. 验收标准

## 11.1 Layout 验收

```txt
[ ] Workspaces 顶部显示 Status Cards。
[ ] Profile switch / setting / Git pull / Git push 位于顶部 Status Cards 区。
[ ] chat / sessions / skills / tools / memory / providers / models / settings 位于 Left Sidebar。
[ ] 点击 memory 后，Center Main Page 显示 Memory 页面。
[ ] Right Panel 显示 Hermes workspace / runtime / context 信息。
[ ] Left Sidebar 可以折叠 / 展开。
[ ] Right Panel 可以隐藏 / 显示。
[ ] 左右 panel 折叠后 Center Main Page 自动扩展。
```

## 11.2 动态 import 验收

```txt
[ ] 不再出现 Failed to fetch dynamically imported module。
[ ] Memory 页面文件存在。
[ ] Memory 页面 default export 正常。
[ ] 所有 workspace pages 都通过静态 registry 加载。
[ ] 页面加载失败时显示 ErrorBoundary，不导致整个 Workspaces 白屏。
```

## 11.3 工程验收

```bash
npm run typecheck:web
npm run lint
npm run build
npm run dev
```

手动验证：

```txt
1. 打开 navigation.workspaces。
2. 点击 chat / sessions / skills / tools / memory / providers / models / settings。
3. 折叠左侧。
4. 展开左侧。
5. 折叠右侧。
6. 展开右侧。
7. 切换 profile。
8. 点击 Git pull / Git push，未接通时显示 disabled 或明确错误，不影响布局。
```

---

# 12. 最终结论

这次修复的重点不是补一个 `Memory.tsx` 文件，而是把 Workspaces 从“按钮堆叠页面”恢复为稳定的 **三栏工作台 Shell**。

优先级：

```txt
P0：修复 Workspaces 三栏 Shell
P0：修复动态 import 失败
P1：统一 Workspaces / AIOSWorkspace 入口
P1：补齐 Left Sidebar / Right Panel 折叠状态
P2：完善 Status Cards 的 profile runtime 状态
P2：接入 Git pull / push 真实动作
```

按这个方案落地后，Workspaces 才能继续承载后续的 Hermes workspace、多 profile runtime、session、memory、skills、tools、models、providers 和 settings 页面。
