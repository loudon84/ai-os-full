# ai-copilot-serve / ai-os-desktop  agent-team v1.3 方案文档

**主题：Electron Task Workbench + 实时执行过程 Timeline + Approval 闭环**

## 0. 结论

按当前架构，**Task Workbench 页面放在 Electron Renderer React 内实现**；任务创建、任务列表、任务详情、执行、审批、Timeline 数据全部调用 `ai-copilot-serve` 的本地 HTTP API。

Electron Main Process 只负责：

```text
1. 启动 / 检查 ai-copilot-serve
2. 管理窗口与 WebContentsView
3. 提供 preload 安全 API
4. 提供 ai-copilot-serve baseUrl / token / lifecycle 状态
5. 不直接管理任务业务逻辑
```

任务业务逻辑属于 `ai-copilot-serve`。附件已把 `copilot-desktop` 定义为 Electron 桌面客户端，把 `copilot-serve` 定义为本地常驻控制面，并规定桌面端依赖 Portal、Backend 与 `copilot-serve :8765`。

---

## 1. 当前源码判断

### 1.1 ai-os-desktop 当前状态

`ai-os-desktop` 是 Electron 39 + React 19 + TypeScript + Tailwind CSS 4 的桌面壳工程，当前 README 明确它已经从单 Hermes installer 演进为多 Profile Copilot Console，并承担 desktop shell、process lifecycle、SQLite control plane、统一 UI。([GitHub][1])

当前桌面端已有严格的 Main / Preload / Renderer 分层：

```text
Renderer
  → window.hermesAPI | profileRuntime | profileEntry | aiosBrowser
Preload
  → src/preload/
Main
  → src/main/
Hermes Gateway
  → http://127.0.0.1:<port>/v1/chat/completions
```

README 里也要求新增 backend features 走 Main module → ipcMain.handle → Preload wrapper → index.d.ts → Renderer。([GitHub][1])

现有 workspace 系统只包含：

```ts
aios-home
aios-workspace
web-operator
office
```

`StaticWorkspaceId` 当前没有 `task-workbench`。
`workspace-registry.ts` 也只注册了这 4 个静态 workspace。
`WorkspaceRenderer.tsx` 当前只渲染 AIOSHome、AIOSWorkspace、WebOperator、Office，没有 Task Workbench。

现有 `window` preload 已包含 `hermesAPI`、`aiosBrowser`、`profileRuntime`、`profileEntry`、`aiosRuntime`、`desktopAuth`、`desktopUserConfig` 等能力，但没有 `copilotServe` 本地控制面 API。

### 1.2 ai-os-serve 当前状态

`ai-os-serve` README 定义它是 `ai-os-desktop` 的本地控制面，负责 Hermes Profile、Gateway 启停、models/runs 代理，并以 `127.0.0.1:8765` 启动。([GitHub][2])

`pyproject.toml` 技术栈已经确定：

```text
Python >=3.12,<3.13
FastAPI
Uvicorn
Pydantic v2
SQLAlchemy asyncio
aiosqlite
Alembic
httpx
structlog
psutil
pyyaml
python-dotenv
```



API Contract 已有以下关键能力：

```text
GET  /api/v1/tasks
POST /api/v1/tasks
GET  /api/v1/tasks/{task_id}
POST /api/v1/tasks/{task_id}/run
POST /api/v1/tasks/{task_id}/cancel
GET  /api/v1/tasks/{task_id}/events
GET  /api/v1/tasks/{task_id}/events/stream
GET  /api/v1/approvals/pending
POST /api/v1/approvals/{id}/approve
POST /api/v1/approvals/{id}/reject
GET  /api/v1/desktop/task-workbench/summary
```



`src/api/router.py` 已经挂载 `tasks`、`team_tasks`、`approvals`、`workspaces`、`task_routing`、`desktop_workbench` 等 v1 路由。

`tasks.py` 已经实现任务列表、创建、运行、取消、绑定 Profile、事件列表、任务级 SSE 流。
`TaskRuntimeService` 已经包含创建任务、Team Hub 任务导入、路由、审批、执行 Hermes run、取消任务、状态流转等逻辑。
数据库模型已经包含 `local_tasks`、`task_events`、`team_task_bindings`、`approvals`、`sync_outbox`、`audit_logs`。 

---

# 2. v1.3 目标

## 2.1 产品目标

v1.3 只做一件事：

```text
把 ai-copilot-serve 的任务运行时能力，接入 ai-os-desktop Electron Task Workbench。
```

实现后，Electron 内新增一个 Task Workbench 工作区：

```text
Task Workbench
├─ 新任务实时出现
├─ 任务列表筛选
├─ 任务详情查看
├─ 绑定 Profile
├─ 启动任务执行
├─ 取消任务
├─ Timeline 实时显示执行过程
├─ Approval 弹窗审批
└─ Team Hub 派发任务进入本地任务池
```

## 2.2 架构目标

```text
┌─────────────────────────────────────────────┐
│ ai-os-desktop / Electron                    │
│                                             │
│ Main Process                                │
│ ├─ 启动 / 检查 ai-copilot-serve              │
│ ├─ 维护 copilot-serve lifecycle              │
│ ├─ 提供 preload: baseUrl / token / status    │
│ └─ 不处理 task 业务逻辑                      │
│                                             │
│ Renderer React                              │
│ ├─ Task Workbench 页面                       │
│ ├─ TaskList                                 │
│ ├─ TaskDetail                               │
│ ├─ ExecutionTimeline                        │
│ ├─ ApprovalModal                            │
│ └─ HTTP / SSE 调用 ai-copilot-serve          │
└──────────────────────┬──────────────────────┘
                       │ 127.0.0.1:8765
                       ▼
┌─────────────────────────────────────────────┐
│ ai-copilot-serve                            │
│                                             │
│ FastAPI                                     │
│ ├─ /api/v1/tasks                             │
│ ├─ /api/v1/tasks/{id}/events/stream          │
│ ├─ /api/v1/approvals                         │
│ ├─ /api/v1/team-tasks                        │
│ └─ /api/v1/desktop/task-workbench            │
│                                             │
│ Services                                    │
│ ├─ TaskRuntimeService                        │
│ ├─ GatewaySupervisor                         │
│ ├─ ApprovalService                           │
│ ├─ WorkspaceGuard                            │
│ ├─ TeamTaskListener                          │
│ └─ RunEventBridge                            │
│                                             │
│ SQLite                                      │
│ ├─ local_tasks                               │
│ ├─ task_events                               │
│ ├─ approvals                                 │
│ ├─ team_task_bindings                        │
│ └─ sync_outbox                               │
└─────────────────────────────────────────────┘
```

---

# 3. Electron 原有安装 / 状态调用是否要变动

## 3.1 必须变动，但不能一次性删除旧能力

当前 Electron 已经有：

```text
window.hermesAPI
window.profileRuntime
window.profileEntry
window.aiosRuntime
```

这些 API 继续保留，避免破坏现有 Hermes 安装、Profile Runtime、AI-OS Workspace、Web Operator。

v1.3 新增：

```text
window.copilotServe
```

用途只限：

```ts
getConnection(): Promise<{ baseUrl: string; token: string | null }>
getStatus(): Promise<CopilotServeStatus>
start(): Promise<CopilotServeStatus>
stop(): Promise<CopilotServeStatus>
restart(): Promise<CopilotServeStatus>
getLogs(options?: { tail?: number }): Promise<string>
onStatusChanged(callback): () => void
```

**任务业务接口不放进 preload。**

Renderer React 直接通过 `baseUrl + token` 调用 `ai-copilot-serve` HTTP API。

## 3.2 原有 Hermes 安装 / 状态页面迁移规则

| 现有能力                               | v1.3 处理                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| Hermes 安装                          | 保留在 Settings / Hermes Runtime Manager                   |
| Profile Gateway 启停                 | 短期保留 `profileRuntime`；Task Workbench 只读取 serve API      |
| Gateway 状态                         | Task Workbench 通过 `GET /api/v1/profiles/{id}/status` 读取 |
| `window.hermesAPI.gatewayStatus()` | 保留兼容，不作为新页面数据源                                          |
| AIOS Runtime Snapshot              | 增加 `copilot-serve` 状态展示                                 |
| 新任务 / 执行 Timeline                  | 只走 `ai-copilot-serve`                                   |
| Approval                           | 只走 `ai-copilot-serve`                                   |

## 3.3 Runtime Status 变更

`src/shared/aios/aios-contract.ts` 当前 service id 只有：

```ts
"hermes-gateway" | "aios-backend" | "aios-frontend" | "postgres"
```

v1.3 增加：

```ts
"copilot-serve"
```

当前 AI-OS Runtime Supervisor 只 seed Hermes Gateway、AI-OS Backend、AI-OS Frontend。
v1.3 增加 `copilot-serve` 的 health 检查：

```text
GET http://127.0.0.1:8765/api/v1/health
```

---

# 4. v1.3 技术栈

## 4.1 Desktop

```text
Electron 39
electron-vite 5
React 19
TypeScript 5.9
Tailwind CSS 4
lucide-react
better-sqlite3
keytar
Vitest
```

当前 `package.json` 已锁定这些核心依赖。

## 4.2 Serve

```text
Python 3.12
FastAPI
Uvicorn
Pydantic v2
SQLAlchemy asyncio
SQLite / aiosqlite
Alembic
httpx
structlog
pytest
ruff
```

---

# 5. v1.3 项目结构

## 5.1 ai-os-desktop 新增 / 修改结构

```text
src/shared/copilot-serve/
├─ copilot-serve-contract.ts

src/main/copilot-serve/
├─ copilot-serve-paths.ts
├─ copilot-serve-process.ts
├─ copilot-serve-health.ts
├─ copilot-serve-ipc.ts
└─ copilot-serve-logs.ts

src/preload/
├─ copilot-serve-api.ts
└─ index.d.ts                  # 增加 window.copilotServe

src/renderer/src/lib/copilot-serve/
├─ http-client.ts
├─ task-client.ts
├─ approval-client.ts
├─ workbench-stream.ts
└─ types.ts

src/renderer/src/screens/TaskWorkbench/
├─ TaskWorkbenchScreen.tsx
├─ components/
│  ├─ TaskWorkbenchHeader.tsx
│  ├─ TaskList.tsx
│  ├─ TaskDetailPanel.tsx
│  ├─ ExecutionTimeline.tsx
│  ├─ ApprovalModal.tsx
│  ├─ ProfileBindingSelect.tsx
│  └─ EmptyState.tsx
├─ hooks/
│  ├─ useTaskList.ts
│  ├─ useTaskDetail.ts
│  ├─ useTaskTimelineStream.ts
│  ├─ useWorkbenchEventStream.ts
│  └─ usePendingApprovals.ts
└─ index.ts

src/shared/workspace/
├─ workspace-contract.ts       # 增加 task-workbench
└─ workspace-secondary-nav.ts  # 增加 task panels

src/renderer/src/workspace/
└─ workspace-registry.ts       # 注册 Task Workbench

src/renderer/src/components/workspace/
└─ WorkspaceRenderer.tsx       # 渲染 TaskWorkbenchScreen
```

## 5.2 ai-os-serve 新增 / 修改结构

当前 `pyproject.toml` 指向 `src/ai_copilot_serve` 包，但公开源码显示主文件在 `src/main.py`，且 `main.py` 通过 `ai_copilot_serve.main:app` 启动。 
v1.3 第一项必须统一 Python 包目录：

```text
src/ai_copilot_serve/
├─ __init__.py
├─ main.py
├─ app.py
├─ api/
├─ core/
├─ db/
├─ integrations/
├─ schemas/
└─ services/
```

新增 / 修改：

```text
src/ai_copilot_serve/api/v1/
├─ desktop_workbench.py        # 增加 global workbench SSE
├─ tasks.py                    # SSE 增加 payload / heartbeat / last_event_id
└─ approvals.py                # 保持 approve / reject

src/ai_copilot_serve/db/repositories/
└─ v12_repos.py                # 增加 list_events_after / list_recent_global_events

src/ai_copilot_serve/services/
├─ task_runtime.py             # create / ingest / run 状态写入 task_events
├─ team_task_listener.py       # 后台轮询 Team Hub
├─ run_event_bridge.py         # Hermes run events → task_events
└─ workbench_event_stream.py   # global workbench stream

src/ai_copilot_serve/core/
└─ lifecycle.py                # 注册后台 listener / outbox sync / event bridge

tests/api/
├─ test_task_workbench_stream.py
├─ test_task_events_stream.py
└─ test_approvals_api.py

tests/services/
├─ test_team_task_listener.py
└─ test_run_event_bridge.py
```

---

# 6. API 契约 v1.3

## 6.1 Desktop 获取连接信息

Electron preload：

```ts
export interface CopilotServeConnection {
  baseUrl: string;
  token: string | null;
}

export interface CopilotServeStatus {
  installed: boolean;
  running: boolean;
  healthy: boolean;
  pid: number | null;
  port: number;
  baseUrl: string;
  version?: string;
  lastError?: string | null;
}

export interface CopilotServeAPI {
  getConnection(): Promise<CopilotServeConnection>;
  getStatus(): Promise<CopilotServeStatus>;
  start(): Promise<CopilotServeStatus>;
  stop(): Promise<CopilotServeStatus>;
  restart(): Promise<CopilotServeStatus>;
  getLogs(options?: { tail?: number }): Promise<string>;
  onStatusChanged(callback: (status: CopilotServeStatus) => void): () => void;
}
```

`Window` 增加：

```ts
interface Window {
  copilotServe: CopilotServeAPI;
}
```

## 6.2 Task Workbench HTTP Client

```ts
const connection = await window.copilotServe.getConnection();

fetch(`${connection.baseUrl}/api/v1/tasks`, {
  headers: {
    "Content-Type": "application/json",
    ...(connection.token ? { "X-Copilot-Desktop-Token": connection.token } : {}),
  },
});
```

## 6.3 新增全局 Workbench Stream

新增：

```http
GET /api/v1/desktop/task-workbench/events/stream
```

返回：

```text
event: task_created
data: {"task_id":"...","status":"local_created","title":"..."}

event: task_updated
data: {"task_id":"...","status":"running"}

event: approval_created
data: {"approval_id":"...","task_id":"...","risk_level":"high"}

event: ping
data: {"ts":"2026-05-21T00:00:00Z"}
```

用途：

```text
1. 新任务实时进入 TaskList
2. 任务状态变化实时刷新
3. Approval 弹窗实时出现
4. Timeline 面板按 task_id 订阅细节流
```

## 6.4 任务 Timeline Stream

保留并增强现有接口：

```http
GET /api/v1/tasks/{task_id}/events/stream
```

现有 `tasks.py` 已经返回 `text/event-stream`。
v1.3 增强：

```json
{
  "id": "event_uuid",
  "task_id": "task_uuid",
  "run_id": "hermes_run_id",
  "event_type": "hermes_run_created",
  "message": "run_xxx",
  "event_payload": {},
  "created_at": "..."
}
```

必须增加：

```text
1. event_payload
2. heartbeat
3. Last-Event-ID 支持
4. 断线重连
5. 任务完成后保持 30 秒再结束流
```

---

# 7. Electron Task Workbench 页面设计

## 7.1 页面布局

```text
TaskWorkbenchScreen
├─ Header
│  ├─ Serve status
│  ├─ Team Hub pull button
│  ├─ Create local task button
│  └─ Refresh button
│
├─ Main Split Layout
│  ├─ Left: TaskList
│  │  ├─ status filter
│  │  ├─ source filter
│  │  ├─ profile filter
│  │  └─ task rows
│  │
│  ├─ Center: TaskDetailPanel
│  │  ├─ title / status / source
│  │  ├─ payload preview
│  │  ├─ target profile
│  │  ├─ bind profile
│  │  ├─ run / cancel
│  │  └─ result / error
│  │
│  └─ Right: ExecutionTimeline
│     ├─ task_created
│     ├─ routing
│     ├─ waiting_approval
│     ├─ approved
│     ├─ hermes_run_created
│     ├─ running
│     ├─ completed
│     └─ failed
│
└─ ApprovalModal
   ├─ risk level
   ├─ action type
   ├─ payload
   ├─ approve
   └─ reject
```

## 7.2 UI 状态映射

`TaskStatus` 当前已有：

```text
remote_assigned
local_created
waiting_approval
approved
running
need_human_input
completed
failed
cancelled
synced
```



UI 映射：

| status             | UI     |
| ------------------ | ------ |
| `local_created`    | 待路由    |
| `waiting_approval` | 等待审批   |
| `approved`         | 可执行    |
| `running`          | 执行中    |
| `need_human_input` | 需要人工输入 |
| `completed`        | 已完成    |
| `failed`           | 失败     |
| `cancelled`        | 已取消    |
| `synced`           | 已同步    |

---

# 8. Cursor 执行任务拆分

## 8.1 Cursor Task A — 修复 ai-copilot-serve 包目录

目标：

```text
让 README 中的启动命令稳定可执行：
uvicorn ai_copilot_serve.main:app --reload --host 127.0.0.1 --port 8765
```

执行：

```bash
mkdir -p src/ai_copilot_serve
git mv src/__init__.py src/ai_copilot_serve/__init__.py
git mv src/main.py src/ai_copilot_serve/main.py
git mv src/app.py src/ai_copilot_serve/app.py
git mv src/api src/ai_copilot_serve/api
git mv src/core src/ai_copilot_serve/core
git mv src/db src/ai_copilot_serve/db
git mv src/integrations src/ai_copilot_serve/integrations
git mv src/schemas src/ai_copilot_serve/schemas
git mv src/services src/ai_copilot_serve/services
```

验收：

```bash
pip install -e ".[dev]"
alembic upgrade head
uvicorn ai_copilot_serve.main:app --host 127.0.0.1 --port 8765
curl http://127.0.0.1:8765/api/v1/health
pytest
ruff check .
```

## 8.2 Cursor Task B — ai-copilot-serve 增强 Workbench Stream

修改：

```text
src/ai_copilot_serve/api/v1/desktop_workbench.py
src/ai_copilot_serve/services/workbench_event_stream.py
src/ai_copilot_serve/db/repositories/v12_repos.py
```

新增接口：

```http
GET /api/v1/desktop/task-workbench/events/stream
```

实现规则：

```text
1. 从 task_events 读取全局事件
2. 支持 last_event_id
3. 每 10 秒发送 ping
4. 客户端断开后停止循环
5. 返回 media_type="text/event-stream"
```

验收：

```bash
curl -N http://127.0.0.1:8765/api/v1/desktop/task-workbench/events/stream
```

## 8.3 Cursor Task C — task_runtime 补齐事件写入

修改：

```text
src/ai_copilot_serve/services/task_runtime.py
```

补齐事件：

```text
create_local_task       → task_created
ingest_assignment       → task_ingested
apply_routing           → routing
request_approval        → approval_requested
execute_run start       → task_running
Hermes run created      → hermes_run_created
mark_completed          → task_completed
mark_failed             → task_failed
cancel_task             → task_cancelled
```

当前 `TaskRuntimeService` 已有 `append_event()`，直接复用。

## 8.4 Cursor Task D — Electron Main 增加 copilot-serve lifecycle

新增：

```text
src/shared/copilot-serve/copilot-serve-contract.ts
src/main/copilot-serve/copilot-serve-process.ts
src/main/copilot-serve/copilot-serve-health.ts
src/main/copilot-serve/copilot-serve-ipc.ts
src/main/copilot-serve/copilot-serve-logs.ts
src/preload/copilot-serve-api.ts
```

实现：

```text
1. 启动 ai-copilot-serve
2. 健康检查 /api/v1/health
3. 记录 pid / port / baseUrl
4. windowsHide: true
5. 输出日志到 ~/.hermes/desktop/copilot-serve.log
6. preload 暴露 window.copilotServe
```

进程启动命令：

```ts
spawn(pythonOrUv, [
  "-m",
  "ai_copilot_serve.main",
], {
  cwd: serveInstallPath,
  env: {
    ...process.env,
    COPILOT_HOST: "127.0.0.1",
    COPILOT_PORT: "8765",
  },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});
```

## 8.5 Cursor Task E — Runtime Snapshot 增加 copilot-serve

修改：

```text
src/shared/aios/aios-contract.ts
src/main/aios/aios-runtime-supervisor.ts
```

增加：

```ts
export type AiOsServiceId =
  | "hermes-gateway"
  | "aios-backend"
  | "aios-frontend"
  | "postgres"
  | "copilot-serve";
```

health：

```text
http://127.0.0.1:8765/api/v1/health
```

## 8.6 Cursor Task F — Electron Renderer 增加 Task Workbench Workspace

修改：

```text
src/shared/workspace/workspace-contract.ts
src/shared/workspace/workspace-secondary-nav.ts
src/renderer/src/workspace/workspace-registry.ts
src/renderer/src/components/workspace/WorkspaceRenderer.tsx
```

新增 workspace：

```ts
{
  id: "task-workbench",
  titleKey: "navigation.taskWorkbench",
  kind: "react",
  closeable: false,
  draggable: false,
  persistable: true,
  source: "local",
}
```

渲染：

```tsx
if (module.id === "task-workbench") {
  return (
    <ReactWorkspace active={workspaceId === "task-workbench"}>
      <TaskWorkbenchScreen />
    </ReactWorkspace>
  );
}
```

## 8.7 Cursor Task G — Task Workbench 页面

新增：

```text
src/renderer/src/screens/TaskWorkbench/
```

实现 hooks：

```ts
useTaskList()
useTaskDetail(taskId)
useTaskTimelineStream(taskId)
useWorkbenchEventStream()
usePendingApprovals()
```

关键逻辑：

```text
1. 页面加载时读取 summary / tasks / pending approvals
2. 打开 global workbench stream
3. 有 task_created / task_updated 时刷新列表
4. 选中任务后打开 task events stream
5. waiting_approval 时弹出 ApprovalModal
6. approve 后重新 run task
7. completed / failed 后停止 task timeline stream
```

## 8.8 Cursor Task H — CORS / Local Token

`ai-copilot-serve` 增加本地 token 校验：

```text
COPILOT_DESKTOP_TOKEN=<random>
COPILOT_REQUIRE_TOKEN=true
```

请求头：

```http
X-Copilot-Desktop-Token: <token>
```

由于 `EventSource` 不能设置 header，Renderer 使用 `fetch + ReadableStream` 解析 SSE，不使用原生 `EventSource`。

---

# 9. 验收标准

## 9.1 Serve 验收

```bash
curl http://127.0.0.1:8765/api/v1/health
curl http://127.0.0.1:8765/api/v1/tasks
curl http://127.0.0.1:8765/api/v1/approvals/pending
curl http://127.0.0.1:8765/api/v1/desktop/task-workbench/summary
curl -N http://127.0.0.1:8765/api/v1/desktop/task-workbench/events/stream
```

通过条件：

```text
1. 服务可启动
2. migration 可执行
3. 创建任务后 task_events 有 task_created
4. run 后 task_events 有 hermes_run_created
5. Timeline SSE 能实时输出
6. Approval pending 能被 Electron 读取
7. approve / reject 后状态正确流转
8. pytest 全通过
```

## 9.2 Desktop 验收

```bash
npm run typecheck
npm run lint
npm run test
npm run dev
```

通过条件：

```text
1. Electron 启动后自动检查 ai-copilot-serve
2. Task Workbench 出现在 workspace
3. 新任务创建后列表刷新
4. Team Hub pull 后任务进入列表
5. 点击任务显示详情
6. Timeline 实时追加事件
7. Approval 弹窗可 approve / reject
8. 任务可 run / cancel
9. Electron Main 没有 task 业务逻辑
10. Renderer 不直接访问 Node API
```

---

# 10. v1.3 Cursor 执行顺序

```text
P0  ai-copilot-serve 包目录修复
P1  ai-copilot-serve workbench global stream
P2  ai-copilot-serve task event 补齐
P3  ai-os-desktop copilotServe lifecycle / preload
P4  ai-os-desktop Runtime Snapshot 增加 copilot-serve
P5  ai-os-desktop Workspace 注册 task-workbench
P6  ai-os-desktop Task Workbench 页面
P7  联调：create task → run → timeline → approval → completed
P8  Windows 10 验证：后台启动不弹 command 窗口
```

---

# 11. 最终边界

```text
Electron Main
只管本地服务生命周期，不管任务业务。

Electron Renderer
只管页面交互，调用 ai-copilot-serve API。

ai-copilot-serve
管理任务、Profile、Gateway、Team Hub、Approval、Workspace Guard、Timeline。

backend / frontend
不参与本地任务执行过程。
```

v1.3 不重构整个 Hermes 安装体系，只新增 `copilot-serve` 本地控制面接入，并把 Task Workbench 的数据源统一切到 `ai-copilot-serve`。

[1]: https://github.com/loudon84/ai-os-desktop "GitHub - loudon84/ai-os-desktop · GitHub"
[2]: https://github.com/loudon84/ai-os-serve "GitHub - loudon84/ai-os-serve · GitHub"
