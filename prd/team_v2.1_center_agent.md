# backend team_v2.1 完整方案：Hermes Service Center 单体后端

## 0. 代码依据

当前 `backend` 是 `@portal/server`，运行栈为 Node TypeScript + Express 5 + Drizzle ORM + PostgreSQL/S3/MinIO/Zod/Pino，继续沿用该栈实现单体服务，不切换到 Python 后端。`backend/src` 当前已有 `auth-provider`、`middleware`、`routes`、`services`、`storage`、`app.ts`、`config.ts` 等分层结构。

现有路由已包含 `auth.ts`、`documents.ts`、`email.ts`、`audit.ts`、`permissions.ts`、`users.ts`、`workspaces.ts`，`app.ts` 已按 `/api/v1` 挂载 API，并注入 Auth / RBAC / Documents / Email / Audit 等服务。

数据库 schema 当前已覆盖 `users`、`workspaces`、`memberships`、`roles`、`permissions`、`audit-events`、`documents`、`email-*` 等基础域，team_v2.1 在 `packages/db/src/schema` 下增量增加 Hermes Service Center、Team Task Hub、Profile、Skill、Plugin/MCP、Desktop Sync、Run Events 相关表。

Hermes WebUI 的核心模式是 HTTP 层包装 Hermes Agent 调用，通过 SSE 输出 token/tool/approval/done/error 等事件；backend team_v2.1 采用同类事件模型，但升级为多租户、RBAC、审计、任务状态聚合的服务端实现。

---

## 1. backend 新定位

```text
backend = AI-OS 服务器单体后端 + Hermes Service Center

职责：
- 业务数据中心：Auth / Workspace / RBAC / Documents / Email / Audit
- 团队协作中心：Team Task Hub / Task Assignment / Task Events / Audit Replay
- Hermes 服务中心：backend 自有 Hermes Agent Gateway 接入、Run、Run Events、Tool Facade、Context Builder
- 配置中心：Profile 配置、Desktop Bootstrap Config、copilot-serve 同步配置
- 资源中心：Skill Template Hub、Plugin / MCP Registry
- 状态中心：任务状态聚合、执行过程回放、审批记录、结果归档
```

边界：

```text
backend 管理自己的 Hermes Agent，不直接控制用户电脑上的 hermes-agent 进程。

backend 存储和注册用户端 copilot-serve / hermes-agent profile 元数据、能力、资源配置、同步状态。

用户端 hermes-agent Gateway 的启动、停止、日志、端口、健康检查由 copilot-serve 管理。

backend 不直接调用用户端本地 Hermes Gateway。

backend 与用户端的交互方式：
- copilot-serve 拉取 bootstrap config
- copilot-serve 拉取 assigned tasks
- copilot-serve 上报 task status / run events / result
- copilot-serve push / pull skills、tools、profile config
```

---

## 2. 总体架构

```text
frontend / copilot-desktop WebView
        │
        │ HTTPS / Bearer Token
        ▼
backend @portal/server
        │
        ├─ Auth / Workspace / RBAC
        ├─ Documents / Email / Audit
        ├─ Team Task Hub
        ├─ Hermes Service Center
        │    ├─ AI Chat API
        │    ├─ Agent Run
        │    ├─ Run Events
        │    ├─ Context Builder
        │    ├─ Prompt Template
        │    ├─ Tool Facade
        │    ├─ Hermes Gateway Router
        │    └─ Hermes Gateway Client
        ├─ Profile Config Center
        ├─ Skill Template Hub
        ├─ Plugin / MCP Registry
        ├─ Desktop Sync / Bootstrap Config
        └─ Task Aggregation / Replay
        │
        ├─ PostgreSQL / Drizzle
        ├─ S3 / MinIO
        └─ backend-owned Hermes Gateway
              ├─ Local mode: 同服务器进程 / 同容器网络
              └─ Remote mode: 后端自有远程 Hermes Gateway 节点

copilot-serve / user desktop
        │
        ├─ 本地 Hermes Gateway Supervisor
        ├─ 多 Profile Runtime
        ├─ Task Inbox
        ├─ Workspace Guard
        └─ Status Sync Client
```

---

## 3. Hermes Service Center 定义

### 3.1 backend 自己的 Hermes Agent

backend 自己的 Hermes Agent 是服务器侧智能接口执行器，不是用户电脑上的本地 agent。

```text
backend-owned hermes-agent
用途：
- 服务端 AI Chat
- 服务端任务理解与任务拆解
- Team Task Hub 任务编排
- Prompt Template 渲染后的执行
- Tool Facade 调用 backend 业务工具
- Skill Template 生成、校验、归档
- Plugin / MCP Registry 资源解释与匹配
- Documents / Email / Audit 上下文摘要
```

部署模式：

```text
Local Hermes Gateway
- 与 backend 部署在同一服务器或同一 docker compose 网络
- backend 通过 HERMES_GATEWAY_BASE_URL 调用
- 用于单机部署、开发、测试、私有化小规模部署

Remote Hermes Gateway
- backend 自有的远程 Hermes Gateway 节点
- 仍属于服务端基础设施
- 不等同于用户端 copilot-serve 的本地 Gateway
- 用于后续扩容、多模型、多租户隔离
```

### 3.2 智能接口服务中心模块

```text
AI Chat
- 前端对话入口
- 接收 user_message、workspace_id、context_refs、template_id
- 输出 run_id、stream events、final result

Agent Run
- 一次服务端 Hermes 执行记录
- 绑定 workspace、user、profile、prompt_template、gateway_instance
- 状态：queued / running / waiting_approval / succeeded / failed / cancelled

Run Events
- append-only 事件流
- 记录 token、tool_call、tool_result、approval、error、done
- 支持 SSE 实时输出与后续审计回放

Tool Call
- Hermes 调用 Tool Facade 的记录
- 不暴露数据库原始访问
- 所有写操作必须经过 RBAC、审批策略、audit_events

Context Builder
- 从 Workspace / Documents / Email / Task / Profile / Audit 中构造上下文包
- 统一裁剪权限
- 统一 token budget
- 统一引用 source_refs

Prompt Template
- 服务端 prompt 模板仓库
- 支持版本、变量、适用场景、权限范围
- 用于 Chat、Task、Skill、Plugin、Email、Document 等场景

Hermes Gateway Router
- 根据 workspace、run_type、model_policy、gateway health 选择 backend-owned gateway
- 不路由到用户本地 Gateway

Tool Facade
- 把 backend 业务服务封装成 Hermes 可调用工具
- 工具包括 documents、email、team_task、profile、skill_template、plugin_registry、audit_replay
```

---

## 4. Hermes Gateway 集成定义

### 4.1 Registry 类型拆分

```text
hermes_gateway_instances
- backend 自己可调用的 Hermes Gateway 实例
- 用于 backend server-side run
- base_url 可为 internal network / remote server URL
- 有 health、status、model_capabilities、owner_scope

client_agent_profiles
- 用户端 copilot-serve 上报的 Hermes Profile 元数据
- 用于任务分派、配置同步、能力发现
- 不保存可直接访问本地 Gateway 的调用地址
- 不由 backend 执行 start/stop/restart
```

### 4.2 Gateway Client

```text
HermesGatewayClient
- 封装 POST /v1/runs
- 封装 GET /v1/runs/{run_id}/events
- 封装健康检查
- 封装超时、重试、错误归一化
- 写入 hermes_runs / hermes_run_events
```

### 4.3 Gateway Router

```text
HermesGatewayRouter
输入：
- workspace_id
- user_id
- run_type
- required_tools
- model_policy
- tenant isolation rule

输出：
- gateway_instance_id
- base_url
- auth header
- timeout policy
```

路由规则：

```text
1. 优先选择 workspace 绑定的 server gateway。
2. 无绑定时选择 default server gateway。
3. gateway unhealthy 时切换到同 scope standby gateway。
4. 无可用 gateway 时 run 状态写入 failed，并生成 audit event。
5. 不选择 client_agent_profiles 中的用户端 profile。
```

---

## 5. 目录结构改造

保持现有 `routes + services + middleware + storage` 风格，增量增加目录，不做大规模重构。

```text
backend/src/
  routes/
    hermes.ts
    team-tasks.ts
    profiles.ts
    skill-templates.ts
    plugin-registry.ts
    desktop-sync.ts
    task-replay.ts

  services/
    hermes/
      hermes-gateway-client.ts
      hermes-gateway-router.ts
      hermes-run-service.ts
      hermes-event-service.ts
      context-builder.ts
      prompt-template-service.ts
      tool-facade-service.ts
      tools/
        document-tool.ts
        email-tool.ts
        team-task-tool.ts
        profile-tool.ts
        skill-template-tool.ts
        plugin-registry-tool.ts
        audit-replay-tool.ts

    team-task-hub/
      team-task-service.ts
      task-assignment-service.ts
      task-state-machine.ts
      task-event-service.ts
      task-result-service.ts

    profile-config/
      profile-config-service.ts
      profile-capability-service.ts
      profile-sync-service.ts

    skill-template/
      skill-template-service.ts
      skill-template-version-service.ts
      skill-template-publish-service.ts

    plugin-registry/
      plugin-registry-service.ts
      mcp-registry-service.ts
      plugin-install-policy-service.ts

    desktop-sync/
      desktop-registration-service.ts
      bootstrap-config-service.ts
      sync-state-service.ts

    task-replay/
      replay-query-service.ts
      replay-timeline-service.ts

  middleware/
    service-token.ts
    idempotency.ts
    workspace-scope.ts

packages/db/src/schema/
  hermes-gateways.ts
  hermes-runs.ts
  hermes-run-events.ts
  hermes-tool-calls.ts
  prompt-templates.ts
  team-tasks.ts
  team-task-events.ts
  team-task-results.ts
  profile-configs.ts
  profile-capabilities.ts
  client-agent-profiles.ts
  skill-templates.ts
  skill-template-versions.ts
  plugin-registry.ts
  mcp-registry.ts
  desktop-registrations.ts
  bootstrap-configs.ts
  sync-states.ts

packages/shared/src/
  types/
    hermes.ts
    team-tasks.ts
    profiles.ts
    skill-templates.ts
    plugin-registry.ts
    desktop-sync.ts
  validators/
    hermes.ts
    team-tasks.ts
    profiles.ts
    skill-templates.ts
    plugin-registry.ts
    desktop-sync.ts
  constants/
    hermes.ts
    task-status.ts
```

---

## 6. 数据模型

### 6.1 Hermes Gateway

```text
hermes_gateway_instances
- id
- workspace_id nullable
- name
- gateway_type: local | remote
- base_url
- auth_mode: none | bearer | service_token
- status: unknown | healthy | unhealthy | disabled
- model_capabilities_json
- tool_capabilities_json
- last_health_at
- created_at
- updated_at
```

### 6.2 Hermes Run

```text
hermes_runs
- id
- workspace_id
- user_id
- session_id nullable
- run_type: chat | team_task | document | email | skill | plugin
- gateway_instance_id
- prompt_template_id nullable
- status: queued | running | waiting_approval | succeeded | failed | cancelled
- input_json
- context_refs_json
- output_text nullable
- error_code nullable
- error_message nullable
- started_at
- finished_at
- created_at
- updated_at
```

### 6.3 Run Events

```text
hermes_run_events
- id
- run_id
- workspace_id
- seq
- event_type:
  run.created
  run.started
  message.delta
  reasoning.delta
  tool.call.created
  tool.call.completed
  approval.requested
  approval.resolved
  run.succeeded
  run.failed
  run.cancelled
- payload_json
- created_at
```

### 6.4 Tool Calls

```text
hermes_tool_calls
- id
- run_id
- workspace_id
- tool_name
- tool_action
- input_json
- output_json nullable
- status: pending | running | succeeded | failed | blocked
- risk_level: low | medium | high
- approval_required
- approved_by nullable
- approved_at nullable
- created_at
- updated_at
```

### 6.5 Team Task Hub

```text
team_tasks
- id
- workspace_id
- project_id nullable
- title
- description
- task_type
- source_user_id
- source_agent_id nullable
- assignee_user_id nullable
- assignee_agent_profile_id nullable
- target_profile_key nullable
- status:
  draft
  assigned
  accepted
  pending_approval
  running
  succeeded
  failed
  cancelled
  rejected
- priority
- due_at nullable
- context_refs_json
- acceptance_criteria_json
- created_at
- updated_at

team_task_events
- id
- task_id
- workspace_id
- seq
- event_type
- actor_type: user | agent | system | desktop
- actor_id
- payload_json
- created_at

team_task_results
- id
- task_id
- run_id nullable
- result_type: text | file | patch | link | artifact
- summary
- artifact_refs_json
- created_at
```

### 6.6 Profile 配置中心

```text
client_agent_profiles
- id
- workspace_id
- user_id
- device_id
- profile_id
- profile_name
- role_name
- runtime_type: hermes-local
- status: unknown | online | offline | disabled
- capabilities_json
- skill_refs_json
- tool_refs_json
- last_seen_at
- created_at
- updated_at

profile_configs
- id
- workspace_id
- profile_key
- display_name
- role_name
- config_version
- config_json
- soul_template_ref nullable
- memory_template_ref nullable
- enabled
- created_at
- updated_at

profile_capabilities
- id
- profile_config_id
- capability_key
- capability_type: skill | tool | model | mcp | task_type
- config_json
- enabled
```

### 6.7 Skill Template Hub

```text
skill_templates
- id
- workspace_id
- name
- slug
- category
- description
- owner_user_id
- visibility: private | workspace | public
- status: draft | published | archived
- latest_version_id nullable
- created_at
- updated_at

skill_template_versions
- id
- skill_template_id
- version
- source_markdown
- manifest_json
- required_tools_json
- required_models_json
- checksum
- published_by nullable
- published_at nullable
- created_at
```

### 6.8 Plugin / MCP Registry

```text
plugin_registry
- id
- workspace_id nullable
- name
- slug
- plugin_type: tool | connector | mcp_server
- description
- manifest_json
- install_policy_json
- status: active | disabled | deprecated
- created_at
- updated_at

mcp_registry
- id
- workspace_id nullable
- name
- server_key
- transport: stdio | http | sse
- endpoint nullable
- command nullable
- args_json nullable
- env_schema_json nullable
- tool_schema_json
- status
- created_at
- updated_at
```

### 6.9 Desktop Sync / Bootstrap

```text
desktop_registrations
- id
- workspace_id
- user_id
- device_id
- device_name
- os_name
- os_version
- copilot_desktop_version
- copilot_serve_version
- status: active | revoked
- last_seen_at
- created_at
- updated_at

bootstrap_configs
- id
- workspace_id
- user_id
- device_id nullable
- config_version
- config_json
- checksum
- active
- created_at
- updated_at

sync_states
- id
- workspace_id
- user_id
- device_id
- sync_type: profile | skill | plugin | task | bootstrap
- local_version
- remote_version
- status: pending | synced | conflict | failed
- last_sync_at
- payload_json
```

---

## 7. API 设计

### 7.1 Hermes Service Center

```text
POST /api/v1/hermes/chat
GET  /api/v1/hermes/runs
GET  /api/v1/hermes/runs/:run_id
GET  /api/v1/hermes/runs/:run_id/events
GET  /api/v1/hermes/runs/:run_id/stream
POST /api/v1/hermes/runs/:run_id/cancel

GET  /api/v1/hermes/gateways
POST /api/v1/hermes/gateways
PATCH /api/v1/hermes/gateways/:gateway_id
POST /api/v1/hermes/gateways/:gateway_id/health-check

GET  /api/v1/hermes/prompt-templates
POST /api/v1/hermes/prompt-templates
PATCH /api/v1/hermes/prompt-templates/:template_id
POST /api/v1/hermes/prompt-templates/:template_id/render

POST /api/v1/hermes/tool-calls/:tool_call_id/approve
POST /api/v1/hermes/tool-calls/:tool_call_id/reject
```

### 7.2 Team Task Hub

```text
GET  /api/v1/team-tasks
POST /api/v1/team-tasks
GET  /api/v1/team-tasks/:task_id
PATCH /api/v1/team-tasks/:task_id
POST /api/v1/team-tasks/:task_id/assign
POST /api/v1/team-tasks/:task_id/accept
POST /api/v1/team-tasks/:task_id/reject
POST /api/v1/team-tasks/:task_id/start
POST /api/v1/team-tasks/:task_id/cancel
GET  /api/v1/team-tasks/:task_id/events
GET  /api/v1/team-tasks/:task_id/replay
POST /api/v1/team-tasks/:task_id/result
```

### 7.3 copilot-serve 同步接口

```text
POST /api/v1/desktop/register
POST /api/v1/desktop/heartbeat
GET  /api/v1/desktop/bootstrap
POST /api/v1/desktop/sync/profile
POST /api/v1/desktop/sync/skills
POST /api/v1/desktop/sync/plugins
GET  /api/v1/desktop/tasks/assigned
POST /api/v1/desktop/tasks/:task_id/ack
POST /api/v1/desktop/tasks/:task_id/status
POST /api/v1/desktop/tasks/:task_id/events
POST /api/v1/desktop/tasks/:task_id/result
```

### 7.4 Profile 配置中心

```text
GET  /api/v1/profiles
POST /api/v1/profiles
GET  /api/v1/profiles/:profile_id
PATCH /api/v1/profiles/:profile_id
GET  /api/v1/profiles/:profile_id/capabilities
POST /api/v1/profiles/:profile_id/capabilities
GET  /api/v1/profiles/client-agents
POST /api/v1/profiles/client-agents/report
```

### 7.5 Skill Template Hub

```text
GET  /api/v1/skill-templates
POST /api/v1/skill-templates
GET  /api/v1/skill-templates/:template_id
PATCH /api/v1/skill-templates/:template_id
POST /api/v1/skill-templates/:template_id/versions
POST /api/v1/skill-templates/:template_id/publish
POST /api/v1/skill-templates/:template_id/archive
```

### 7.6 Plugin / MCP Registry

```text
GET  /api/v1/plugin-registry
POST /api/v1/plugin-registry
GET  /api/v1/plugin-registry/:plugin_id
PATCH /api/v1/plugin-registry/:plugin_id

GET  /api/v1/mcp-registry
POST /api/v1/mcp-registry
GET  /api/v1/mcp-registry/:mcp_id
PATCH /api/v1/mcp-registry/:mcp_id
POST /api/v1/mcp-registry/:mcp_id/validate
```

---

## 8. Run Events SSE 契约

```text
GET /api/v1/hermes/runs/:run_id/stream
```

事件类型：

```text
run.created
run.started
message.delta
reasoning.delta
tool.call.created
tool.call.completed
approval.requested
approval.resolved
run.succeeded
run.failed
run.cancelled
stream.end
```

事件格式：

```json
{
  "event_id": "evt_...",
  "run_id": "run_...",
  "seq": 12,
  "event_type": "message.delta",
  "payload": {
    "text": "..."
  },
  "created_at": "2026-05-24T10:00:00.000Z"
}
```

落库规则：

```text
- 所有事件先写入 hermes_run_events，再向 SSE 连接推送。
- SSE 断线后，前端按 last_event_seq 续拉。
- run.succeeded / run.failed / run.cancelled 后输出 stream.end。
- Tool Call、Approval、Audit 同步生成对应表记录。
```

---

## 9. Tool Facade

### 9.1 工具边界

```text
Tool Facade 只暴露业务动作，不暴露数据库原始查询。

允许：
- document.search
- document.read
- document.create_draft
- document.update_draft
- email.search
- email.read_thread
- email.create_draft
- team_task.create
- team_task.update_status
- profile.get_config
- skill_template.search
- skill_template.create_draft
- plugin_registry.search
- audit_replay.query

默认禁止：
- email.send_direct
- document.delete
- workspace.delete
- role_permission.change
- plugin.install_direct
- mcp.enable_direct
```

### 9.2 审批策略

```text
low risk
- search / read / list
- 自动执行
- 写 run events 和 audit_events

medium risk
- draft / update non-critical metadata
- 根据 workspace policy 决定是否审批

high risk
- send email
- delete file
- publish skill
- enable plugin / MCP
- assign task to another user
- change RBAC
- 必须 approval.requested
```

---

## 10. Context Builder

输入：

```json
{
  "workspace_id": "ws_...",
  "user_id": "user_...",
  "run_type": "team_task",
  "task_id": "task_...",
  "context_refs": [
    { "type": "document", "id": "doc_..." },
    { "type": "email_thread", "id": "thread_..." },
    { "type": "skill_template", "id": "skill_..." }
  ],
  "token_budget": 12000
}
```

输出：

```json
{
  "workspace": {},
  "user": {},
  "task": {},
  "documents": [],
  "emails": [],
  "profiles": [],
  "skills": [],
  "plugins": [],
  "audit_summary": [],
  "source_refs": []
}
```

规则：

```text
1. 所有 context_refs 必须先经过 workspace membership 校验。
2. 数据权限在 API 层裁剪。
3. Email 正文、Document 内容按 token_budget 裁剪。
4. 输出 source_refs，供结果回放和引用追踪。
5. 不把用户端本地文件路径直接注入 backend Hermes Run，除非该路径来自已注册 workspace policy。
```

---

## 11. Prompt Template

模板类型：

```text
chat.default
team_task.dispatch
team_task.review
document.summarize
document.generate
email.reply_draft
skill_template.generate
plugin_registry.evaluate
audit_replay.summarize
```

模板变量：

```text
{{workspace}}
{{user}}
{{task}}
{{context}}
{{source_refs}}
{{acceptance_criteria}}
{{tool_policy}}
{{output_contract}}
```

版本策略：

```text
- prompt_templates 保存模板主记录。
- prompt_template_versions 保存版本正文。
- Run 绑定 prompt_template_id 和 version_id。
- 已执行 Run 不受模板后续修改影响。
```

---

## 12. Team Task Hub 状态机

```text
draft
  -> assigned
  -> accepted
  -> pending_approval
  -> running
  -> succeeded

assigned
  -> rejected
  -> cancelled

running
  -> failed
  -> cancelled
  -> succeeded

failed
  -> assigned
  -> cancelled
```

事件：

```text
TASK_CREATED
TASK_ASSIGNED
TASK_ACCEPTED
TASK_REJECTED
TASK_APPROVAL_REQUESTED
TASK_APPROVED
TASK_STARTED
TASK_RUN_EVENT
TASK_FAILED
TASK_SUCCEEDED
TASK_CANCELLED
TASK_RESULT_SUBMITTED
TASK_REPLAY_REQUESTED
```

桌面端任务分派：

```text
backend 创建 team_task
        │
        ▼
copilot-serve GET /desktop/tasks/assigned
        │
        ▼
copilot-serve 写入本地 task_inbox
        │
        ▼
用户审批 / 本地 Gateway 执行
        │
        ▼
copilot-serve POST /desktop/tasks/:id/status
        │
        ▼
backend 聚合 task_events / audit_events / replay timeline
```

---

## 13. Desktop Bootstrap Config

返回结构：

```json
{
  "workspace_id": "ws_...",
  "user_id": "user_...",
  "device_id": "dev_...",
  "config_version": 12,
  "backend": {
    "base_url": "https://server.example.com",
    "api_prefix": "/api/v1"
  },
  "desktop_sync": {
    "heartbeat_interval_sec": 30,
    "task_poll_interval_sec": 10,
    "profile_sync_interval_sec": 300
  },
  "profiles": [],
  "skills": [],
  "plugins": [],
  "mcp_servers": [],
  "workspace_policies": [],
  "feature_flags": {
    "team_task_hub": true,
    "skill_template_hub": true,
    "plugin_registry": true
  }
}
```

安全规则：

```text
- bootstrap 必须使用用户 Bearer Token。
- device_id 首次注册后绑定 user_id + workspace_id。
- service token 只下发给 copilot-serve 本地服务，不暴露给 renderer。
- revoked device 无法拉取 bootstrap。
```

---

## 14. backend/README.md 目标内容

将以下内容写入 `backend/README.md` 的开头。

```md
# AI-OS Backend — Hermes Service Center

版本：team_v2.1

## 定位

backend 是 AI-OS 的服务器单体后端，负责业务 API、团队任务中心、Hermes Service Center、配置同步、资源注册、审计与回放。

backend 不是普通 CRUD API 层，也不是用户端 hermes-agent 的进程管理器。

## 核心职责

- Auth / Workspace / RBAC
- Documents / Email / Audit
- Team Task Hub
- Hermes Service Center
- Profile 配置中心
- Skill Template Hub
- Plugin / MCP Registry
- Desktop Sync / Bootstrap Config
- 任务状态聚合与审计回放

## Hermes 集成边界

backend 只集成 backend 自己的 Hermes Agent Gateway。

backend 不直接调用用户端 copilot-serve 管理的本地 Hermes Gateway。

用户端 Hermes Profile 通过 copilot-serve 向 backend 注册元数据、能力、技能、工具和同步状态。

backend 向用户端分派任务，copilot-serve 拉取任务、本地执行、回传状态与结果。

## 单体服务结构

- routes：HTTP API 薄壳
- services：业务服务与编排
- middleware：认证、权限、幂等、服务令牌、workspace scope
- storage：对象存储
- packages/db：Drizzle schema 与 migrations
- packages/shared：前后端共享类型、常量、Zod validators

## Hermes Service Center 模块

- AI Chat
- Agent Run
- Run Events
- Tool Call
- Context Builder
- Prompt Template
- Hermes Gateway Router
- Hermes Gateway Client
- Tool Facade

## Team Task Hub 模块

- task create / assign / accept / reject / start / cancel
- task events
- task result
- task replay
- desktop assigned task polling
- desktop status sync

## Desktop Sync 模块

- desktop registration
- heartbeat
- bootstrap config
- profile sync
- skill sync
- plugin sync
- task sync

## 开发约束

- 后端响应字段使用 snake_case
- API schema 必须同步 packages/shared
- DB 变更必须通过 packages/db schema + migration
- 不修改废弃 ai-os-api
- 不在 backend 中启动或停止用户电脑上的 Hermes Gateway
- 高风险 Tool Call 必须进入 approval + audit_events
```

---

## 15. Cursor 实施顺序

```text
1. 更新 backend/README.md
   - 写入 team_v2.1 新定位
   - 明确 backend-owned Hermes Agent 与用户端 Hermes Gateway 边界

2. 增加 packages/shared 契约
   - constants/hermes.ts
   - constants/task-status.ts
   - types/hermes.ts
   - types/team-tasks.ts
   - types/profiles.ts
   - types/skill-templates.ts
   - types/plugin-registry.ts
   - types/desktop-sync.ts
   - validators 对应补齐

3. 增加 packages/db schema
   - hermes-gateways.ts
   - hermes-runs.ts
   - hermes-run-events.ts
   - hermes-tool-calls.ts
   - prompt-templates.ts
   - team-tasks.ts
   - team-task-events.ts
   - team-task-results.ts
   - profile-configs.ts
   - profile-capabilities.ts
   - client-agent-profiles.ts
   - skill-templates.ts
   - skill-template-versions.ts
   - plugin-registry.ts
   - mcp-registry.ts
   - desktop-registrations.ts
   - bootstrap-configs.ts
   - sync-states.ts
   - 更新 schema/index.ts

4. 生成 migration
   - pnpm db:generate
   - 提交生成 SQL

5. 增加 Hermes services
   - hermes-gateway-client.ts
   - hermes-gateway-router.ts
   - hermes-run-service.ts
   - hermes-event-service.ts
   - context-builder.ts
   - prompt-template-service.ts
   - tool-facade-service.ts
   - tools/*

6. 增加 Team Task services
   - team-task-service.ts
   - task-assignment-service.ts
   - task-state-machine.ts
   - task-event-service.ts
   - task-result-service.ts

7. 增加 Profile / Skill / Plugin / Desktop Sync services
   - profile-config/*
   - skill-template/*
   - plugin-registry/*
   - desktop-sync/*
   - task-replay/*

8. 增加 routes
   - hermes.ts
   - team-tasks.ts
   - profiles.ts
   - skill-templates.ts
   - plugin-registry.ts
   - desktop-sync.ts
   - task-replay.ts

9. 修改 backend/src/app.ts
   - 注入新增 services
   - 挂载新增 routes
   - 保持 /api/v1 前缀
   - 不破坏现有 auth/documents/email/audit/workspaces 路由

10. 增加 middleware
   - service-token.ts
   - idempotency.ts
   - workspace-scope.ts

11. 增加 tests
   - hermes gateway router
   - hermes run events
   - context builder permission trim
   - team task state machine
   - desktop registration + bootstrap
   - skill template versioning
   - plugin registry validation
   - task replay timeline

12. 执行校验
   - pnpm --filter @portal/server typecheck
   - pnpm --filter @portal/server test
   - pnpm build
```

---

## 16. 验收标准

```text
[ ] backend/README.md 已写入 team_v2.1 新定位。
[ ] backend 明确只集成 backend-owned Hermes Gateway。
[ ] 用户端 Hermes Profile 只作为 client_agent_profiles 注册，不被 backend 直接调用。
[ ] /api/v1/hermes/chat 能创建 hermes_runs。
[ ] /api/v1/hermes/runs/:id/stream 能输出 SSE events。
[ ] Run Events 全量落库，可断线后补拉。
[ ] Tool Call 全量落库，高风险操作进入 approval。
[ ] Context Builder 按 Workspace / RBAC 裁剪数据。
[ ] Team Task Hub 支持 create / assign / accept / start / status / result。
[ ] copilot-serve 可通过 /desktop/bootstrap 拉取配置。
[ ] copilot-serve 可通过 /desktop/tasks/assigned 拉取任务。
[ ] copilot-serve 可回传 task status / events / result。
[ ] Skill Template 支持 draft / version / publish。
[ ] Plugin / MCP Registry 支持注册、查询、启停策略。
[ ] Task Replay 能按 task_id 聚合 task_events + hermes_run_events + audit_events。
[ ] 所有新增 API 有 packages/shared validators。
[ ] 所有新增表进入 packages/db schema 与 migration。
[ ] 现有 Auth / Workspace / RBAC / Documents / Email / Audit 路由保持可用。
```

---

## 17. Cursor 执行提示词

```text
任务：实现 backend team_v2.1 Hermes Service Center 单体后端方案。

代码仓库：loudon84/ai-os-full
目标目录：
- backend/
- packages/db/
- packages/shared/

硬性约束：
- 使用现有 Node TypeScript + Express + Drizzle 架构。
- 不引入 Python backend。
- 不修改 ai-os-api。
- 不重构 frontend。
- 不修改 copilot-desktop / copilot-serve。
- backend 只集成 backend 自己的 Hermes Gateway。
- backend 不直接调用用户端本地 Hermes Gateway。
- 所有 API 响应字段保持 snake_case。
- 所有新增 API 契约必须同步 packages/shared。
- 所有 DB 变更必须通过 packages/db schema 和 migration。
- 高风险 Tool Call 必须 approval + audit_events。
- 任务状态必须通过 append-only events 支持 replay。

实施范围：
1. 更新 backend/README.md，写入 team_v2.1 定位。
2. 增加 Hermes Service Center 数据表、类型、validators、services、routes。
3. 增加 Team Task Hub 数据表、类型、validators、services、routes。
4. 增加 Profile 配置中心、Skill Template Hub、Plugin/MCP Registry、Desktop Sync。
5. 修改 backend/src/app.ts 注入并挂载新 routes。
6. 增加单元测试和基础集成测试。
7. 通过 typecheck、test、build。

完成标准：
- pnpm --filter @portal/server typecheck 通过
- pnpm --filter @portal/server test 通过
- pnpm build 通过
- README、shared、db、backend routes/services 全部同步
```
