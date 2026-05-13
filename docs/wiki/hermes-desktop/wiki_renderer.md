# Hermes Desktop — Renderer 页面与 `hermesAPI`（IPC）连接说明

> **定位**：说明 `hermes-desktop/src/renderer` 内**无路由表**的 SPA 如何切换页面，以及各 Screen 如何调用 `window.hermesAPI`（与 Main 侧 channel 对应关系见 `docs/prd/hermes/wiki_channel.md`）。  
> **关联**：总览 `docs/prd/hermes/wiki_spec.md`；preload 真源 `hermes-desktop/src/preload/index.ts`。

---

## 1. 入口与主壳

| 文件 | 作用 |
|------|------|
| `src/renderer/src/main.tsx` | `createRoot` 挂载 `App`，外包 `I18nProvider` |
| `src/renderer/src/App.tsx` | 启动**状态机**：`splash → welcome → installing → setup → main`；`main` 时渲染 `Layout` |
| `src/renderer/src/screens/Layout/Layout.tsx` | 主工作台：侧栏 `view` 切换、全局 `activeProfile`、Chat 消息与会话恢复、自动更新与菜单 IPC |

**与 Main 的唯一桥梁**：Preload 注入的 **`window.hermesAPI`**（类型 `src/preload/index.d.ts`）。Renderer **禁止**直接使用 Node；所有能力通过该方法对象 → `ipcRenderer.invoke` / `ipcRenderer.on`。

---

## 2. 路由模型：本地状态，非 React Router

- **无** `react-router` 式 URL 路由。
- `App` 用 `screen` 决定大阶段（安装引导 vs 主界面）。
- `Layout` 用 `view: View` 联合类型（如 `"chat" | "sessions" | "gateway" | …`）+ 侧栏 `NAV_ITEMS` 点击 `setView(v)`。
- `<main>` 内通过 **`display: none` / 条件渲染** 挂载对应 Screen（Chat 常挂但隐藏，以保证状态；Office 首次进入后才 `officeVisited` 挂载）。

---

## 3. `Layout` 已直接使用的 IPC（跨页）

在进入各子页之前，`Layout` 已调用/订阅例如：

| 用途 | `hermesAPI` |
|------|-------------|
| 纯远程-only 模式（限制部分屏） | `isRemoteOnlyMode()`（随 `view` 变化重查） |
| 自动更新 | `onUpdateAvailable`、`onUpdateDownloadProgress`、`onUpdateDownloaded`；`downloadUpdate`、`installUpdate` |
| 系统菜单 | `onMenuNewChat`、`onMenuSearchSessions` |
| 新对话 | `abortChat` |
| 从 Sessions 恢复 | `getSessionMessages(sessionId)` |

---

## 4. `view` 与组件、远程限制

| `view` | 组件路径（示意） | 传入 `profile` | `isRemoteOnlyMode` 时 |
|--------|------------------|----------------|------------------------|
| `chat` | `screens/Chat/Chat` | 有 | 始终真实页面 |
| `sessions` | `screens/Sessions/Sessions` | — | `RemoteNotice` |
| `agents` | `screens/Agents/Agents` | 有 | `RemoteNotice` |
| `office` | `screens/Office/Office` | — | 无单独 remote 分支（懒挂载） |
| `models` | `screens/Models/Models` | — | 始终真实页面 |
| `providers` | `screens/Providers/Providers` | 有 | `RemoteNotice` |
| `skills` | `screens/Skills/Skills` | 有 | `RemoteNotice` |
| `soul` / `memory` | 对应 Screen | 有 | `RemoteNotice` |
| `tools` | `screens/Tools/Tools` | 有 | `RemoteNotice` |
| `schedules` | `screens/Schedules/Schedules` | 有 | **未**做 remote 分支，始终真实页面 |
| `gateway` | `screens/Gateway/Gateway` | 有 | `RemoteNotice` |
| `settings` | `screens/Settings/Settings` | 有 | 始终真实页面（`display` 切换） |

> **注意**：远程 **SSH** 隧道模式与「纯 HTTP remote-only」在 `App.tsx` 启动逻辑中区分；侧栏屏蔽以 `isRemoteOnlyMode` 为准，与 `wiki_spec` 中「remote / ssh」叙述一致。

---

## 5. 各目标 Screen ↔ `hermesAPI`（按功能）

### 5.1 Chat（`screens/Chat/Chat.tsx`）

**对话主路径**

- **发送**：`sendMessage(message, profile, resumeSessionId?, history?)` → IPC `send-message`（详见 `wiki_channel`）。
- **订阅**（`useEffect` 注册，卸载时执行返回的 cleanup）：  
  `onChatChunk`、`onChatDone`、`onChatError`、`onChatToolProgress`、`onChatUsage`  
  → 对应 `chat-chunk`、`chat-done`、`chat-error`、`chat-tool-progress`、`chat-usage`。

**模型与配置**

- `getModelConfig`、`listModels`、`setModelConfig`
- `getConfig` / `setConfig`（例如 `agent.service_tier` 快模式）

**本地斜杠命令**（不经过 `send-message`，但仍可能 IPC 读状态）

- 示例：`readMemory`、`getToolsets`、`listInstalledSkills`、`readSoul`、`getHermesVersion`、`getAppVersion` 等（见源码 `executeLocalCommand`）。

### 5.2 Gateway（`screens/Gateway/Gateway.tsx`）

- **读**：`getEnv(profile)`、`gatewayStatus()`、`getPlatformEnabled(profile)`；定时轮询 `gatewayStatus`。
- **写**：`startGateway` / `stopGateway`；`setPlatformEnabled`；输入失焦 `setEnv`。

### 5.3 Agents（`screens/Agents/Agents.tsx`）

- `listProfiles`、`createProfile`、`deleteProfile`、`setActiveProfile`

### 5.4 Models（`screens/Models/Models.tsx`）

- `listModels`、`addModel`、`updateModel`、`removeModel`；自定义 provider 时可 `setEnv(envKey, apiKey)`

### 5.5 Providers（`screens/Providers/Providers.tsx`）

- `getEnv` / `setEnv`（`profile`）
- `getModelConfig` / `setModelConfig`（防抖自动保存；`visible` 时再拉一次 `getModelConfig`）
- `getCredentialPool` / `setCredentialPool`；条件满足时 `addModel`

### 5.6 Schedules（`screens/Schedules/Schedules.tsx`）

- `listCronJobs(true, profile)`
- `createCronJob`、`removeCronJob`、`pauseCronJob`、`resumeCronJob`、`triggerCronJob`

### 5.7 Skills（`screens/Skills/Skills.tsx`）

- `listInstalledSkills(profile)`、`listBundledSkills`
- `getSkillContent(skillPath)`
- `installSkill`、`uninstallSkill`

### 5.8 Tools（`screens/Tools/Tools.tsx`）

- `getToolsets(profile)`、`setToolsetEnabled`
- `listMcpServers(profile)`

---

## 6. 启动阶段（`App.tsx`）与页面并列

在进入 `Layout` 之前，`App` 已使用例如：

- `getConnectionConfig`、`startSshTunnel`、`testRemoteConnection`
- `checkInstall`、`verifyInstall`

用于决定落在 `welcome` / `setup` / `main`。与各业务 Screen **共用同一套 `hermesAPI`**，仅时机不同。

---

## 7. Portal / WebView 嵌入时的对齐点

- Renderer **不注册** channel：channel 只在 **preload + Main** 定义；页面只依赖 **`window.hermesAPI` 方法名**。
- **Chat** 除 `sendMessage` 外，**必须**实现与 `onChatChunk` 等推送等价的流式回调，否则 UI 无法拼流式回复。
- 若在浏览器环境嵌入 Portal：需 **注入同名 `hermesAPI`** 或 **薄桥接层** 映射到同一批 IPC（见 `wiki_spec` 桥接策略）。

---

## 8. 源码索引（按需打开）

| 路径 |
|------|
| `hermes-desktop/src/renderer/src/main.tsx` |
| `hermes-desktop/src/renderer/src/App.tsx` |
| `hermes-desktop/src/renderer/src/screens/Layout/Layout.tsx` |
| `hermes-desktop/src/renderer/src/screens/Chat/Chat.tsx` |
| `hermes-desktop/src/renderer/src/screens/Gateway/Gateway.tsx` |
| `hermes-desktop/src/renderer/src/screens/Agents/Agents.tsx` |
| `hermes-desktop/src/renderer/src/screens/Models/Models.tsx` |
| `hermes-desktop/src/renderer/src/screens/Providers/Providers.tsx` |
| `hermes-desktop/src/renderer/src/screens/Schedules/Schedules.tsx` |
| `hermes-desktop/src/renderer/src/screens/Skills/Skills.tsx` |
| `hermes-desktop/src/renderer/src/screens/Tools/Tools.tsx` |

---

## 9. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-05-12 | 初版：Renderer 导航模型、Layout 与各 Screen 的 `hermesAPI` 映射及远程限制。 |
