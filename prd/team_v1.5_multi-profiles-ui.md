# team_v1.5：Multi Profiles Workspace UI 实施方案

版本定位：**team_v1.5 / multi_profiles UI 阶段**
前置状态：`team_v1.4` 已完成角色 preset、profile 初始化、SOUL/MEMORY/role-source skills、Gateway Runtime 基础链路。`team_v1.5` 不再重复做角色初始化，而是实现 **多 Profile 的桌面工作区入口与页面功能**。

---

## 1. 当前判断

`team_v1.4` 的交付边界已经明确：从 `agency-agents-zh role source → team_v1.4 preset → SQLite profile runtime → SOUL.md / MEMORY.md / profile-role.json / role-source skills → 多 Hermes Gateway → Desktop / Serve 统一管理`，并要求角色名称不带端口号、端口只保留在 runtime / manifest 中。

`copilot-serve` 当前已经有 `profiles.py`，暴露了 profile 列表、创建、更新、删除、启动、停止、重启、状态、健康、事件接口；`hermes_runs.py` 已按 `profiles/{profile_id}` 维度包装 Hermes `/models`、`/runs`、`/runs/{run_id}`、`/runs/{run_id}/events`。这说明 UI 阶段不应该直接连每个 Hermes Gateway，而应优先通过 `copilot-serve` 统一访问 Profile Runtime。([GitHub][1])

`copilot-desktop` 的 Preload 层已经暴露 AIOS Workspace 的 chat、profiles、sessions、workspaces、skills、memory 等 IPC 能力，包括 `sendMessage`、message chunk/complete/error 监听、profile 启停、session 查询、skills 列表、memory 读写等接口，适合作为 `AIOSWorkspace` 页面层的统一接入面。([GitHub][2])

`hermes-webui` 的核心页面范式是三栏布局：左侧 session/navigation，中间 chat，右侧 workspace file browser；并具备 chat streaming、session 管理、skills、memory、profiles、workspace、settings 等面板能力。其 README 明确列出 Chat、Sessions、Workspace、Profiles、Panels 等能力，可作为本阶段 UI 的功能参考，但不应照搬其 vanilla JS 架构。([GitHub][3])

---

## 2. 实施目标

本阶段目标是在：

```text
copilot-desktop/src/renderer/src/screens/AIOSWorkspace
```

内实现一个多 Profile 工作区页面，覆盖以下能力：

```text
Profile 入口
Session 列表
Chat 窗口
Skills 列表
Memory 面板
Workspace 面板
运行状态 / 日志 / 事件流
```

页面应支持以下 6 个专家入口：

| Profile ID      | 页面显示角色 |   端口 | 页面路由 Key   |
| --------------- | ------ | ---: | ---------- |
| `writer-9601`   | 写作生文专家 | 9601 | `writer`   |
| `research-9602` | 数据研究专家 | 9602 | `research` |
| `engineer-9612` | 智能体专家  | 9612 | `engineer` |
| `hurman-9621`   | 招聘专家   | 9621 | `hurman`   |
| `finance-9631`  | 财经专家   | 9631 | `finance`  |
| `sales-9641`    | 销售专家   | 9641 | `sales`    |

页面标题、角色名称、Card 名称不带端口号。端口只显示在 Runtime Info 区。

---

## 3. UI 总体布局

采用 Hermes WebUI 的三栏思路，但按 Electron + React + Preload API 重构：

```text
AIOSWorkspaceScreen
├─ LeftSidebar
│  ├─ ProfileSwitcher
│  ├─ ProfileStatusCard
│  ├─ SessionSearch
│  └─ SessionList
│
├─ CenterChat
│  ├─ ChatHeader
│  ├─ MessageTimeline
│  ├─ ToolCallCards
│  ├─ ApprovalCard
│  └─ ChatComposer
│
└─ RightInspector
   ├─ Tabs: Workspace / Skills / Memory / Runtime
   ├─ WorkspacePanel
   ├─ SkillsPanel
   ├─ MemoryPanel
   └─ RuntimePanel
```

页面主模板：

```text
左栏：280px
中栏：flex-1，最小 520px
右栏：360px，可折叠
高度：100vh 或当前桌面 workspace 可用高度
```

---

## 4. 文件结构规划

在 `AIOSWorkspace` 内新增或调整：

```text
src/renderer/src/screens/AIOSWorkspace/
├─ AIOSWorkspaceScreen.tsx
├─ AIOSWorkspaceShell.tsx
├─ types.ts
├─ constants.ts
├─ api/
│  └─ aiosWorkspaceApi.ts
├─ hooks/
│  ├─ useActiveProfile.ts
│  ├─ useProfileRuntime.ts
│  ├─ useProfileSessions.ts
│  ├─ useHermesChatStream.ts
│  ├─ useProfileSkills.ts
│  ├─ useProfileMemory.ts
│  └─ useWorkspaceTree.ts
├─ components/
│  ├─ ProfileSwitcher.tsx
│  ├─ ProfileStatusBadge.tsx
│  ├─ ProfileEntryCard.tsx
│  ├─ SessionList.tsx
│  ├─ SessionSearch.tsx
│  ├─ ChatHeader.tsx
│  ├─ MessageTimeline.tsx
│  ├─ MessageBubble.tsx
│  ├─ ToolCallCard.tsx
│  ├─ ApprovalCard.tsx
│  ├─ ChatComposer.tsx
│  └─ RightInspectorTabs.tsx
└─ panels/
   ├─ ChatPanel.tsx
   ├─ SessionsPanel.tsx
   ├─ SkillsPanel.tsx
   ├─ MemoryPanel.tsx
   ├─ WorkspacePanel.tsx
   └─ RuntimePanel.tsx
```

保留既有 `AIOSWorkspace` 页面入口，不新增全局 Provider，不修改全局布局。

---

## 5. API / IPC 接入策略

### 5.1 Desktop 页面只访问 Preload API

Renderer 禁止直接访问 Node、文件系统、child_process。页面统一通过：

```ts
window.aiosWorkspace.*
```

调用。

需要确保 Preload 层具备以下能力：

```ts
profiles:
- listProfiles()
- getProfile(profileId)
- startProfile(profileId)
- stopProfile(profileId)
- restartProfile(profileId)
- getProfileStatus(profileId)
- getProfileEvents(profileId)

chat:
- sendMessage({ profileId, sessionId, message, model, workspace })
- onMessageChunk()
- onMessageComplete()
- onMessageError()
- cancelRun(runId)

sessions:
- listSessions(profileId)
- createSession(profileId)
- renameSession(sessionId)
- deleteSession(sessionId)
- searchSessions(profileId, keyword)

skills:
- listInstalledSkills(profileId)
- readSkill(profileId, skillId)

memory:
- readMemory(profileId, file: "SOUL.md" | "MEMORY.md" | "USER.md")
- writeMemory(profileId, file, content)

workspace:
- listWorkspaces(profileId)
- listWorkspaceFiles(profileId, path)
- readWorkspaceFile(profileId, path)
- writeWorkspaceFile(profileId, path, content)

runtime:
- getGatewayLogs(profileId)
- getRuntimeEvents(profileId)
```

### 5.2 Serve 作为 Runtime API 统一层

`copilot-serve` 继续承担本地服务进程职责：

```text
GET  /api/v1/profiles
POST /api/v1/profiles/{profile_id}/start
POST /api/v1/profiles/{profile_id}/stop
POST /api/v1/profiles/{profile_id}/restart
GET  /api/v1/profiles/{profile_id}/status
GET  /api/v1/profiles/{profile_id}/health
GET  /api/v1/profiles/{profile_id}/events

GET  /api/v1/profiles/{profile_id}/models
POST /api/v1/profiles/{profile_id}/runs
GET  /api/v1/profiles/{profile_id}/runs/{run_id}
GET  /api/v1/profiles/{profile_id}/runs/{run_id}/events
```

Desktop IPC 可以调用 `copilot-serve`，也可以保留部分本地文件能力，但页面层不关心具体来源。

---

## 6. 功能拆分

### 6.1 Profile 入口

实现：

```text
- 顶部 ProfileSwitcher
- 左栏 ProfileEntryCard
- Profile 状态：running / stopped / error / starting
- 端口、pid、health、model、workspace path
- Start / Stop / Restart
```

交互规则：

```text
- 点击 profile 后切换 activeProfileId
- 如果 profile 未启动，ChatComposer 禁用，显示 Start Profile
- 如果 profile running 但 health=false，显示 Restart
- profile 名称显示角色名，不显示端口
- 端口只出现在 RuntimePanel
```

### 6.2 Session 列表

参考 Hermes WebUI 的 session 管理能力，第一阶段实现：

```text
- 按 profile 查询 sessions
- 新建 session
- 选择 session
- 搜索 session
- 删除 session
- 重命名 session
```

第二阶段再补：

```text
- pin / archive
- tag / project group
- import CLI session
- export markdown/json
```

### 6.3 Chat 窗口

第一阶段实现：

```text
- 消息列表
- 用户消息
- assistant streaming
- loading 状态
- error 状态
- retry last message
- cancel running run
- tool call card
```

Streaming 处理：

```text
sendMessage()
  → create run
  → 监听 run events
  → token event 追加 assistant message
  → tool event 渲染 ToolCallCard
  → done event 完成
  → error event 渲染错误消息
```

状态模型：

```ts
type ChatRunState =
  | "idle"
  | "creating"
  | "streaming"
  | "waiting_approval"
  | "completed"
  | "error"
  | "cancelled";
```

### 6.4 Skills 面板

实现：

```text
- 当前 profile skills 列表
- 按 category 分组
- 搜索 skill
- 查看 role-source skills
- 查看 skill markdown 内容
```

第一阶段只读。
第二阶段再补：

```text
- create skill
- edit skill
- delete / archive
- curator 状态
```

Hermes 本身具备 skills、memory、delegation、session_search、terminal、todo 等工具集能力，skills 面板需要从 profile 的实际配置和 role-source skills 中读取，不做前端静态假数据。

### 6.5 Memory 面板

实现：

```text
- SOUL.md 只读预览
- MEMORY.md 可编辑
- USER.md 可编辑
- 保存后写回 profile home
- 显示最后修改时间
```

规则：

```text
- SOUL.md 默认只读，避免 UI 误改角色身份
- MEMORY.md / USER.md 允许编辑
- 保存前做 dirty guard
- 保存后写 audit event
```

### 6.6 Workspace 面板

参考 Hermes WebUI workspace file browser，但本阶段只做安全子集：

```text
- workspace tree
- breadcrumb
- 文件预览：md / txt / json / ts / tsx / py / yaml
- 图片预览
- 文件搜索
- git branch / dirty count 展示
```

第一阶段不做危险写操作。
第二阶段再加：

```text
- 新建文件
- 编辑文件
- 删除文件
- rename
- binary download
```

Hermes WebUI 的 workspace 能力包括目录树、breadcrumb、预览、编辑、创建、删除、重命名、git 状态、右栏可拖拽等，本阶段先实现目录树和预览，避免一次性引入过多文件操作风险。([GitHub][3])

### 6.7 Runtime 面板

实现：

```text
- profile status
- gateway port
- gateway pid
- health
- last error
- logs tail
- profile events
- audit events
```

按钮：

```text
Start
Stop
Restart
Refresh
Open Profile Home
Open Logs
```

---

## 7. 数据模型

```ts
export type AIOSProfile = {
  id: string;
  name: string;
  roleName: string;
  displayName: string;
  description?: string;
  gatewayPort: number;
  status: "running" | "stopped" | "starting" | "error";
  healthy: boolean;
  model?: string;
  workspacePath?: string;
  soulPath?: string;
  memoryPath?: string;
};

export type AIOSSession = {
  id: string;
  profileId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  pinned?: boolean;
  archived?: boolean;
};

export type AIOSMessage = {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  createdAt: string;
  toolCalls?: AIOSSkillToolCall[];
};

export type AIOSSkillToolCall = {
  id: string;
  name: string;
  args?: unknown;
  resultPreview?: string;
  status: "running" | "completed" | "error" | "waiting_approval";
};

export type AIOSSkill = {
  id: string;
  profileId: string;
  name: string;
  category: string;
  sourceType: "role-source" | "agent-created" | "builtin";
  path: string;
  enabled: boolean;
  description?: string;
};

export type AIOSMemoryFile = {
  profileId: string;
  file: "SOUL.md" | "MEMORY.md" | "USER.md";
  content: string;
  readonly: boolean;
  updatedAt?: string;
};
```

---

## 8. 页面路由与状态

建议状态放在 `AIOSWorkspaceShell` 内，不先引入复杂全局 store：

```ts
type AIOSWorkspaceState = {
  activeProfileId: string | null;
  activeSessionId: string | null;
  activeRightTab: "workspace" | "skills" | "memory" | "runtime";
  profiles: AIOSProfile[];
  sessions: AIOSSession[];
  messages: AIOSMessage[];
  runState: ChatRunState;
};
```

持久化：

```text
localStorage:
- aios.workspace.activeProfileId
- aios.workspace.activeRightTab
- aios.workspace.collapsedRightPanel
```

不要把消息正文长期存 localStorage。消息以 Serve / SQLite / Hermes session store 为准。

---

## 9. Cursor 执行稿

### Step 1：确认现有 Preload Contract

检查：

```text
src/preload/index.ts
src/preload/index.d.ts
src/shared/workspace/workspace-contract.ts
```

补齐缺口：

```text
- profile events
- gateway logs
- skill read
- memory write
- workspace file tree/read
```

### Step 2：创建 AIOSWorkspace API Adapter

新增：

```text
src/renderer/src/screens/AIOSWorkspace/api/aiosWorkspaceApi.ts
```

只封装 `window.aiosWorkspace`，不要在组件里散落 IPC 调用。

### Step 3：创建 hooks

新增：

```text
useActiveProfile.ts
useProfileRuntime.ts
useProfileSessions.ts
useHermesChatStream.ts
useProfileSkills.ts
useProfileMemory.ts
useWorkspaceTree.ts
```

规则：

```text
- hook 负责 loading/error/refetch
- component 只负责渲染
- chat streaming 单独 hook 管理事件注册与清理
```

### Step 4：重构页面 Shell

新增或改造：

```text
AIOSWorkspaceScreen.tsx
AIOSWorkspaceShell.tsx
```

页面骨架：

```tsx
export function AIOSWorkspaceScreen() {
  return <AIOSWorkspaceShell />;
}
```

Shell 内组织三栏。

### Step 5：实现 LeftSidebar

文件：

```text
components/ProfileSwitcher.tsx
components/ProfileStatusBadge.tsx
components/SessionSearch.tsx
components/SessionList.tsx
```

验收：

```text
- 能列出 6 个专家 Profile
- 能切换 Profile
- 能显示 running/stopped/error
- 能查询当前 Profile sessions
```

### Step 6：实现 ChatPanel

文件：

```text
panels/ChatPanel.tsx
components/MessageTimeline.tsx
components/MessageBubble.tsx
components/ToolCallCard.tsx
components/ApprovalCard.tsx
components/ChatComposer.tsx
```

验收：

```text
- 能发送消息到 active profile
- 能创建/选择 session
- 能展示 streaming token
- 能展示 done/error
- 切换 profile 时不串 session
```

### Step 7：实现 RightInspector

文件：

```text
components/RightInspectorTabs.tsx
panels/WorkspacePanel.tsx
panels/SkillsPanel.tsx
panels/MemoryPanel.tsx
panels/RuntimePanel.tsx
```

验收：

```text
- Workspace 能展示文件树和预览
- Skills 能展示 role-source skills
- Memory 能查看 SOUL.md / MEMORY.md / USER.md
- Runtime 能展示 port / pid / health / logs / events
```

### Step 8：联调 copilot-serve

重点验证：

```text
GET /api/v1/profiles
POST /api/v1/profiles/{profile_id}/start
GET /api/v1/profiles/{profile_id}/status
POST /api/v1/profiles/{profile_id}/runs
GET /api/v1/profiles/{profile_id}/runs/{run_id}/events
GET /api/v1/profiles/{profile_id}/events
GET /api/v1/gateways/{gateway_id}/logs
```

---

## 10. 验收标准

### 10.1 Profile Workspace

```text
[ ] AIOSWorkspace 页面显示 6 个专家入口。
[ ] 页面显示角色名称，不把端口拼到角色名。
[ ] 端口只在 RuntimePanel 展示。
[ ] 切换 profile 后 session/chat/skills/memory/workspace 均随 profile 切换。
[ ] 未启动 profile 时，ChatComposer 禁用并提示 Start Profile。
```

### 10.2 Chat

```text
[ ] writer / engineer / research 至少 3 个 profile 可独立发送消息。
[ ] 不同 profile 的 session 不串数据。
[ ] streaming token 能连续展示。
[ ] run error 能显示错误卡片。
[ ] cancel 能终止当前 run。
```

### 10.3 Sessions

```text
[ ] 能创建 session。
[ ] 能选择 session。
[ ] 能搜索 session。
[ ] 能重命名 session。
[ ] 能删除 session。
```

### 10.4 Skills

```text
[ ] 能展示当前 profile 的 role-source skills。
[ ] 能按 category 分组。
[ ] 能搜索 skill。
[ ] 能预览 skill markdown。
```

### 10.5 Memory

```text
[ ] 能查看 SOUL.md。
[ ] SOUL.md 默认只读。
[ ] 能查看/编辑 MEMORY.md。
[ ] 能查看/编辑 USER.md。
[ ] 保存后刷新仍能读取新内容。
```

### 10.6 Workspace

```text
[ ] 能列出 workspace 根目录。
[ ] 能展开目录。
[ ] 能预览 markdown/text/code/json/yaml。
[ ] 能显示 git branch / dirty count。
[ ] 无 workspace 时显示空状态，不报错。
```

### 10.7 Runtime

```text
[ ] 能 Start / Stop / Restart profile。
[ ] 能查看 health。
[ ] 能查看 gateway logs。
[ ] 能查看 profile events。
[ ] 单个 profile error 不影响其它 profile 页面。
```

---

## 11. 不做项

本阶段不做：

```text
- 不重写 team_v1.4 初始化链路
- 不新增全局 CopilotKit Provider
- 不直接在 Renderer 访问文件系统
- 不让页面直连 9601/9602/9612/9621/9631/9641
- 不做 workspace 文件删除/重命名等高风险操作
- 不做跨 profile 自动委派 UI
- 不做移动端适配
```

---

## 12. 最终交付边界

`team_v1.5` 完成后，用户在 `AIOSWorkspace` 内可以：

```text
进入任一专家 Profile
查看该 Profile 的运行状态
管理该 Profile 的 session
与该 Profile 对话
查看 skills
查看/编辑 memory
浏览 workspace
查看 runtime logs/events
```

核心判断：**copilot-desktop 负责可视化工作区，copilot-serve 负责 Profile Runtime 和 Hermes Gateway 代理，Hermes Profile 继续保持独立端口、独立角色、独立记忆。**

[1]: https://raw.githubusercontent.com/loudon84/ai-os-serve/master/src/api/v1/profiles.py "raw.githubusercontent.com"
[2]: https://github.com/loudon84/ai-os-desktop/blob/main/src/preload/index.ts "ai-os-desktop/src/preload/index.ts at main · loudon84/ai-os-desktop · GitHub"
[3]: https://github.com/nesquena/hermes-webui "GitHub - nesquena/hermes-webui: Hermes WebUI: The best way to use Hermes Agent from the web or from your phone! · GitHub"
