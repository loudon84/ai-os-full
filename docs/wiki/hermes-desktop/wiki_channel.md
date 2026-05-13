# Hermes Desktop — `hermesAPI` 与 IPC 通道索引

> **来源**：由本仓库内 `hermes-desktop/src/preload/index.ts` 抽取（与 Main 侧 `ipcMain.handle` / `webContents.send` 对应）。  
> **真源**：若 upstream 变更，以该文件为准重新核对。  
> **关联总览**：`docs/prd/hermes/wiki_spec.md`。

---

## 约定

| 类型 | 含义 |
|------|------|
| **invoke** | Renderer `ipcRenderer.invoke(channel, …)` ↔ Main `ipcMain.handle(channel, …)`；通过 `hermesAPI.<camelCase>()` 封装 |
| **on / push** | Main → Renderer 单向推送；通过 `hermesAPI.onXxx(callback)` 订阅，返回 `() => void` 取消订阅 |

---

## 附录 A：全量 invoke 通道（`ipcMain.handle`）

### A.1 安装与引擎信息

| `hermesAPI` | IPC channel | 参数 | 返回（摘要） |
|-------------|-------------|------|----------------|
| `checkInstall` | `check-install` | — | `{ installed, configured, hasApiKey }` |
| `verifyInstall` | `verify-install` | — | `boolean` |
| `startInstall` | `start-install` | — | `{ success, error? }` |
| `getHermesVersion` | `get-hermes-version` | — | `string \| null` |
| `refreshHermesVersion` | `refresh-hermes-version` | — | `string \| null` |
| `runHermesDoctor` | `run-hermes-doctor` | — | `string` |
| `runHermesUpdate` | `run-hermes-update` | — | `{ success, error? }` |

### A.2 OpenClaw 迁移

| `hermesAPI` | IPC channel | 参数 | 返回（摘要） |
|-------------|-------------|------|----------------|
| `checkOpenClaw` | `check-openclaw` | — | `{ found, path }` |
| `runClawMigrate` | `run-claw-migrate` | — | `{ success, error? }` |

### A.3 区域设置

| `hermesAPI` | IPC channel | 参数 | 返回（摘要） |
|-------------|-------------|------|----------------|
| `getLocale` | `get-locale` | — | `AppLocale` |
| `setLocale` | `set-locale` | `locale` | `AppLocale` |

### A.4 配置（profile 可选）

| `hermesAPI` | IPC channel | 参数 | 返回（摘要） |
|-------------|-------------|------|----------------|
| `getEnv` | `get-env` | `profile?` | `Record<string, string>` |
| `setEnv` | `set-env` | `key, value, profile?` | `boolean` |
| `getConfig` | `get-config` | `key, profile?` | `string \| null` |
| `setConfig` | `set-config` | `key, value, profile?` | `boolean` |
| `getHermesHome` | `get-hermes-home` | `profile?` | `string` |
| `getModelConfig` | `get-model-config` | `profile?` | `{ provider, model, baseUrl }` |
| `setModelConfig` | `set-model-config` | `provider, model, baseUrl, profile?` | `boolean` |

### A.5 连接模式（local / remote / ssh）

| `hermesAPI` | IPC channel | 参数 | 返回（摘要） |
|-------------|-------------|------|----------------|
| `isRemoteMode` | `is-remote-mode` | — | `boolean` |
| `isRemoteOnlyMode` | `is-remote-only-mode` | — | `boolean` |
| `getConnectionConfig` | `get-connection-config` | — | `mode, remoteUrl, apiKey, ssh{…}` |
| `setConnectionConfig` | `set-connection-config` | `mode, remoteUrl, apiKey?` | `boolean` |
| `setSshConfig` | `set-ssh-config` | `host, port, username, keyPath, remotePort, localPort` | `boolean` |
| `testRemoteConnection` | `test-remote-connection` | `url, apiKey?` | `boolean` |
| `testSshConnection` | `test-ssh-connection` | `host, port, username, keyPath, remotePort` | `boolean` |
| `isSshTunnelActive` | `is-ssh-tunnel-active` | — | `boolean` |
| `startSshTunnel` | `start-ssh-tunnel` | — | `boolean` |
| `stopSshTunnel` | `stop-ssh-tunnel` | — | `boolean` |

### A.6 对话与 Gateway

| `hermesAPI` | IPC channel | 参数 | 返回（摘要） |
|-------------|-------------|------|----------------|
| `sendMessage` | `send-message` | `message, profile?, resumeSessionId?, history?` | `{ response, sessionId? }`（流式见附录 B） |
| `abortChat` | `abort-chat` | — | `void` |
| `startGateway` | `start-gateway` | — | `boolean` |
| `stopGateway` | `stop-gateway` | — | `boolean` |
| `gatewayStatus` | `gateway-status` | — | `boolean` |

### A.7 平台开关

| `hermesAPI` | IPC channel | 参数 | 返回（摘要） |
|-------------|-------------|------|----------------|
| `getPlatformEnabled` | `get-platform-enabled` | `profile?` | `Record<string, boolean>` |
| `setPlatformEnabled` | `set-platform-enabled` | `platform, enabled, profile?` | `boolean` |

### A.8 会话与 Profile

| `hermesAPI` | IPC channel | 参数 | 返回（摘要） |
|-------------|-------------|------|----------------|
| `listSessions` | `list-sessions` | `limit?, offset?` | 会话摘要数组 |
| `getSessionMessages` | `get-session-messages` | `sessionId` | `{ id, role, content, timestamp }[]` |
| `listProfiles` | `list-profiles` | — | profile 元数据数组 |
| `createProfile` | `create-profile` | `name, clone` | `{ success, error? }` |
| `deleteProfile` | `delete-profile` | `name` | `{ success, error? }` |
| `setActiveProfile` | `set-active-profile` | `name` | `boolean` |

### A.9 Memory / Soul / Tools / Skills

| `hermesAPI` | IPC channel | 参数 | 返回（摘要） |
|-------------|-------------|------|----------------|
| `readMemory` | `read-memory` | `profile?` | `memory, user, stats` |
| `addMemoryEntry` | `add-memory-entry` | `content, profile?` | `{ success, error? }` |
| `updateMemoryEntry` | `update-memory-entry` | `index, content, profile?` | `{ success, error? }` |
| `removeMemoryEntry` | `remove-memory-entry` | `index, profile?` | `boolean` |
| `writeUserProfile` | `write-user-profile` | `content, profile?` | `{ success, error? }` |
| `readSoul` | `read-soul` | `profile?` | `string` |
| `writeSoul` | `write-soul` | `content, profile?` | `boolean` |
| `resetSoul` | `reset-soul` | `profile?` | `string` |
| `getToolsets` | `get-toolsets` | `profile?` | `{ key, label, description, enabled }[]` |
| `setToolsetEnabled` | `set-toolset-enabled` | `key, enabled, profile?` | `boolean` |
| `listInstalledSkills` | `list-installed-skills` | `profile?` | 技能元数据数组 |
| `listBundledSkills` | `list-bundled-skills` | — | 捆绑技能数组 |
| `getSkillContent` | `get-skill-content` | `skillPath` | `string` |
| `installSkill` | `install-skill` | `identifier, profile?` | `{ success, error? }` |
| `uninstallSkill` | `uninstall-skill` | `name, profile?` | `{ success, error? }` |

### A.10 会话缓存与搜索

| `hermesAPI` | IPC channel | 参数 | 返回（摘要） |
|-------------|-------------|------|----------------|
| `listCachedSessions` | `list-cached-sessions` | `limit?, offset?` | 缓存会话数组 |
| `syncSessionCache` | `sync-session-cache` | — | 缓存会话数组 |
| `updateSessionTitle` | `update-session-title` | `sessionId, title` | `void` |
| `searchSessions` | `search-sessions` | `query, limit?` | 搜索结果数组 |

### A.11 凭证池与模型库

| `hermesAPI` | IPC channel | 参数 | 返回（摘要） |
|-------------|-------------|------|----------------|
| `getCredentialPool` | `get-credential-pool` | — | `Record<string, { key, label }[]>` |
| `setCredentialPool` | `set-credential-pool` | `provider, entries` | `boolean` |
| `listModels` | `list-models` | — | 模型条目数组 |
| `addModel` | `add-model` | `name, provider, model, baseUrl` | 模型条目 |
| `removeModel` | `remove-model` | `id` | `boolean` |
| `updateModel` | `update-model` | `id, fields` | `boolean` |

### A.12 Claw3D

| `hermesAPI` | IPC channel | 参数 | 返回（摘要） |
|-------------|-------------|------|----------------|
| `claw3dStatus` | `claw3d-status` | — | 状态对象 |
| `claw3dSetup` | `claw3d-setup` | — | `{ success, error? }` |
| `claw3dGetPort` | `claw3d-get-port` | — | `number` |
| `claw3dSetPort` | `claw3d-set-port` | `port` | `boolean` |
| `claw3dGetWsUrl` | `claw3d-get-ws-url` | — | `string` |
| `claw3dSetWsUrl` | `claw3d-set-ws-url` | `url` | `boolean` |
| `claw3dStartAll` | `claw3d-start-all` | — | `{ success, error? }` |
| `claw3dStopAll` | `claw3d-stop-all` | — | `boolean` |
| `claw3dGetLogs` | `claw3d-get-logs` | — | `string` |
| `claw3dStartDev` | `claw3d-start-dev` | — | `boolean` |
| `claw3dStopDev` | `claw3d-stop-dev` | — | `boolean` |
| `claw3dStartAdapter` | `claw3d-start-adapter` | — | `boolean` |
| `claw3dStopAdapter` | `claw3d-stop-adapter` | — | `boolean` |

### A.13 应用更新

| `hermesAPI` | IPC channel | 参数 | 返回（摘要） |
|-------------|-------------|------|----------------|
| `checkForUpdates` | `check-for-updates` | — | `string \| null` |
| `downloadUpdate` | `download-update` | — | `boolean` |
| `installUpdate` | `install-update` | — | `void` |
| `getAppVersion` | `get-app-version` | — | `string` |

### A.14 定时任务（Cron）

| `hermesAPI` | IPC channel | 参数 | 返回（摘要） |
|-------------|-------------|------|----------------|
| `listCronJobs` | `list-cron-jobs` | `includeDisabled?, profile?` | 任务数组 |
| `createCronJob` | `create-cron-job` | `schedule, prompt?, name?, deliver?, profile?` | `{ success, error? }` |
| `removeCronJob` | `remove-cron-job` | `jobId, profile?` | `{ success, error? }` |
| `pauseCronJob` | `pause-cron-job` | `jobId, profile?` | `{ success, error? }` |
| `resumeCronJob` | `resume-cron-job` | `jobId, profile?` | `{ success, error? }` |
| `triggerCronJob` | `trigger-cron-job` | `jobId, profile?` | `{ success, error? }` |

### A.15 Shell / 备份 / 调试 / 发现 / 日志

| `hermesAPI` | IPC channel | 参数 | 返回（摘要） |
|-------------|-------------|------|----------------|
| `openExternal` | `open-external` | `url` | `void` |
| `runHermesBackup` | `run-hermes-backup` | `profile?` | `{ success, path?, error? }` |
| `runHermesImport` | `run-hermes-import` | `archivePath, profile?` | `{ success, error? }` |
| `runHermesDump` | `run-hermes-dump` | — | `string` |
| `discoverMemoryProviders` | `discover-memory-providers` | `profile?` | provider 数组 |
| `listMcpServers` | `list-mcp-servers` | `profile?` | MCP 条目数组 |
| `readLogs` | `read-logs` | `logFile?, lines?` | `{ content, path }` |

---

## 附录 B：Main → Renderer 推送通道（订阅）

| 事件 channel | `hermesAPI` 订阅方法 | 回调载荷（摘要） |
|--------------|---------------------|------------------|
| `install-progress` | `onInstallProgress` | `{ step, totalSteps, title, detail, log }` |
| `chat-chunk` | `onChatChunk` | `string` |
| `chat-done` | `onChatDone` | `sessionId?` |
| `chat-tool-progress` | `onChatToolProgress` | `string` |
| `chat-usage` | `onChatUsage` | `{ promptTokens, completionTokens, totalTokens, cost?, … }` |
| `chat-error` | `onChatError` | `string` |
| `claw3d-setup-progress` | `onClaw3dSetupProgress` | `{ step, totalSteps, title, detail, log }` |
| `update-available` | `onUpdateAvailable` | `{ version, releaseNotes }` |
| `update-download-progress` | `onUpdateDownloadProgress` | `{ percent }` |
| `update-downloaded` | `onUpdateDownloaded` | —（无参） |
| `menu-new-chat` | `onMenuNewChat` | —（无参） |
| `menu-search-sessions` | `onMenuSearchSessions` | —（无参） |

---

## 附录 C：统计

| 类别 | 数量 |
|------|------|
| **invoke 通道** | 96 |
| **推送事件 channel** | 12 |
| **扁平总表** | 见下方 **附录 D**（invoke + 订阅共 108 行，按 channel 排序） |

---

## 附录 D：全量 IPC 扁平总表（按 channel 排序）

> 由 `scripts/gen-hermes-preload-ipc-table.mjs` 从 `hermes-desktop/src/preload/index.ts` 解析生成；upstream 变更后重跑：`node scripts/gen-hermes-preload-ipc-table.mjs`，将输出替换本附录。

| # | 类型 | IPC channel | `hermesAPI` |
|---|------|-------------|-------------|
| 1 | invoke | `abort-chat` | `abortChat` |
| 2 | invoke | `add-memory-entry` | `addMemoryEntry` |
| 3 | invoke | `add-model` | `addModel` |
| 4 | invoke | `check-for-updates` | `checkForUpdates` |
| 5 | invoke | `check-install` | `checkInstall` |
| 6 | invoke | `check-openclaw` | `checkOpenClaw` |
| 7 | invoke | `claw3d-get-logs` | `claw3dGetLogs` |
| 8 | invoke | `claw3d-get-port` | `claw3dGetPort` |
| 9 | invoke | `claw3d-get-ws-url` | `claw3dGetWsUrl` |
| 10 | invoke | `claw3d-set-port` | `claw3dSetPort` |
| 11 | invoke | `claw3d-set-ws-url` | `claw3dSetWsUrl` |
| 12 | invoke | `claw3d-setup` | `claw3dSetup` |
| 13 | invoke | `claw3d-start-adapter` | `claw3dStartAdapter` |
| 14 | invoke | `claw3d-start-all` | `claw3dStartAll` |
| 15 | invoke | `claw3d-start-dev` | `claw3dStartDev` |
| 16 | invoke | `claw3d-status` | `claw3dStatus` |
| 17 | invoke | `claw3d-stop-adapter` | `claw3dStopAdapter` |
| 18 | invoke | `claw3d-stop-all` | `claw3dStopAll` |
| 19 | invoke | `claw3d-stop-dev` | `claw3dStopDev` |
| 20 | invoke | `create-cron-job` | `createCronJob` |
| 21 | invoke | `create-profile` | `createProfile` |
| 22 | invoke | `delete-profile` | `deleteProfile` |
| 23 | invoke | `discover-memory-providers` | `discoverMemoryProviders` |
| 24 | invoke | `download-update` | `downloadUpdate` |
| 25 | invoke | `gateway-status` | `gatewayStatus` |
| 26 | invoke | `get-app-version` | `getAppVersion` |
| 27 | invoke | `get-config` | `getConfig` |
| 28 | invoke | `get-connection-config` | `getConnectionConfig` |
| 29 | invoke | `get-credential-pool` | `getCredentialPool` |
| 30 | invoke | `get-env` | `getEnv` |
| 31 | invoke | `get-hermes-home` | `getHermesHome` |
| 32 | invoke | `get-hermes-version` | `getHermesVersion` |
| 33 | invoke | `get-locale` | `getLocale` |
| 34 | invoke | `get-model-config` | `getModelConfig` |
| 35 | invoke | `get-platform-enabled` | `getPlatformEnabled` |
| 36 | invoke | `get-session-messages` | `getSessionMessages` |
| 37 | invoke | `get-skill-content` | `getSkillContent` |
| 38 | invoke | `get-toolsets` | `getToolsets` |
| 39 | invoke | `install-skill` | `installSkill` |
| 40 | invoke | `install-update` | `installUpdate` |
| 41 | invoke | `is-remote-mode` | `isRemoteMode` |
| 42 | invoke | `is-remote-only-mode` | `isRemoteOnlyMode` |
| 43 | invoke | `is-ssh-tunnel-active` | `isSshTunnelActive` |
| 44 | invoke | `list-bundled-skills` | `listBundledSkills` |
| 45 | invoke | `list-cached-sessions` | `listCachedSessions` |
| 46 | invoke | `list-cron-jobs` | `listCronJobs` |
| 47 | invoke | `list-installed-skills` | `listInstalledSkills` |
| 48 | invoke | `list-mcp-servers` | `listMcpServers` |
| 49 | invoke | `list-models` | `listModels` |
| 50 | invoke | `list-profiles` | `listProfiles` |
| 51 | invoke | `list-sessions` | `listSessions` |
| 52 | invoke | `open-external` | `openExternal` |
| 53 | invoke | `pause-cron-job` | `pauseCronJob` |
| 54 | invoke | `read-logs` | `readLogs` |
| 55 | invoke | `read-memory` | `readMemory` |
| 56 | invoke | `read-soul` | `readSoul` |
| 57 | invoke | `refresh-hermes-version` | `refreshHermesVersion` |
| 58 | invoke | `remove-cron-job` | `removeCronJob` |
| 59 | invoke | `remove-memory-entry` | `removeMemoryEntry` |
| 60 | invoke | `remove-model` | `removeModel` |
| 61 | invoke | `reset-soul` | `resetSoul` |
| 62 | invoke | `resume-cron-job` | `resumeCronJob` |
| 63 | invoke | `run-claw-migrate` | `runClawMigrate` |
| 64 | invoke | `run-hermes-backup` | `runHermesBackup` |
| 65 | invoke | `run-hermes-doctor` | `runHermesDoctor` |
| 66 | invoke | `run-hermes-dump` | `runHermesDump` |
| 67 | invoke | `run-hermes-import` | `runHermesImport` |
| 68 | invoke | `run-hermes-update` | `runHermesUpdate` |
| 69 | invoke | `search-sessions` | `searchSessions` |
| 70 | invoke | `send-message` | `sendMessage` |
| 71 | invoke | `set-active-profile` | `setActiveProfile` |
| 72 | invoke | `set-config` | `setConfig` |
| 73 | invoke | `set-connection-config` | `setConnectionConfig` |
| 74 | invoke | `set-credential-pool` | `setCredentialPool` |
| 75 | invoke | `set-env` | `setEnv` |
| 76 | invoke | `set-locale` | `setLocale` |
| 77 | invoke | `set-model-config` | `setModelConfig` |
| 78 | invoke | `set-platform-enabled` | `setPlatformEnabled` |
| 79 | invoke | `set-ssh-config` | `setSshConfig` |
| 80 | invoke | `set-toolset-enabled` | `setToolsetEnabled` |
| 81 | invoke | `start-gateway` | `startGateway` |
| 82 | invoke | `start-install` | `startInstall` |
| 83 | invoke | `start-ssh-tunnel` | `startSshTunnel` |
| 84 | invoke | `stop-gateway` | `stopGateway` |
| 85 | invoke | `stop-ssh-tunnel` | `stopSshTunnel` |
| 86 | invoke | `sync-session-cache` | `syncSessionCache` |
| 87 | invoke | `test-remote-connection` | `testRemoteConnection` |
| 88 | invoke | `test-ssh-connection` | `testSshConnection` |
| 89 | invoke | `trigger-cron-job` | `triggerCronJob` |
| 90 | invoke | `uninstall-skill` | `uninstallSkill` |
| 91 | invoke | `update-memory-entry` | `updateMemoryEntry` |
| 92 | invoke | `update-model` | `updateModel` |
| 93 | invoke | `update-session-title` | `updateSessionTitle` |
| 94 | invoke | `verify-install` | `verifyInstall` |
| 95 | invoke | `write-soul` | `writeSoul` |
| 96 | invoke | `write-user-profile` | `writeUserProfile` |
| 97 | on（订阅） | `chat-chunk` | `onChatChunk` |
| 98 | on（订阅） | `chat-done` | `onChatDone` |
| 99 | on（订阅） | `chat-error` | `onChatError` |
| 100 | on（订阅） | `chat-tool-progress` | `onChatToolProgress` |
| 101 | on（订阅） | `chat-usage` | `onChatUsage` |
| 102 | on（订阅） | `claw3d-setup-progress` | `onClaw3dSetupProgress` |
| 103 | on（订阅） | `install-progress` | `onInstallProgress` |
| 104 | on（订阅） | `menu-new-chat` | `onMenuNewChat` |
| 105 | on（订阅） | `menu-search-sessions` | `onMenuSearchSessions` |
| 106 | on（订阅） | `update-available` | `onUpdateAvailable` |
| 107 | on（订阅） | `update-download-progress` | `onUpdateDownloadProgress` |
| 108 | on（订阅） | `update-downloaded` | `onUpdateDownloaded` |

**合计**：invoke **96** 条 + 订阅 **12** 条 = **108** 行。

---

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-05-12 | 初版：自 `hermes-desktop/src/preload/index.ts` 全量抽取 invoke + 推送表。 |
| 2026-05-12 | 增补附录 D：扁平总表；新增 `scripts/gen-hermes-preload-ipc-table.mjs` 供重跑生成。 |
