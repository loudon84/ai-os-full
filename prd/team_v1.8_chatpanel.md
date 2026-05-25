# PRD：Workspaces Chat Panel 优化

版本：team_v1.8
涉及项目：`copilot-desktop`、`copilot-serve`
目标模块：`Workspaces / Chat`
实施工具：Cursor

---

# 1. 版本目标

`team_v1.8` 聚焦优化 `copilot-desktop` 的 `Workspaces Chat Panel`。

本版本不重写为传统 `ChatHeader + MessageList + ChatInput` 三段式结构，统一改为 `hermes-webui` 风格的 `HermesWebChatSurface`：

```text
WorkspacesLayout
├─ Left Navigation
├─ Center Chat Panel
│  └─ HermesWebChatSurface
│     ├─ ChatScrollArea
│     └─ ComposerBar
└─ Right Panel
   ├─ Workspace Tab
   └─ Runtime Tab
```

核心目标：

```text
1. Workspaces Chat 中间区域接近 hermes-webui chat 交互。
2. 保留右侧 Workspace / Runtime Right Panel，不改布局。
3. 模型列表、默认模型、附件上传全部进入底部 ComposerBar。
4. 修复 Profile default not found。
5. chat stream 必须按 profile / workspace / session / stream 隔离。
6. copilot-serve 增加 profile-scoped chat API，供 copilot-desktop 调用。
```

---

# 2. 不做内容

```text
1. 不新增 ChatHeader。
2. 不新增顶部 New Chat / Clear 横条。
3. 不把模型选择放到顶部 Header。
4. 不修改 Workspaces Right Panel。
5. 不修改全局 main.tsx CSS。
6. 不修改全局 Layout。
7. 不直接让 Renderer 访问本地文件路径。
8. 不直接让 Renderer 访问 Hermes Gateway。
9. 不直接修改 Hermes config.yaml 作为默认模型第一落点。
```

---

# 3. copilot-desktop 功能需求

## 3.1 Workspaces Chat UI 改造

目标路径：

```text
src/renderer/src/screens/Workspaces/pages/Chat
```

新增结构：

```text
src/renderer/src/screens/Workspaces/pages/Chat/
  index.tsx
  HermesWebChatSurface.tsx
  ChatScrollArea.tsx
  ComposerBar.tsx
  ChatBubble.tsx
  ActivityRow.tsx
  ErrorCard.tsx
  StatusToast.tsx
  ProviderDetails.tsx
  AttachmentTray.tsx
  AttachmentMenu.tsx
  ProfileSelector.tsx
  WorkspaceSelector.tsx
  ModelSelector.tsx
  MoreActionsMenu.tsx
  types.ts

  hooks/
    useHermesWebChat.ts
    useComposerState.ts
    useChatStream.ts
    useChatModels.ts
    useChatAttachments.ts
    useAutoScroll.ts
    useProfileResolver.ts
```

删除或禁止新增：

```text
ChatHeader.tsx
MessageList.tsx
ChatInput.tsx
```

组件职责：

| 组件                     | 职责                                                    |
| ---------------------- | ----------------------------------------------------- |
| `HermesWebChatSurface` | Workspaces Chat 唯一主组件，组合滚动区与底部 Composer               |
| `ChatScrollArea`       | 消息滚动区，包含日期线、用户消息、助手消息、Activity、ErrorCard              |
| `ComposerBar`          | 底部输入区，包含输入框、附件、语音占位、profile、workspace、model、send      |
| `ChatBubble`           | 用户/助手消息展示                                             |
| `ActivityRow`          | 折叠 Activity / Tool Progress                           |
| `ErrorCard`            | Hermes / Provider / Gateway 错误展示                      |
| `ProviderDetails`      | Provider 错误详情折叠卡                                      |
| `StatusToast`          | `Hermes agent is not responding` 等状态浮层                |
| `ModelSelector`        | 模型列表、刷新模型、设置默认模型                                      |
| `AttachmentTray`       | 附件 chip 列表                                            |
| `ProfileSelector`      | 当前 profile 切换与 New conversation / Clear 入口            |
| `WorkspaceSelector`    | 当前 workspace 选择                                       |
| `MoreActionsMenu`      | New conversation、Clear、View sessions、Runtime settings |

---

## 3.2 ChatScrollArea 需求

展示内容：

```text
1. 日期分隔线。
2. UserBubble。
3. AssistantBubble。
4. Activity 折叠行。
5. Tool progress。
6. ErrorCard。
7. Provider details 折叠区。
8. 底部 padding，避免被 ComposerBar 遮挡。
```

交互要求：

```text
1. 新消息自动滚动到底部。
2. 用户手动向上滚动后不强制抢占。
3. assistant streaming 时逐 token 更新。
4. error 不覆盖历史消息。
5. provider details 默认折叠。
6. activity 默认折叠。
7. 支持 markdown。
8. 支持 code block copy。
```

---

## 3.3 ComposerBar 需求

布局结构：

```text
ComposerBar
├─ Textarea
├─ AttachmentTray
├─ Bottom Toolbar
│  ├─ AttachButton
│  ├─ VoiceButton
│  ├─ ProfileSelector
│  ├─ WorkspaceSelector
│  ├─ ToolSettingsButton
│  ├─ ModelSelector
│  ├─ ContextTokenIndicator
│  └─ SendStopButton
```

Textarea 行为：

```text
1. placeholder：Message Hermes...
2. Enter 发送。
3. Shift + Enter 换行。
4. IME 输入中禁止误发送。
5. 支持空白内容校验。
6. 有附件时允许无文本发送。
```

发送按钮：

```text
1. idle 状态显示 Send。
2. streaming 状态显示 Stop。
3. Stop 调用 stream abort。
4. gateway 不可用时禁用发送。
5. profile 未解析时禁用发送。
```

---

## 3.4 模型列表需求

入口位置：

```text
ComposerBar 右侧 ModelSelector
```

功能：

```text
1. 加载当前 profile 可用模型。
2. 显示当前默认模型。
3. 支持刷新模型列表。
4. 支持设置当前模型为默认模型。
5. 支持模型为空时展示 empty state。
6. 支持 gateway 未启动时展示不可用状态。
7. 支持 provider 分组展示。
```

模型展示结构：

```text
Current
- Default
- 当前 model_id

Ollama
- qwen3-coder
- gemma4-26b-hermes-planner

Kimi
- kimi-k2.5

DeepSeek
- deepseek-chat

Custom
- provider
- base_url
- model_id
- Save as default
```

默认模型优先级：

```text
1. 当前 session 临时选择的 model。
2. profile_chat_settings.default_model。
3. /chat/models 返回的第一个可用模型。
4. Hermes Gateway 自身 fallback。
```

---

## 3.5 附件上传需求

入口位置：

```text
ComposerBar 左侧 AttachButton
```

支持方式：

```text
1. 点击选择文件。
2. 拖拽文件到 ComposerBar。
3. 粘贴文件或图片作为后续扩展，不作为 team_v1.8 必须项。
```

附件显示：

```text
AttachmentTray
├─ 文件名
├─ 文件大小
├─ 文件类型
└─ 删除按钮
```

限制规则：

```text
单文件最大：25MB
单消息最大附件数：10
单消息附件总大小：80MB
```

文本抽取类型：

```text
.txt
.md
.json
.csv
.yaml
.yml
.log
.ts
.tsx
.js
.jsx
.py
.sql
.html
.css
```

二进制保存路径类型：

```text
.pdf
.docx
.xlsx
.png
.jpg
.jpeg
.webp
.zip
```

Renderer 限制：

```text
1. Renderer 不保存绝对路径。
2. Renderer 只拿 attachment_id、name、size、mime_type、text_preview、workspace_relative_path。
3. 删除附件只调用 attachment_id。
```

---

## 3.6 Profile default not found 修复

问题：

```text
当前 Workspaces Chat 使用 profile name/default 直接调用 profile_id API，导致右侧日志出现：
Error: Profile default not found
```

修复规则：

```text
1. 所有 Workspaces Chat 请求先调用 profile resolver。
2. Renderer 只允许持有 profileRef。
3. Main Process 负责 profileRef → profile_id。
4. copilot-serve API 只接收 profile_id。
5. default / writer-9601 / finance-9631 均必须能解析为真实 profile_id。
```

新增 hook：

```text
useProfileResolver.ts
```

返回：

```ts
type ResolvedProfile = {
  profile_id: string
  name: string
  display_name?: string
  gateway_port?: number
  base_url?: string
  status: 'running' | 'stopped' | 'failed' | 'not_deployed'
  healthy: boolean
}
```

---

## 3.7 Stream 隔离需求

所有 Chat Stream 事件必须包含：

```ts
type WorkspaceChatStreamScope = {
  stream_id: string
  profile_id: string
  workspace_id: string
  session_id: string
}
```

Renderer 应用事件前必须校验：

```text
1. 当前 profile_id 一致。
2. 当前 workspace_id 一致。
3. 当前 session_id 一致。
4. 当前 stream_id 一致。
```

切换 profile / workspace / session 时：

```text
1. abort 当前 stream。
2. 清理 composer busy 状态。
3. 保留已完成消息。
4. 未完成 assistant streaming 标记为 interrupted。
```

---

## 3.8 copilot-desktop Main Process 需求

新增目录：

```text
src/main/workspace-chat/
  workspace-chat-ipc.ts
  workspace-chat-client.ts
  workspace-chat-stream.ts
  workspace-attachment-staging.ts
  workspace-profile-resolver.ts
```

职责：

| 文件                                | 职责                        |
| --------------------------------- | ------------------------- |
| `workspace-chat-ipc.ts`           | 注册 IPC channel            |
| `workspace-chat-client.ts`        | 调用 copilot-serve chat API |
| `workspace-chat-stream.ts`        | 处理 SSE，转发给 Renderer       |
| `workspace-attachment-staging.ts` | 调用附件上传 API，不暴露绝对路径        |
| `workspace-profile-resolver.ts`   | 解析 profileRef             |

IPC Channels：

```text
workspace-chat:resolve-profile
workspace-chat:list-models
workspace-chat:get-model-config
workspace-chat:set-model-config
workspace-chat:upload-attachments
workspace-chat:remove-attachment
workspace-chat:send-message
workspace-chat:abort
```

Renderer Events：

```text
workspace-chat:chunk
workspace-chat:tool-progress
workspace-chat:usage
workspace-chat:done
workspace-chat:error
workspace-chat:status
```

---

## 3.9 Preload API 需求

新增：

```text
src/preload/workspace-chat-api.ts
```

暴露：

```ts
window.workspaceChat = {
  resolveProfile(profileRef: string): Promise<ResolvedProfile>

  listModels(profileId: string): Promise<ChatModelListResponse>

  getModelConfig(profileId: string): Promise<ProfileChatModelConfig>

  setModelConfig(
    profileId: string,
    payload: SetProfileChatModelConfigPayload
  ): Promise<ProfileChatModelConfig>

  uploadAttachments(
    payload: UploadWorkspaceAttachmentsPayload
  ): Promise<UploadWorkspaceAttachmentsResponse>

  removeAttachment(
    attachmentId: string
  ): Promise<{ ok: true }>

  sendMessage(
    payload: WorkspaceChatSendPayload
  ): Promise<{ stream_id: string }>

  abort(
    streamId: string
  ): Promise<{ ok: true }>

  onChunk(callback: (event: WorkspaceChatChunkEvent) => void): () => void
  onToolProgress(callback: (event: WorkspaceChatToolProgressEvent) => void): () => void
  onUsage(callback: (event: WorkspaceChatUsageEvent) => void): () => void
  onDone(callback: (event: WorkspaceChatDoneEvent) => void): () => void
  onError(callback: (event: WorkspaceChatErrorEvent) => void): () => void
  onStatus(callback: (event: WorkspaceChatStatusEvent) => void): () => void
}
```

同步更新：

```text
src/preload/index.ts
src/preload/index.d.ts
src/renderer/src/types/global.d.ts
```

---

# 4. copilot-serve 功能需求

## 4.1 新增 API 模块

新增文件：

```text
src/api/v1/chat.py
src/api/v1/attachments.py
```

注册到主 API router。

---

## 4.2 新增 Service

新增文件：

```text
src/services/profile_ref_resolver.py
src/services/chat_model_service.py
src/services/chat_stream_service.py
src/services/attachment_service.py
```

职责：

| Service              | 职责                                                  |
| -------------------- | --------------------------------------------------- |
| `ProfileRefResolver` | 将 default / profile name / profile_id 解析为真实 profile |
| `ChatModelService`   | 获取 Hermes Gateway 模型列表，读写默认模型                       |
| `ChatStreamService`  | 转发 Hermes Gateway chat completions / runs SSE       |
| `AttachmentService`  | 处理附件保存、文本抽取、上下文注入                                   |

---

## 4.3 新增 Schema

新增文件：

```text
src/schemas/chat.py
src/schemas/attachments.py
```

核心类型：

```py
class ResolvedProfile(BaseModel):
    profile_id: str
    name: str
    display_name: str | None = None
    gateway_port: int | None = None
    base_url: str | None = None
    status: str
    healthy: bool

class ChatModel(BaseModel):
    id: str
    label: str
    provider: str | None = None
    base_url: str | None = None
    source: str
    is_current: bool = False

class ChatModelListResponse(BaseModel):
    profile_id: str
    models: list[ChatModel]
    raw: dict | None = None

class ProfileChatModelConfig(BaseModel):
    profile_id: str
    provider: str
    model_id: str
    model_label: str | None = None
    base_url: str | None = None
    updated_at: str

class WorkspaceChatSendPayload(BaseModel):
    workspace_id: str
    session_id: str
    model: str | None = None
    messages: list[dict]
    attachments: list[str] = []
    stream: bool = True
```

附件类型：

```py
class ChatAttachment(BaseModel):
    id: str
    profile_id: str
    workspace_id: str
    session_id: str
    name: str
    mime_type: str
    size_bytes: int
    sha256: str
    workspace_relative_path: str
    text_preview: str | None = None
```

---

## 4.4 Profile Resolve API

接口：

```http
GET /api/v1/profiles/resolve?ref=default
```

返回：

```json
{
  "profile_id": "profile_uuid",
  "name": "default",
  "display_name": "智能助手",
  "gateway_port": 8642,
  "base_url": "http://127.0.0.1:8642",
  "status": "running",
  "healthy": true
}
```

规则：

```text
1. ref 命中 profile_id，直接返回。
2. ref 命中 profile name，返回对应 profile_id。
3. ref = default 时必须返回 default profile。
4. default profile 不存在时返回明确错误码 PROFILE_NOT_FOUND。
5. 未部署 profile 返回 status = not_deployed，不抛 500。
```

---

## 4.5 模型列表 API

接口：

```http
GET /api/v1/profiles/{profile_id}/chat/models
```

行为：

```text
1. 读取 profile runtime。
2. 检查 gateway base_url。
3. 调用 Hermes Gateway GET /v1/models。
4. 标记当前默认模型 is_current。
5. gateway 不可用时返回 models=[]，并带 status。
```

返回：

```json
{
  "profile_id": "profile_uuid",
  "models": [
    {
      "id": "qwen3-coder",
      "label": "qwen3-coder",
      "provider": "ollama",
      "base_url": "http://127.0.0.1:11434/v1",
      "source": "gateway",
      "is_current": true
    }
  ],
  "raw": {}
}
```

---

## 4.6 默认模型 API

接口：

```http
GET /api/v1/profiles/{profile_id}/chat/model-config
PUT /api/v1/profiles/{profile_id}/chat/model-config
```

PUT body：

```json
{
  "provider": "ollama",
  "model_id": "qwen3-coder",
  "model_label": "Qwen3 Coder",
  "base_url": "http://127.0.0.1:11434/v1"
}
```

持久化表：

```sql
CREATE TABLE profile_chat_settings (
  profile_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'auto',
  model_id TEXT NOT NULL,
  model_label TEXT,
  base_url TEXT,
  is_default INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

规则：

```text
1. 每个 profile 只保存一个默认 chat model。
2. 设置默认模型不重启 Hermes Gateway。
3. chat send 时显式传 model。
4. 未设置默认模型时返回 null config 或 fallback config。
```

---

## 4.7 附件上传 API

接口：

```http
POST /api/v1/workspaces/{workspace_id}/attachments
Content-Type: multipart/form-data
```

form fields：

```text
profile_id
session_id
files[]
```

返回：

```json
{
  "attachments": [
    {
      "id": "att_xxx",
      "profile_id": "profile_uuid",
      "workspace_id": "workspace_uuid",
      "session_id": "session_xxx",
      "name": "spec.md",
      "mime_type": "text/markdown",
      "size_bytes": 12345,
      "sha256": "...",
      "workspace_relative_path": ".aios/attachments/default/session_xxx/att_xxx_spec.md",
      "text_preview": "..."
    }
  ]
}
```

存储路径：

```text
<workspace.root>/.aios/attachments/<profile_name>/<session_id>/<attachment_id>_<safe_name>
```

数据库表：

```sql
CREATE TABLE chat_attachments (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  original_name TEXT NOT NULL,
  safe_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  workspace_relative_path TEXT NOT NULL,
  text_preview TEXT,
  created_at TEXT NOT NULL
);
```

安全规则：

```text
1. 文件名必须 safe_name。
2. 禁止 path traversal。
3. 保存路径必须在 workspace root 内。
4. 单文件超过 25MB 返回 ATTACHMENT_TOO_LARGE。
5. 单消息超过 10 个返回 TOO_MANY_ATTACHMENTS。
6. 总大小超过 80MB 返回 ATTACHMENT_TOTAL_SIZE_EXCEEDED。
```

---

## 4.8 Chat Completions SSE API

接口：

```http
POST /api/v1/profiles/{profile_id}/chat/completions
Accept: text/event-stream
```

body：

```json
{
  "workspace_id": "workspace_uuid",
  "session_id": "session_xxx",
  "model": "qwen3-coder",
  "messages": [
    {
      "role": "user",
      "content": "分析附件内容"
    }
  ],
  "attachments": ["att_xxx"],
  "stream": true
}
```

行为：

```text
1. 校验 profile_id。
2. 校验 workspace_id。
3. 校验附件归属 profile_id + workspace_id + session_id。
4. 读取默认模型。
5. 拼接附件上下文。
6. 转发到 Hermes Gateway。
7. 将 Hermes Gateway stream 转换为统一 workspace-chat SSE。
```

SSE 事件：

```text
event: chat.chunk
data: {"stream_id":"...","profile_id":"...","workspace_id":"...","session_id":"...","content":"..."}

event: chat.tool_progress
data: {"stream_id":"...","profile_id":"...","workspace_id":"...","session_id":"...","name":"read_file","label":"Read file"}

event: chat.usage
data: {"stream_id":"...","profile_id":"...","workspace_id":"...","session_id":"...","prompt_tokens":100,"completion_tokens":80,"total_tokens":180}

event: chat.done
data: {"stream_id":"...","profile_id":"...","workspace_id":"...","session_id":"..."}

event: chat.error
data: {"stream_id":"...","profile_id":"...","workspace_id":"...","session_id":"...","message":"...","details":{}}
```

---

## 4.9 附件上下文注入规则

发送给 Hermes Gateway 前构造：

```text
[Workspace Attachments]

1. file: spec.md
   mime: text/markdown
   path: .aios/attachments/default/session_xxx/att_xxx_spec.md
   sha256: xxx
   content:
   <text_preview or extracted text>

2. file: demo.png
   mime: image/png
   path: .aios/attachments/default/session_xxx/att_yyy_demo.png
   sha256: yyy
   note: binary attachment. Use file tools inside workspace when needed.
```

规则：

```text
1. 文本附件最多注入前 120KB。
2. 二进制附件只注入相对路径与说明。
3. 所有路径必须是 workspace_relative_path。
4. 不注入系统绝对路径。
```

---

# 5. 数据库迁移

新增 migration：

```text
migrations/versions/20260525_team_v18_workspace_chat.py
```

包含：

```sql
CREATE TABLE profile_chat_settings (
  profile_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'auto',
  model_id TEXT NOT NULL,
  model_label TEXT,
  base_url TEXT,
  is_default INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE chat_attachments (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  original_name TEXT NOT NULL,
  safe_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  workspace_relative_path TEXT NOT NULL,
  text_preview TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_chat_attachments_session
ON chat_attachments(profile_id, workspace_id, session_id);

CREATE INDEX idx_chat_attachments_workspace
ON chat_attachments(workspace_id);
```

---

# 6. 错误码

统一错误码：

```text
PROFILE_NOT_FOUND
PROFILE_NOT_DEPLOYED
GATEWAY_NOT_RUNNING
GATEWAY_HEALTH_FAILED
MODEL_LIST_FAILED
MODEL_CONFIG_INVALID
ATTACHMENT_TOO_LARGE
TOO_MANY_ATTACHMENTS
ATTACHMENT_TOTAL_SIZE_EXCEEDED
ATTACHMENT_NOT_FOUND
ATTACHMENT_SCOPE_MISMATCH
WORKSPACE_NOT_FOUND
WORKSPACE_PATH_INVALID
CHAT_STREAM_FAILED
CHAT_STREAM_ABORTED
```

错误响应：

```json
{
  "error": {
    "code": "GATEWAY_NOT_RUNNING",
    "message": "Hermes gateway is not running",
    "details": {
      "profile_id": "profile_uuid",
      "state": "stopped"
    }
  }
}
```

---

# 7. Cursor 实施顺序

## 7.1 copilot-serve

```text
1. 新增 migration：
   - profile_chat_settings
   - chat_attachments

2. 新增 schemas：
   - src/schemas/chat.py
   - src/schemas/attachments.py

3. 新增 services：
   - profile_ref_resolver.py
   - chat_model_service.py
   - attachment_service.py
   - chat_stream_service.py

4. 新增 API：
   - src/api/v1/chat.py
   - src/api/v1/attachments.py

5. 注册 router。

6. 接入现有：
   - gateway_supervisor.py
   - hermes_gateway_client.py
   - profile_service.py
   - workspace service / workspace registry

7. 增加测试：
   - resolve default profile
   - resolve profile name
   - profile not deployed
   - list models gateway success
   - list models gateway down
   - set/get default model
   - upload text attachment
   - upload oversized attachment
   - attachment scope mismatch
   - chat completions SSE mock
```

## 7.2 copilot-desktop Main / Preload

```text
1. 新增 src/main/workspace-chat/*。

2. 注册 IPC：
   - workspace-chat:resolve-profile
   - workspace-chat:list-models
   - workspace-chat:get-model-config
   - workspace-chat:set-model-config
   - workspace-chat:upload-attachments
   - workspace-chat:remove-attachment
   - workspace-chat:send-message
   - workspace-chat:abort

3. 新增 preload API：
   - src/preload/workspace-chat-api.ts

4. 更新：
   - src/preload/index.ts
   - src/preload/index.d.ts
   - renderer global type

5. 实现 stream scope 校验字段透传。

6. 实现 abort controller 管理。
```

## 7.3 copilot-desktop Renderer

```text
1. 重构 Workspaces/pages/Chat。

2. 新增 HermesWebChatSurface。

3. 新增 ChatScrollArea：
   - bubble
   - activity
   - error
   - provider details
   - day divider

4. 新增 ComposerBar：
   - textarea
   - attach
   - voice placeholder
   - profile selector
   - workspace selector
   - model selector
   - send/stop

5. 接入 hooks：
   - useProfileResolver
   - useChatModels
   - useChatAttachments
   - useChatStream
   - useComposerState
   - useAutoScroll

6. 移除顶部 Header 方案。

7. 保持 Right Panel 不变。
```

---

# 8. 验收标准

## 8.1 UI 验收

```text
[ ] Workspaces Chat 中间区域为 hermes-webui 风格 Chat Surface。
[ ] 页面顶部不出现 ChatHeader。
[ ] New Chat / Clear 不占用顶部横条。
[ ] 模型选择位于底部 ComposerBar。
[ ] profile selector 位于底部 ComposerBar。
[ ] workspace selector 位于底部 ComposerBar。
[ ] 附件入口位于底部 ComposerBar。
[ ] Hermes agent is not responding 以 StatusToast 或 inline 状态显示。
[ ] ErrorCard 支持 Provider details 折叠。
[ ] Activity 默认折叠。
[ ] Right Panel 的 Workspace / Runtime tabs 不变。
```

## 8.2 模型验收

```text
[ ] default profile running 时可加载模型。
[ ] 模型列表为空时显示 empty state。
[ ] gateway 停止时 ModelSelector 显示不可用状态。
[ ] 选择模型后可保存为默认模型。
[ ] 刷新页面后默认模型仍保留。
[ ] 切换 profile 后加载对应 profile 默认模型。
[ ] 发送消息时使用当前 profile 默认模型。
```

## 8.3 附件验收

```text
[ ] 点击附件按钮可选择文件。
[ ] 上传成功后显示 attachment chip。
[ ] 删除 chip 后发送不包含该附件。
[ ] 文本附件注入内容上下文。
[ ] 二进制附件只注入 workspace 相对路径。
[ ] 超过 25MB 单文件被拒绝。
[ ] 超过 10 个附件被拒绝。
[ ] 超过 80MB 总大小被拒绝。
[ ] Renderer 不显示本地绝对路径。
```

## 8.4 Chat Stream 验收

```text
[ ] streaming token 正常展示。
[ ] Stop 可中断当前 stream。
[ ] error 不清空历史消息。
[ ] usage 事件正常展示。
[ ] tool progress 正常展示。
[ ] 切换 profile 后旧 stream 不污染当前页面。
[ ] 切换 workspace 后旧 stream 不污染当前页面。
[ ] 切换 session 后旧 stream 不污染当前页面。
```

## 8.5 Profile 修复验收

```text
[ ] 不再出现 Error: Profile default not found。
[ ] default 能解析为真实 profile_id。
[ ] writer-9601 能解析为真实 profile_id 或 not_deployed 状态。
[ ] not_deployed profile 不返回 500。
[ ] Workspaces Chat 所有请求都使用 resolved profile_id。
```

---

# 9. 最终交付物

```text
copilot-serve：
- 新增 profile-scoped chat API
- 新增模型列表 API
- 新增默认模型 API
- 新增附件上传 API
- 新增 Chat SSE Proxy
- 新增 profile resolve
- 新增 SQLite migration
- 新增 pytest

copilot-desktop：
- Workspaces Chat 改为 HermesWebChatSurface
- ComposerBar 集成模型、profile、workspace、附件、发送
- ChatScrollArea 支持 hermes-webui 风格消息展示
- Main Process 增加 workspace-chat IPC
- Preload 增加 window.workspaceChat
- 修复 Profile default not found
- 保留 Right Panel 原布局
```

team_v1.8 的交付边界固定为：**Workspaces Chat Surface + ComposerBar + profile-scoped chat API + 模型默认配置 + 附件上下文注入 + stream 隔离**。

---

# team_v1.8.1 hotfix（review 修复）

- `profileInstalled` 逻辑改为 AND；审批流恢复 `toolRequiresApproval` + `dismissApproval`
- Gateway `x-hermes-session-id` → `chat.done.resolved_session_id` → Sessions 列表回写
- Main `workspace-chat-stream` 按 `profile_id:session_id` 分桶 abort
- 会话历史：`GET /api/v1/profiles/{id}/sessions/{session_id}/messages`（读 profile `state.db`）
- UI 补齐：`WorkspaceSelector`、`AttachmentMenu`、`ProviderDetails`、日期分隔线、usage 行
- 错误码 factory 补全 + pytest（附件/scope/not_deployed/SSE session）
