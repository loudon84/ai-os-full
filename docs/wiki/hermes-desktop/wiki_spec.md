# Hermes Desktop · hermes-agent 与 Portal 对接说明（wiki 梳理）

> **定位**：汇总 `hermes-desktop`（Electron 壳 + 本地 Python gateway）、`hermes-agent`（推理后端）与本仓库 **ai-os-portal** 在「连接 / 安装 / 管理 / 对话」上的**可查契约**，供后续扩展 `AGENTS.md` 与实现「Portal 本地壳 + 安装\管理\备份 agent」时对照。  
> **非目标**：不替代 `hermes-desktop` 源码；完整 IPC 列表以 `hermes-desktop/src/preload/index.ts` 与 `index.d.ts` 为准。

---

## 1. 分层与职责

| 层 | 职责 | 与「连接 / 安装 / 管理 / 对话」的关系 |
|----|------|----------------------------------------|
| **hermes-desktop（Electron）** | 窗口、IPC、`~/.hermes` 数据、拉起/重启 Python **gateway**、安装引导 | **安装 / 备份 / 配置 / 会话存储** 的主战场 |
| **hermes-agent（Python）** | LLM、工具、协议；桌面通过 **HTTP SSE** 对话 | **对话** 的实际推理端 |
| **ai-os-portal（本仓库 Next）** | 业务 UI、CopilotKit、部分 Next API | **邮件明细 / 文档 / 侧栏 Chat** 当前走 Portal **自有 AI 管线**，与 desktop 的 `hermesAPI` **尚未在实现上统一** |

**长期目标（产品方向）**：将 Portal 以 **hermes-desktop** 方式安装到用户本地，并同时 **安装 \ 管理 \ 备份** `hermes-agent`。实现上通常等价于：Electron **WebView 嵌入 Portal**，并把 Portal 的 AI 出口按策略接到 **本地 gateway**（`127.0.0.1:8642`）或保留云端/混合模式。

**延伸阅读（本仓库内）**：

- `docs/wiki/hermes-agent-desktop.md` — desktop 语义总览（与 upstream wiki 对齐的摘录与代码引用）。
- `hermes-desktop/docs/superpowers/specs/2026-04-30-windows-winget-fedora-rpm-release-design.md` — Windows winget / Fedora rpm 发布与安装形态（若 submodule 存在）。

---

## 2. hermes-desktop 架构要点

### 2.1 进程模型

| 进程 | 路径/角色 | 说明 |
|------|-----------|------|
| **Renderer** | `hermes-desktop/src/renderer/` | React SPA，**无 Node**；仅通过 `window.hermesAPI` 与 Main 通信 |
| **Preload** | `hermes-desktop/src/preload/index.ts` | **唯一安全边界**；`contextBridge.exposeInMainWorld("hermesAPI", …)` |
| **Main** | `hermes-desktop/src/main/index.ts` | `setupIPC()` 注册全部 `ipcMain.handle`；`createWindow`、更新器等 |
| **Python gateway** | 由 `src/main/hermes.ts` 管理 | 外部进程；桌面侧视为黑盒 |

### 2.2 不变式（实现时必须遵守）

- **IPC 是唯一合法跨进程通道**；Renderer 禁止直接 Node API。
- **`profileHome(profile?)` 统管路径**（`src/main/utils.ts`）；禁止硬编码 `~/.hermes` 破坏多 profile。
- **`hermesAPI` 是 Renderer 能力全集**；未在 preload 声明的能力 UI 不可用。
- **配置变更后需 `restartGateway()`**（如 API key、model、platform 开关）；新 IPC 若改配置需沿用同一模式。
- **SSE 推送**：聊天流由 Main `event.sender.send` 推送；Renderer 订阅须在 unmount 时 **取消订阅**，避免泄漏。

### 2.3 Python Gateway（「连接 Hermes」）

| 项 | 值 |
|----|-----|
| 地址 | `127.0.0.1:8642`（由 `hermes.ts` 与注入的 `config.yaml` 约定） |
| 健康检查 | `GET /health`（`isApiServerReady()` 轮询） |
| 对话 | `POST /v1/chat/completions`（**HTTP SSE**） |
| 启动策略 | 首次 `send-message` 且非 remote 模式时 **懒启动** `startGateway(profile)` |

---

## 3. Renderer ↔ Main：接口分组（摘录）

> 完整 channel 名与参数类型见 **`hermes-desktop/src/preload/index.ts`** 与 **`src/preload/index.d.ts`**。

### 3.1 安装与引导

| 能力 | IPC（示例） | 说明 |
|------|-------------|------|
| 检查安装态 | `check-install` | 返回如 `{ installed, configured, hasApiKey }` |
| 校验安装 | `verify-install` | 由 Main 实现校验逻辑 |
| 执行安装 | `start-install` | 通过 `install-progress` **推送**进度；返回 `{ success }` / `{ success, error }` |

### 3.2 对话（流式）

| 能力 | IPC | 参数要点 | Main → Renderer 事件 |
|------|-----|----------|----------------------|
| 发送消息 | `send-message` | `message`；可选 `profile`、`resumeSessionId`、`history[]` | `chat-chunk`、`chat-tool-progress`、`chat-usage`、`chat-done`、`chat-error` |

**语义**：`invoke("send-message")` 的 Promise 最终得到 `{ response, sessionId? }`；中间增量靠事件拼接。可 **abort** 进行中的对话（Main 维护 `currentChatAbort`）。

### 3.3 管理面（Main 模块，经 IPC 暴露）

以下模块职责来自 wiki 总览；具体 handler 名称以 preload 为准：

| 模块 | 职责 |
|------|------|
| `installer.ts` | `HERMES_HOME`、`venv`、依赖、`runHermesDoctor` / `runHermesUpdate`、**backup / import / dump**、MCP/memory provider 发现、日志 |
| `config.ts` | `.env`、`config.yaml`（本地/远程、模型、凭证池）；带 TTL 的内存缓存 |
| `profiles.ts` | Profile CRUD、激活标记 |
| `sessions.ts` | SQLite `state.db`、消息 **FTS5** |
| `session-cache.ts` | `desktop/sessions.json`、标题缓存、增量同步 |
| `memory.ts` | `memories/MEMORY.md`，**总长上限 2200 字符**，`§` 分隔条目 |
| `soul.ts` | `SOUL.md` 身份/系统提示 |
| `tools.ts` / `skills.ts` | 工具集开关、`SKILL.md` 技能发现 |
| `models.ts` | 用户模型库（与活动配置分存） |
| `cronjobs.ts` | `jobs.json` 定时任务 |

### 3.4 默认存储布局（`HERMES_HOME`，默认 profile）

```
~/.hermes/
  config.yaml
  .env
  state.db
  SOUL.md
  memories/MEMORY.md
  skills/<category>/<name>/
  jobs.json
  desktop/sessions.json
  profiles/<name>/     # 与根目录同构
```

---

## 4. 发布与本地安装形态（winget / RPM 设计）

依据 `hermes-desktop` 内 spec（若存在）：**扩展 CI** 产出 Windows NSIS `.exe`、winget 清单模板、Linux **rpm**（与 AppImage/deb 并列）。

| 主题 | 说明 |
|------|------|
| Windows | NSIS **用户态**安装（`perMachine: false`），与 `~/.hermes` 用户数据模型一致；**无代码签名** → SmartScreen 提示 |
| Winget | `PackageIdentifier`: `NousResearch.HermesDesktop`；清单为 CI artifact，**不自动提交** `microsoft/winget-pkgs` |
| Linux rpm | **无 GPG**；**electron-updater 不支持 rpm 自动更新**，用户需手动升级 |
| 与对话契约关系 | 安装包只解决「壳与 agent 环境」；**运行时对话契约仍是 §2.3 + §3.2** |

---

## 5. Portal：第一阶段相关契约（邮件 / 文档 / Chat）

### 5.1 邮件 AI — UI 组件

| 文件 | 契约摘要 |
|------|----------|
| `frontend/modules/email/components/email-ai-panel.tsx` | `EmailAIPanel`：接收 `selectedMail`、`result`、`onClearResult`、`onApplyToCompose?` 及 runner：`runSummarizeEmail`、`runDraftReply`、`runTranslateEmail`、`runExtractTasks`、`runExtractData`、`runCustomAgent`；仅负责 busy 与布局 |
| `frontend/modules/email/components/email-ai-result-card.tsx` | `EmailAiResultCard`：`title`、`markdown`、`loading?`、`onRetry?`、`onApplyToEditor?`、`onClose?` |
| `frontend/modules/email/components/email-ai-action-button.tsx` | 小型加载态按钮 |

### 5.2 邮件 AI — 逻辑与 HTTP

| 项 | 说明 |
|----|------|
| Hook | `frontend/modules/email/hooks/use-email-agent-actions.ts` — `useEmailAgentActions` |
| HTTP | `POST /api/email/ai-completion`，body：`{ system, user }`；成功：`{ text }`（见 `frontend/modules/email/lib/email-ai-completion.ts`） |
| 结果类型 | `EmailAgentResultPayload`：`{ title, markdown, action }` |
| CopilotKit `useCopilotAction` 名 | `summarize_email`、`draft_reply`、`translate_email`（参数 `target_lang`）、`extract_tasks`、`extract_data`、`custom_agent`（`agent_id`、`user_goal`）、`polish_compose`（`instruction`） |

**与 hermes-desktop 关系**：当前邮件 AI **不经过** `127.0.0.1:8642`；桌面化时可考虑：WebView 注入 `hermesAPI` 改调 `send-message`、或本地代理转发到 gateway、或 remote 模式保持现有 API。

### 5.3 文档（表格）AI — Hook 与 Facade

| 项 | 说明 |
|----|------|
| Hook | `frontend/modules/documents/copilot/useSpreadsheetDocumentAi.ts` |
| Copilot 可读 | `documentId`、`versionId`、`selection`、`stagedPatchId` |
| Copilot 动作 | `analyzeSelection`、`validateDatasheetPatch`、`applyDatasheetPatch` |
| REST 客户端 | `frontend/modules/documents/services/documentAi.api.ts`，前缀 **`/ai`** |

| 方法 | 路径 |
|------|------|
| POST | `/ai/document-ai/interactions`（创建分析；支持 Idempotency-Key） |
| GET | `/ai/document-ai/interactions/:id` |
| POST | `/ai/document-ai/patches/validate` |
| GET | `/ai/document-ai/patches/:id` |
| POST | `/ai/document-ai/patches/:id/decision` |

环境变量：`NEXT_PUBLIC_DOCUMENT_AI_USE_MOCK` 非 `"false"` 时走 mock，不请求真实后端。流式 URL 来自 `createInteraction` 返回的 `stream_url`。

---

## 6. 对照总表：用户故事 → 契约所在

| 用户故事 | hermes-desktop / agent | Portal 现状 |
|----------|------------------------|-------------|
| 安装 agent 环境 | `installer.ts`、`start-install`、`check-install` | 无 |
| 本地连接 Hermes | `127.0.0.1:8642`，`/health`，`/v1/chat/completions` | 邮件/文档主要不经过该端口 |
| 管理 / 备份 | update、backup、import、dump、config、profile | 无 |
| 流式对话 | `send-message` + `chat-*` 事件 | CopilotKit + `/api/copilot`；邮件另有 `/api/email/ai-completion` |
| 邮件明细 AI | — | `useEmailAgentActions` + 上述 HTTP + Copilot actions |
| 文档查看/编辑 AI | — | `useSpreadsheetDocumentAi` + `/ai/document-ai/*` + Univer 本地 apply |

---

## 7. 后续 `AGENTS.md` 可增补提纲（实现时按需落地）

1. **Hermes 本地栈**：三进程 + gateway 端口、**配置变更必须重启 gateway**。  
2. **`hermesAPI` 索引**：指向 preload 类型文件；按「安装 / 对话 / 配置 / 会话 / 备份」分组。  
3. **Portal 嵌入模式**：WebView 基址、鉴权 Cookie、是否与现有 `WorkspaceLayout` 策略一致。  
4. **AI 路由策略**：何时走 `send-message`，何时保留 Portal Route Handler（邮件 completion、document-ai）。  
5. **发布渠道**：winget / rpm / AppImage 与用户数据目录（`HERMES_HOME`）。

---

## 8. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-05-12 | 初版：综合 `docs/wiki/hermes-agent-desktop.md`、winget/rpm spec、邮件与文档前端契约整理入 PRD。 |
