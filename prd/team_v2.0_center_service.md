# ai-os-full/backend 单体服务优化架构方案

版本：**team_v2.1**
目标路径：`ai-os-full/backend`
服务定位：`@portal/server`
技术基线：Express 5 + TypeScript + Drizzle ORM + PostgreSQL + S3/MinIO + Zod + Pino
架构形态：**模块化单体服务**

依据范围：backend 当前定位为云端/服务器业务 API，承担认证、权限、业务数据、桌面端配置下发、Team Task Hub，不管理本地 Hermes 进程；本地进程由 `copilot-serve` / HermesLocalService 管理。 现有目录约束要求后端业务逻辑落在 `backend/src/services/<domain>/`，路由薄壳落在 `backend/src/routes/<domain>.ts`，共享契约放入 `packages/shared/src/`，Drizzle schema 与 migration 放入 `packages/db/src/`。 Team Task Hub 与 ai-os-desktop 的集成边界为任务分派、领取、状态同步、结果回传、审计回放。

---

## 1. backend 新定位

### 1.1 产品定位

`backend` 定义为 **ai-os-full 的服务器端业务 API 与 Hermes Service Center 控制面**。

核心职责：

```txt
Auth / Workspace / RBAC
Documents / Email / Audit
Team Task Hub
Hermes Service Center
Profile 配置中心
Skill Template Hub
Plugin / MCP Registry
Desktop Sync / Bootstrap Config
任务状态聚合与审计回放
```

### 1.2 职责边界

#### backend 负责

```txt
1. 用户认证、Token、Session、Refresh Token。
2. Workspace 多租户、成员、角色、权限。
3. Documents / Email / Audit 等业务 API。
4. Team Task Hub：任务创建、分派、领取、状态同步、结果回传。
5. Hermes Service Center：Profile、Skill、Plugin、MCP、Desktop Sync 管理。
6. Profile 配置中心：保存云端 profile manifest、模型配置、工具开关、策略配置。
7. Skill Template Hub：保存 skill 模板、版本、发布状态、安装记录。
8. Plugin / MCP Registry：保存 MCP Server、MCP Tool、Plugin manifest。
9. Desktop Bootstrap：给 copilot-desktop / copilot-serve 下发启动配置。
10. 任务状态聚合：汇总本地执行状态、运行事件、结果摘要、失败原因。
11. 审计回放：记录任务、配置、权限、Profile、Skill、MCP 相关事件。
```

#### backend 不负责

```txt
1. 不启动本地 Hermes Gateway。
2. 不管理本地 PID / 端口 / gateway log。
3. 不直接访问用户电脑文件系统。
4. 不执行 terminal / git / code write。
5. 不替代 copilot-serve / HermesLocalService。
6. 不在服务端保存用户本机 profile runtime sqlite。
7. 不直接调用本地 127.0.0.1 Hermes Gateway。
8. 不绕过 copilot-serve 执行本地任务。
```

---

## 2. 总体架构

```txt
ai-os-full/backend
│
├─ Core Platform Layer
│  ├─ config
│  ├─ logger
│  ├─ error-handler
│  ├─ request-context
│  ├─ auth middleware
│  ├─ rbac middleware
│  └─ audit middleware
│
├─ Business Domain Layer
│  ├─ auth
│  ├─ workspaces
│  ├─ rbac
│  ├─ users
│  ├─ documents
│  ├─ email
│  └─ audit
│
├─ Team Collaboration Layer
│  ├─ team-tasks
│  ├─ task-events
│  ├─ task-results
│  ├─ task-assignment
│  └─ audit-replay
│
├─ Hermes Service Center Layer
│  ├─ profile-center
│  ├─ skill-template-hub
│  ├─ plugin-registry
│  ├─ mcp-registry
│  ├─ desktop-sync
│  └─ connector-webhooks
│
├─ Integration Layer
│  ├─ s3 / minio
│  ├─ email providers
│  ├─ copilot-serve client
│  ├─ hermes manifest adapter
│  ├─ webhook adapter
│  └─ mcp adapter
│
└─ Data Layer
   ├─ packages/db schema
   ├─ repositories
   ├─ migrations
   └─ transaction boundary
```

---

## 3. 目标目录结构

### 3.1 第一阶段保持现有结构，新增模块化目录

```txt
backend/src/
├── index.ts
├── app.ts
├── config.ts
├── routes/
│   ├── auth.ts
│   ├── users.ts
│   ├── workspaces.ts
│   ├── permissions.ts
│   ├── documents.ts
│   ├── email.ts
│   ├── audit.ts
│   ├── team-tasks.ts
│   ├── service-center-profiles.ts
│   ├── service-center-skills.ts
│   ├── service-center-plugins.ts
│   ├── service-center-mcp.ts
│   └── desktop-sync.ts
│
├── services/
│   ├── auth/
│   ├── rbac/
│   ├── users/
│   ├── documents/
│   ├── email/
│   ├── audit/
│   ├── team-tasks/
│   └── service-center/
│       ├── profiles/
│       ├── skills/
│       ├── plugins/
│       ├── mcp/
│       ├── desktop-sync/
│       └── connectors/
│
├── repositories/
│   ├── team-task.repository.ts
│   ├── service-center-profile.repository.ts
│   ├── skill-template.repository.ts
│   ├── plugin-manifest.repository.ts
│   ├── mcp-registry.repository.ts
│   └── desktop-client.repository.ts
│
├── integrations/
│   ├── s3/
│   ├── mail/
│   ├── copilot-serve/
│   ├── hermes/
│   ├── mcp/
│   └── webhooks/
│
├── middleware/
│   ├── auth-v2.ts
│   ├── rbac.ts
│   ├── audit-logger.ts
│   ├── error-handler.ts
│   ├── request-context.ts
│   └── validate-body.ts
│
├── events/
│   ├── domain-event.ts
│   ├── event-bus.ts
│   ├── audit-event.publisher.ts
│   ├── task-event.publisher.ts
│   └── index.ts
│
└── jobs/
    ├── desktop-heartbeat-cleanup.job.ts
    ├── task-timeout-scan.job.ts
    ├── task-status-retry.job.ts
    └── audit-retention.job.ts
```

### 3.2 第二阶段迁移到标准模块结构

```txt
backend/src/modules/
├── auth/
├── workspaces/
├── rbac/
├── users/
├── documents/
├── email/
├── audit/
├── team-tasks/
└── service-center/
    ├── profiles/
    ├── skills/
    ├── plugins/
    ├── mcp/
    ├── desktop-sync/
    └── connectors/
```

每个模块固定结构：

```txt
<module>/
├── <module>.routes.ts
├── <module>.service.ts
├── <module>.repository.ts
├── <module>.policy.ts
├── <module>.events.ts
├── <module>.types.ts
├── <module>.validators.ts
└── index.ts
```

---

## 4. 分层规则

### 4.1 Route 层

职责：

```txt
1. 注册 HTTP 路由。
2. 读取 request params / query / body。
3. 调用 Zod validator。
4. 调用 service。
5. 返回统一响应。
```

禁止：

```txt
1. Route 不直接写 SQL。
2. Route 不直接访问 Drizzle table。
3. Route 不直接访问 S3 / SMTP / IMAP / Hermes Gateway。
4. Route 不写业务状态机。
5. Route 不写权限判断细节。
```

### 4.2 Service 层

职责：

```txt
1. 业务编排。
2. 权限校验调用。
3. 状态机流转。
4. Repository 调用。
5. 外部 Integration 调用。
6. Audit Event 写入。
7. Domain Event 发布。
8. 事务边界控制。
```

### 4.3 Repository 层

职责：

```txt
1. Drizzle 查询。
2. Drizzle insert / update / delete。
3. 事务内数据访问。
4. 查询条件拼装。
5. 分页查询。
```

禁止：

```txt
1. Repository 不做 RBAC 判断。
2. Repository 不做任务状态流转。
3. Repository 不调用外部 API。
4. Repository 不写 audit。
```

### 4.4 Policy 层

职责：

```txt
1. Workspace 访问判断。
2. RBAC 权限判断。
3. 资源所有权判断。
4. 任务操作权限判断。
5. Profile / Skill / MCP 安装权限判断。
```

### 4.5 Event 层

职责：

```txt
1. 任务事件。
2. 审计事件。
3. 配置变更事件。
4. Skill 发布事件。
5. MCP 注册变更事件。
6. Desktop heartbeat 事件。
```

---

## 5. 核心模块设计

## 5.1 Auth / Workspace / RBAC

### 5.1.1 Auth

职责：

```txt
1. 用户注册。
2. 用户登录。
3. Access Token 签发。
4. Refresh Token 轮换。
5. Logout。
6. 登录失败锁定。
7. Token 黑名单或版本控制。
```

API：

```txt
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/session
```

核心 Service：

```txt
AuthService
TokenService
LoginLockoutService
PasswordService
SessionService
```

### 5.1.2 Workspace

职责：

```txt
1. Workspace 创建。
2. Workspace 成员管理。
3. Workspace 默认角色绑定。
4. Workspace 下 Profile / Skill / Task / MCP 多租户隔离。
```

API：

```txt
GET    /api/v1/workspaces
POST   /api/v1/workspaces
GET    /api/v1/workspaces/:workspace_id
PATCH  /api/v1/workspaces/:workspace_id
DELETE /api/v1/workspaces/:workspace_id

GET    /api/v1/workspaces/:workspace_id/members
POST   /api/v1/workspaces/:workspace_id/members
PATCH  /api/v1/workspaces/:workspace_id/members/:member_id
DELETE /api/v1/workspaces/:workspace_id/members/:member_id
```

### 5.1.3 RBAC

职责：

```txt
1. Role 管理。
2. Permission 管理。
3. Role-Permission 绑定。
4. 用户在 Workspace 内的角色判断。
5. API 级权限拦截。
6. Service 级资源权限判断。
```

权限命名：

```txt
workspace:read
workspace:manage
user:read
user:manage
document:read
document:write
email:read
email:write
team_task:read
team_task:create
team_task:assign
team_task:approve
team_task:execute
team_task:cancel
profile:read
profile:write
skill:read
skill:write
skill:publish
plugin:read
plugin:write
mcp:read
mcp:write
desktop:bootstrap
audit:read
```

---

## 5.2 Documents

职责：

```txt
1. 文档元数据管理。
2. 文档版本管理。
3. 文档快照管理。
4. 文档权限判断。
5. S3/MinIO 对象存储。
6. 文档事件记录。
7. 文档与 Team Task 的上下文引用。
```

API：

```txt
GET    /api/v1/documents
POST   /api/v1/documents
GET    /api/v1/documents/:document_id
PATCH  /api/v1/documents/:document_id
DELETE /api/v1/documents/:document_id

GET    /api/v1/documents/:document_id/versions
POST   /api/v1/documents/:document_id/versions
GET    /api/v1/documents/:document_id/snapshot
PUT    /api/v1/documents/:document_id/snapshot
```

Service：

```txt
DocumentService
DocumentVersionService
DocumentPermissionService
DocumentSnapshotService
DocumentEventService
```

---

## 5.3 Email

职责：

```txt
1. 邮箱账号管理。
2. 邮件文件夹管理。
3. 邮件同步。
4. 邮件消息读取。
5. 附件存储。
6. SMTP 发信。
7. 邮件凭证加密。
8. 邮件与 Team Task 的上下文引用。
```

API：

```txt
GET    /api/v1/email/accounts
POST   /api/v1/email/accounts
PATCH  /api/v1/email/accounts/:account_id
DELETE /api/v1/email/accounts/:account_id

GET    /api/v1/email/folders
GET    /api/v1/email/messages
GET    /api/v1/email/messages/:message_id
POST   /api/v1/email/messages/:message_id/sync
POST   /api/v1/email/send
GET    /api/v1/email/attachments/:attachment_id
```

Service：

```txt
EmailAccountService
EmailSyncService
EmailMessageService
EmailAttachmentService
EmailSmtpService
EmailCredentialService
```

---

## 5.4 Audit

职责：

```txt
1. 用户操作审计。
2. Workspace 级审计。
3. Team Task 事件审计。
4. Profile 配置审计。
5. Skill 发布审计。
6. MCP Tool 注册审计。
7. Desktop Sync 审计。
8. 审计回放数据源。
```

API：

```txt
GET /api/v1/audit/events
GET /api/v1/audit/events/:event_id
GET /api/v1/audit/replay/team-tasks/:task_id
GET /api/v1/audit/replay/profiles/:profile_id
```

审计事件格式：

```ts
type AuditEvent = {
  id: string
  workspace_id: string
  actor_user_id: string | null
  actor_agent_id: string | null
  action: string
  target_type: string
  target_id: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  before_json?: unknown
  after_json?: unknown
  metadata_json?: unknown
  created_at: string
}
```

---

# 6. Team Task Hub

## 6.1 模块定位

`Team Task Hub` 是 ai-os-full 的团队任务中心。

职责：

```txt
1. 接收任务创建。
2. 支持人工创建任务。
3. 支持 Agent / webhook / connector 创建任务。
4. 支持任务分派到用户、desktop client、agent profile。
5. 支持 copilot-serve 拉取 assigned tasks。
6. 支持任务 ack / status / result 回传。
7. 支持任务事件流。
8. 支持任务超时、取消、失败、重试。
9. 支持任务审计回放。
```

## 6.2 状态机

```txt
draft
  -> created
  -> assigned
  -> acknowledged
  -> pending_approval
  -> approved
  -> running
  -> succeeded

created
  -> cancelled

assigned
  -> rejected
  -> cancelled
  -> expired

acknowledged
  -> pending_approval
  -> running

pending_approval
  -> approved
  -> rejected

approved
  -> running

running
  -> succeeded
  -> failed
  -> cancelled

failed
  -> retrying
  -> assigned
```

终态：

```txt
succeeded
failed
cancelled
rejected
expired
```

## 6.3 任务类型

```txt
content_generation
code_change
code_review
document_edit
email_draft
research
finance_analysis
sales_analysis
hr_screening
plugin_install
skill_install
mcp_tool_call
deployment
custom
```

## 6.4 任务风险级别

```txt
low:
- 只读查询
- 内容生成
- 草稿生成

medium:
- 文档编辑
- 邮件草稿
- 数据分析

high:
- 代码写入
- Git commit
- 批量邮件发送
- 外部系统写入

critical:
- Git push
- 部署发布
- 删除文件
- 删除数据
- 生产系统写入
```

## 6.5 API

```txt
POST   /api/v1/team/tasks
GET    /api/v1/team/tasks
GET    /api/v1/team/tasks/:task_id
PATCH  /api/v1/team/tasks/:task_id
POST   /api/v1/team/tasks/:task_id/assign
POST   /api/v1/team/tasks/:task_id/ack
POST   /api/v1/team/tasks/:task_id/status
POST   /api/v1/team/tasks/:task_id/result
POST   /api/v1/team/tasks/:task_id/cancel
POST   /api/v1/team/tasks/:task_id/retry
GET    /api/v1/team/tasks/:task_id/events
GET    /api/v1/team/tasks/:task_id/replay

GET    /api/v1/team/tasks/assigned
GET    /api/v1/team/tasks/assigned/:desktop_client_id
```

## 6.6 copilot-serve 拉取任务

请求：

```http
GET /api/v1/team/tasks/assigned?workspace_id=xxx&client_id=xxx
Authorization: Bearer <desktop_or_user_token>
X-Desktop-Client-Id: <client_id>
X-Copilot-Serve-Version: <version>
```

响应：

```json
{
  "items": [
    {
      "task_id": "task_001",
      "workspace_id": "ws_001",
      "project_id": "project_001",
      "title": "生成销售提案",
      "task_type": "content_generation",
      "risk_level": "low",
      "status": "assigned",
      "assignee_user_id": "user_001",
      "target_profile_id": "writer-9601",
      "workspace_path": "E:/git-ai/project-a",
      "requires_approval": false,
      "input": {
        "prompt": "生成销售提案",
        "context_refs": []
      },
      "acceptance_criteria": [
        "输出 Markdown",
        "包含客户背景",
        "包含报价说明"
      ],
      "created_at": "2026-05-24T00:00:00Z"
    }
  ],
  "next_cursor": null
}
```

## 6.7 状态回传

```http
POST /api/v1/team/tasks/:task_id/status
Authorization: Bearer <desktop_or_user_token>
X-Desktop-Client-Id: <client_id>
```

```json
{
  "status": "running",
  "profile_id": "writer-9601",
  "event_type": "gateway_run_started",
  "message": "Hermes Gateway 已接受任务",
  "progress": 30,
  "runtime": {
    "gateway_base_url": "http://127.0.0.1:9601",
    "hermes_session_id": "session_001",
    "hermes_run_id": "run_001"
  }
}
```

## 6.8 结果回传

```http
POST /api/v1/team/tasks/:task_id/result
Authorization: Bearer <desktop_or_user_token>
X-Desktop-Client-Id: <client_id>
```

```json
{
  "status": "succeeded",
  "summary": "已生成销售提案初稿",
  "output_text": "....",
  "artifacts": [
    {
      "type": "document",
      "name": "sales-proposal.md",
      "storage_key": "team-tasks/task_001/sales-proposal.md"
    }
  ],
  "git_commit": null,
  "pr_url": null,
  "logs_summary": "运行完成，无错误"
}
```

## 6.9 数据表

```txt
team_tasks
team_task_events
team_task_assignments
team_task_results
team_task_artifacts
team_task_approvals
team_task_context_refs
```

---

# 7. Hermes Service Center

## 7.1 模块定位

`Hermes Service Center` 是 ai-os-full 的 Hermes 配置、能力、同步和治理中心。

职责：

```txt
1. 管理用户可用 Hermes Profile 配置。
2. 管理 Profile 模板。
3. 管理 Skill 模板。
4. 管理 Plugin manifest。
5. 管理 MCP Server / Tool 注册信息。
6. 管理 Desktop Bootstrap 配置。
7. 管理 copilot-serve 客户端注册与心跳。
8. 管理 profile / skill / plugin / mcp 的权限与发布流程。
```

目录：

```txt
backend/src/services/service-center/
├── profiles/
├── skills/
├── plugins/
├── mcp/
├── desktop-sync/
└── connectors/
```

---

## 7.2 Profile 配置中心

### 职责

```txt
1. 保存 profile template。
2. 保存 user profile config。
3. 保存 workspace profile policy。
4. 保存 profile manifest。
5. 保存 profile 可安装 skill 列表。
6. 保存 profile 默认模型配置。
7. 保存 profile 工具开关。
8. 下发 profile config 给 desktop / copilot-serve。
```

### 不保存

```txt
1. 不保存本地 PID。
2. 不保存本地端口运行态。
3. 不保存本地 gateway log。
4. 不保存本地 SQLite 路径。
```

### API

```txt
GET    /api/v1/service-center/profiles
POST   /api/v1/service-center/profiles
GET    /api/v1/service-center/profiles/:profile_id
PATCH  /api/v1/service-center/profiles/:profile_id
DELETE /api/v1/service-center/profiles/:profile_id

GET    /api/v1/service-center/profile-templates
POST   /api/v1/service-center/profile-templates
GET    /api/v1/service-center/profile-templates/:template_id
POST   /api/v1/service-center/profile-templates/:template_id/publish

GET    /api/v1/service-center/profiles/:profile_id/manifest
POST   /api/v1/service-center/profiles/:profile_id/manifest
```

### Profile Manifest

```ts
type ProfileManifest = {
  profile_id: string
  workspace_id: string
  role_key: string
  role_name: string
  display_name: string
  description: string
  model_config: {
    provider: string
    planner_model?: string
    executor_model?: string
    embedding_model?: string
  }
  tools: Array<{
    tool_key: string
    enabled: boolean
    permission_scope: string[]
  }>
  skills: Array<{
    skill_id: string
    version_id: string
    enabled: boolean
  }>
  mcp_servers: Array<{
    server_id: string
    enabled: boolean
  }>
  policy: {
    allow_file_write: boolean
    allow_shell: boolean
    require_approval_risk_level: string
  }
}
```

### 数据表

```txt
agent_profiles
agent_profile_templates
agent_profile_configs
agent_profile_manifests
agent_profile_skills
agent_profile_mcp_servers
agent_profile_policy_rules
```

---

## 7.3 Skill Template Hub

### 职责

```txt
1. 保存 Skill 模板。
2. 管理 Skill 版本。
3. 管理 Skill 发布状态。
4. 管理 Skill 安装记录。
5. 管理 Skill 适用 profile。
6. 生成 Skill Manifest。
7. 支持 desktop 拉取 Skill 模板。
8. 支持 workspace 内私有 Skill。
```

### Skill 类型

```txt
prompt_skill
tool_skill
workflow_skill
role_source_skill
document_skill
email_skill
code_skill
mcp_tool_skill
```

### API

```txt
GET    /api/v1/service-center/skill-templates
POST   /api/v1/service-center/skill-templates
GET    /api/v1/service-center/skill-templates/:skill_id
PATCH  /api/v1/service-center/skill-templates/:skill_id
DELETE /api/v1/service-center/skill-templates/:skill_id

GET    /api/v1/service-center/skill-templates/:skill_id/versions
POST   /api/v1/service-center/skill-templates/:skill_id/versions
POST   /api/v1/service-center/skill-templates/:skill_id/versions/:version_id/publish
POST   /api/v1/service-center/skill-templates/:skill_id/install
GET    /api/v1/service-center/skill-install-records
```

### Skill Manifest

```ts
type SkillManifest = {
  skill_id: string
  version_id: string
  name: string
  description: string
  category: string
  skill_type: string
  entry_file: string
  files: Array<{
    path: string
    checksum: string
    content_type: string
  }>
  required_permissions: string[]
  compatible_profiles: string[]
  variables_schema: Record<string, unknown>
  created_at: string
}
```

### 数据表

```txt
skill_templates
skill_template_versions
skill_template_files
skill_install_records
skill_publish_records
skill_profile_bindings
```

---

## 7.4 Plugin Registry

### 职责

```txt
1. 保存 Plugin manifest。
2. 管理 Plugin 版本。
3. 管理 Plugin 适用范围。
4. 管理 Plugin 权限声明。
5. 管理 Plugin 安装记录。
6. 管理 Plugin 启停策略。
```

### Plugin 类型

```txt
hermes_plugin
memory_provider
model_provider
tool_provider
connector
desktop_extension
```

### API

```txt
GET    /api/v1/service-center/plugins
POST   /api/v1/service-center/plugins
GET    /api/v1/service-center/plugins/:plugin_id
PATCH  /api/v1/service-center/plugins/:plugin_id
DELETE /api/v1/service-center/plugins/:plugin_id

GET    /api/v1/service-center/plugins/:plugin_id/versions
POST   /api/v1/service-center/plugins/:plugin_id/versions
POST   /api/v1/service-center/plugins/:plugin_id/install
POST   /api/v1/service-center/plugins/:plugin_id/enable
POST   /api/v1/service-center/plugins/:plugin_id/disable
```

### Plugin Manifest

```ts
type PluginManifest = {
  plugin_id: string
  name: string
  version: string
  plugin_type: string
  runtime: 'hermes' | 'copilot-serve' | 'backend' | 'desktop'
  entrypoint: string
  required_permissions: string[]
  config_schema: Record<string, unknown>
  compatible_profiles: string[]
  checksum: string
}
```

### 数据表

```txt
plugin_manifests
plugin_versions
plugin_install_records
plugin_permission_declarations
```

---

## 7.5 MCP Registry

### 职责

```txt
1. 保存 MCP Server 注册信息。
2. 保存 MCP Tool manifest。
3. 管理 Tool 权限范围。
4. 管理 Profile 可用 MCP Tool。
5. 管理 MCP Server 健康状态。
6. 支持 backend service 暴露为 MCP tools。
7. 支持 remote MCP server registry。
```

### MCP Server 类型

```txt
backend_builtin
copilot_serve_local
remote_http
stdio_template
```

### API

```txt
GET    /api/v1/service-center/mcp-servers
POST   /api/v1/service-center/mcp-servers
GET    /api/v1/service-center/mcp-servers/:server_id
PATCH  /api/v1/service-center/mcp-servers/:server_id
DELETE /api/v1/service-center/mcp-servers/:server_id

GET    /api/v1/service-center/mcp-tools
POST   /api/v1/service-center/mcp-tools
GET    /api/v1/service-center/mcp-tools/:tool_id
PATCH  /api/v1/service-center/mcp-tools/:tool_id
POST   /api/v1/service-center/mcp-tools/:tool_id/enable
POST   /api/v1/service-center/mcp-tools/:tool_id/disable

GET    /api/v1/service-center/profiles/:profile_id/mcp-tools
POST   /api/v1/service-center/profiles/:profile_id/mcp-tools/:tool_id/bind
DELETE /api/v1/service-center/profiles/:profile_id/mcp-tools/:tool_id
```

### MCP Tool Manifest

```ts
type McpToolManifest = {
  tool_id: string
  server_id: string
  name: string
  description: string
  input_schema: Record<string, unknown>
  output_schema?: Record<string, unknown>
  required_permissions: string[]
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
}
```

### 数据表

```txt
mcp_servers
mcp_tools
mcp_tool_permissions
mcp_profile_bindings
mcp_server_health_events
```

---

## 7.6 Desktop Sync / Bootstrap Config

### 职责

```txt
1. 注册 desktop client。
2. 维护 desktop client heartbeat。
3. 下发 bootstrap config。
4. 下发 profile manifest。
5. 下发 skill manifest。
6. 下发 plugin manifest。
7. 下发 MCP registry。
8. 下发 workspace policy。
9. 接收 sync cursor。
10. 接收客户端版本、系统环境、运行状态摘要。
```

### API

```txt
POST /api/v1/service-center/desktop/register
POST /api/v1/service-center/desktop/bootstrap
POST /api/v1/service-center/desktop/sync
POST /api/v1/service-center/desktop/heartbeat
GET  /api/v1/service-center/desktop/clients
GET  /api/v1/service-center/desktop/clients/:client_id
POST /api/v1/service-center/desktop/clients/:client_id/revoke
```

### Bootstrap 请求

```json
{
  "client_id": "desktop_001",
  "workspace_id": "ws_001",
  "user_id": "user_001",
  "desktop_version": "2.1.0",
  "copilot_serve_version": "1.0.0",
  "platform": "win32",
  "arch": "x64"
}
```

### Bootstrap 响应

```json
{
  "workspace": {
    "workspace_id": "ws_001",
    "name": "默认工作区"
  },
  "api": {
    "backend_base_url": "https://ai-os.example.com",
    "team_task_poll_interval_seconds": 15
  },
  "profiles": [],
  "skills": [],
  "plugins": [],
  "mcp_servers": [],
  "workspace_policy": {
    "allowed_workspace_roots": [],
    "require_approval_risk_level": "high"
  },
  "sync_cursor": "cursor_001"
}
```

### 数据表

```txt
desktop_clients
desktop_client_heartbeats
desktop_sync_cursors
desktop_bootstrap_events
desktop_client_revocations
```

---

# 8. Connector Webhooks

## 8.1 职责

```txt
1. 接收 Feishu / Slack / OA / Webhook 任务。
2. 验证 webhook signature。
3. 解析任务 payload。
4. 创建 Team Task。
5. 写入 connector event。
6. 回写外部系统消息。
```

## 8.2 API

```txt
POST /api/v1/connectors/webhooks/:connector_key
GET  /api/v1/connectors
POST /api/v1/connectors
PATCH /api/v1/connectors/:connector_id
DELETE /api/v1/connectors/:connector_id
```

## 8.3 数据表

```txt
connector_configs
connector_webhook_events
connector_task_mappings
```

---

# 9. 数据模型总表

## 9.1 已有领域

```txt
users
workspaces
memberships
roles
permissions
role_permissions
refresh_tokens
audit_events

documents
document_versions
document_snapshots

email_accounts
email_folders
email_messages
email_attachments
```

## 9.2 team_v2.1 新增领域

```txt
agent_profiles
agent_profile_templates
agent_profile_configs
agent_profile_manifests
agent_profile_skills
agent_profile_mcp_servers
agent_profile_policy_rules

skill_templates
skill_template_versions
skill_template_files
skill_install_records
skill_publish_records
skill_profile_bindings

plugin_manifests
plugin_versions
plugin_install_records
plugin_permission_declarations

mcp_servers
mcp_tools
mcp_tool_permissions
mcp_profile_bindings
mcp_server_health_events

desktop_clients
desktop_client_heartbeats
desktop_sync_cursors
desktop_bootstrap_events
desktop_client_revocations

team_tasks
team_task_events
team_task_assignments
team_task_results
team_task_artifacts
team_task_approvals
team_task_context_refs

connector_configs
connector_webhook_events
connector_task_mappings

policy_rules
policy_rule_bindings
```

---

# 10. API 分组总览

```txt
/api/v1/auth/*
/api/v1/users/*
/api/v1/workspaces/*
/api/v1/permissions/*
/api/v1/documents/*
/api/v1/email/*
/api/v1/audit/*

/api/v1/team/tasks/*
/api/v1/service-center/profiles/*
/api/v1/service-center/profile-templates/*
/api/v1/service-center/skill-templates/*
/api/v1/service-center/plugins/*
/api/v1/service-center/mcp-servers/*
/api/v1/service-center/mcp-tools/*
/api/v1/service-center/desktop/*
/api/v1/connectors/*
```

---

# 11. 统一响应结构

## 11.1 成功响应

```json
{
  "data": {},
  "meta": {
    "request_id": "req_001"
  }
}
```

## 11.2 分页响应

```json
{
  "items": [],
  "pagination": {
    "limit": 20,
    "next_cursor": null
  },
  "meta": {
    "request_id": "req_001"
  }
}
```

## 11.3 错误响应

```json
{
  "error": {
    "code": "TEAM_TASK_INVALID_STATUS_TRANSITION",
    "message": "Invalid task status transition",
    "details": {}
  },
  "meta": {
    "request_id": "req_001"
  }
}
```

## 11.4 字段规则

```txt
HTTP JSON 响应字段使用 snake_case。
TypeScript 内部类型可使用 camelCase。
Repository 输出必须在 Service 或 Mapper 层转换为 API DTO。
```

---

# 12. 安全与治理

## 12.1 Token

```txt
1. Portal 用户使用 Bearer Access Token。
2. Desktop client 使用用户 Token + Desktop Client ID。
3. copilot-serve 拉取任务必须携带 X-Desktop-Client-Id。
4. webhook 必须使用 signature。
5. MCP Tool 调用必须绑定 workspace_id 与 permission scope。
```

## 12.2 多租户

```txt
1. 所有业务表必须包含 workspace_id。
2. 所有查询必须带 workspace_id scope。
3. 所有任务、profile、skill、plugin、mcp、desktop client 均属于 workspace。
4. Admin 用户也必须通过 workspace scope 查询资源。
```

## 12.3 高风险动作

```txt
1. backend 只记录策略，不执行本地高风险动作。
2. 高风险动作由 copilot-serve 审批后执行。
3. backend 记录审批结果、执行状态、结果摘要。
4. deployment / git_push / file_delete / production_write 必须进入 approval event。
```

## 12.4 Secret

```txt
1. SMTP / IMAP 密码必须加密。
2. webhook secret 必须加密。
3. MCP remote token 必须加密。
4. 模型 provider key 不写入普通 JSON 配置。
5. API 响应不得返回 secret 明文。
```

---

# 13. MCP 架构原则

```txt
1. backend 可暴露 built-in MCP tools，但 MCP tool 不重复实现业务逻辑。
2. MCP tool 必须调用现有 Service。
3. MCP tool 必须复用 RBAC / Workspace Policy。
4. MCP tool 必须写 audit_events。
5. MCP tool 输入输出 schema 来自 packages/shared。
6. MCP tool 风险等级必须写入 mcp_tools.risk_level。
7. 高风险 MCP tool 默认 disabled。
```

示例映射：

```txt
MCP Tool: create_team_task
-> TeamTaskService.createTask()

MCP Tool: list_documents
-> DocumentService.listDocuments()

MCP Tool: search_email
-> EmailMessageService.searchMessages()

MCP Tool: install_skill
-> SkillTemplateService.installSkill()

MCP Tool: get_profile_manifest
-> ProfileManifestService.getManifest()
```

---

# 14. Cursor 实施计划

## 14.1 Phase 0：文档与边界落库

修改文件：

```txt
backend/README.md
docs/prd/backend-team-v2.1.md
docs/INDEX.md
AGENTS.md
```

内容：

```txt
1. 写入 backend 新定位。
2. 写入模块化单体架构。
3. 写入职责边界。
4. 写入 Team Task Hub 目标。
5. 写入 Hermes Service Center 目标。
6. 写入 API 分组。
7. 写入数据表规划。
```

验收：

```txt
1. README.md 包含 team_v2.1。
2. README.md 明确 backend 不管理本地进程。
3. README.md 明确 copilot-serve 管理 Hermes Gateway。
4. README.md 明确 Team Task Hub 与 Hermes Service Center 模块边界。
```

---

## 14.2 Phase 1：共享契约与数据库 schema

新增文件：

```txt
packages/shared/src/team-tasks/constants.ts
packages/shared/src/team-tasks/types.ts
packages/shared/src/team-tasks/validators.ts
packages/shared/src/service-center/profiles.ts
packages/shared/src/service-center/skills.ts
packages/shared/src/service-center/plugins.ts
packages/shared/src/service-center/mcp.ts
packages/shared/src/service-center/desktop-sync.ts

packages/db/src/schema/team-tasks.ts
packages/db/src/schema/service-center.ts
packages/db/src/schema/connectors.ts
```

修改文件：

```txt
packages/shared/src/index.ts
packages/db/src/schema/index.ts
```

执行命令：

```bash
pnpm db:generate
pnpm typecheck
```

验收：

```txt
1. shared 导出 team-tasks 与 service-center validators。
2. db schema 可生成 migration。
3. 新增表均包含 workspace_id。
4. team_tasks 状态枚举与 validators 一致。
5. typecheck 通过。
```

---

## 14.3 Phase 2：Team Task Hub

新增文件：

```txt
backend/src/routes/team-tasks.ts

backend/src/services/team-tasks/team-task.service.ts
backend/src/services/team-tasks/team-task.repository.ts
backend/src/services/team-tasks/team-task-policy.service.ts
backend/src/services/team-tasks/team-task-status-machine.ts
backend/src/services/team-tasks/team-task-event.service.ts
backend/src/services/team-tasks/team-task-result.service.ts
backend/src/services/team-tasks/team-task-assignment.service.ts
backend/src/services/team-tasks/index.ts

backend/tests/team-task-status-machine.test.ts
backend/tests/team-task-service.test.ts
```

修改文件：

```txt
backend/src/app.ts
backend/src/routes/index.ts
```

实现接口：

```txt
POST   /api/v1/team/tasks
GET    /api/v1/team/tasks
GET    /api/v1/team/tasks/:task_id
POST   /api/v1/team/tasks/:task_id/assign
POST   /api/v1/team/tasks/:task_id/ack
POST   /api/v1/team/tasks/:task_id/status
POST   /api/v1/team/tasks/:task_id/result
POST   /api/v1/team/tasks/:task_id/cancel
POST   /api/v1/team/tasks/:task_id/retry
GET    /api/v1/team/tasks/:task_id/events
GET    /api/v1/team/tasks/:task_id/replay
GET    /api/v1/team/tasks/assigned
```

验收：

```txt
1. created -> assigned -> acknowledged -> running -> succeeded 可走通。
2. pending_approval -> approved -> running 可走通。
3. running -> succeeded 写入 team_task_results。
4. 非法状态流转返回 TEAM_TASK_INVALID_STATUS_TRANSITION。
5. 每次状态变化写入 team_task_events。
6. 每次关键动作写入 audit_events。
7. GET /assigned 支持 desktop client 拉取。
8. Vitest 通过。
```

---

## 14.4 Phase 3：Hermes Service Center / Profile 配置中心

新增文件：

```txt
backend/src/routes/service-center-profiles.ts

backend/src/services/service-center/profiles/profile.service.ts
backend/src/services/service-center/profiles/profile-template.service.ts
backend/src/services/service-center/profiles/profile-manifest.service.ts
backend/src/services/service-center/profiles/profile-policy.service.ts
backend/src/services/service-center/profiles/profile.repository.ts
backend/src/services/service-center/profiles/index.ts

backend/tests/profile-manifest-service.test.ts
```

实现接口：

```txt
GET    /api/v1/service-center/profiles
POST   /api/v1/service-center/profiles
GET    /api/v1/service-center/profiles/:profile_id
PATCH  /api/v1/service-center/profiles/:profile_id
DELETE /api/v1/service-center/profiles/:profile_id

GET    /api/v1/service-center/profile-templates
POST   /api/v1/service-center/profile-templates
GET    /api/v1/service-center/profile-templates/:template_id
POST   /api/v1/service-center/profile-templates/:template_id/publish

GET    /api/v1/service-center/profiles/:profile_id/manifest
POST   /api/v1/service-center/profiles/:profile_id/manifest
```

验收：

```txt
1. 可创建 profile template。
2. 可发布 profile template。
3. 可为 workspace 创建 profile config。
4. 可生成 profile manifest。
5. manifest 不包含本地 PID / 本地端口运行态。
6. profile 配置变更写入 audit_events。
```

---

## 14.5 Phase 4：Skill Template Hub

新增文件：

```txt
backend/src/routes/service-center-skills.ts

backend/src/services/service-center/skills/skill-template.service.ts
backend/src/services/service-center/skills/skill-version.service.ts
backend/src/services/service-center/skills/skill-publish.service.ts
backend/src/services/service-center/skills/skill-install.service.ts
backend/src/services/service-center/skills/skill.repository.ts
backend/src/services/service-center/skills/index.ts

backend/tests/skill-template-service.test.ts
```

实现接口：

```txt
GET    /api/v1/service-center/skill-templates
POST   /api/v1/service-center/skill-templates
GET    /api/v1/service-center/skill-templates/:skill_id
PATCH  /api/v1/service-center/skill-templates/:skill_id
DELETE /api/v1/service-center/skill-templates/:skill_id

GET    /api/v1/service-center/skill-templates/:skill_id/versions
POST   /api/v1/service-center/skill-templates/:skill_id/versions
POST   /api/v1/service-center/skill-templates/:skill_id/versions/:version_id/publish
POST   /api/v1/service-center/skill-templates/:skill_id/install
GET    /api/v1/service-center/skill-install-records
```

验收：

```txt
1. Skill 可创建。
2. Skill version 可创建。
3. Skill version 可发布。
4. Skill 可安装到 profile。
5. Skill manifest 可下发给 desktop sync。
6. 发布与安装动作写入 audit_events。
```

---

## 14.6 Phase 5：Plugin / MCP Registry

新增文件：

```txt
backend/src/routes/service-center-plugins.ts
backend/src/routes/service-center-mcp.ts

backend/src/services/service-center/plugins/plugin.service.ts
backend/src/services/service-center/plugins/plugin-version.service.ts
backend/src/services/service-center/plugins/plugin-install.service.ts
backend/src/services/service-center/plugins/plugin.repository.ts

backend/src/services/service-center/mcp/mcp-server.service.ts
backend/src/services/service-center/mcp/mcp-tool.service.ts
backend/src/services/service-center/mcp/mcp-profile-binding.service.ts
backend/src/services/service-center/mcp/mcp-health.service.ts
backend/src/services/service-center/mcp/mcp.repository.ts

backend/tests/mcp-registry-service.test.ts
backend/tests/plugin-registry-service.test.ts
```

验收：

```txt
1. Plugin manifest 可注册。
2. Plugin 可绑定 workspace。
3. MCP Server 可注册。
4. MCP Tool 可注册。
5. MCP Tool 可绑定 Profile。
6. 高风险 MCP Tool 默认 disabled。
7. MCP 变更写入 audit_events。
```

---

## 14.7 Phase 6：Desktop Sync / Bootstrap

新增文件：

```txt
backend/src/routes/desktop-sync.ts

backend/src/services/service-center/desktop-sync/desktop-client.service.ts
backend/src/services/service-center/desktop-sync/bootstrap.service.ts
backend/src/services/service-center/desktop-sync/sync.service.ts
backend/src/services/service-center/desktop-sync/heartbeat.service.ts
backend/src/services/service-center/desktop-sync/desktop-client.repository.ts
backend/src/services/service-center/desktop-sync/index.ts

backend/tests/desktop-bootstrap-service.test.ts
```

实现接口：

```txt
POST /api/v1/service-center/desktop/register
POST /api/v1/service-center/desktop/bootstrap
POST /api/v1/service-center/desktop/sync
POST /api/v1/service-center/desktop/heartbeat
GET  /api/v1/service-center/desktop/clients
GET  /api/v1/service-center/desktop/clients/:client_id
POST /api/v1/service-center/desktop/clients/:client_id/revoke
```

验收：

```txt
1. Desktop client 可注册。
2. Desktop bootstrap 返回 workspace/profile/skill/plugin/mcp/policy。
3. Desktop heartbeat 写入 client status。
4. revoked client 不能 bootstrap。
5. sync cursor 可更新。
6. desktop 相关操作写入 audit_events。
```

---

## 14.8 Phase 7：Connector Webhooks

新增文件：

```txt
backend/src/routes/connectors.ts

backend/src/services/service-center/connectors/connector.service.ts
backend/src/services/service-center/connectors/webhook.service.ts
backend/src/services/service-center/connectors/webhook-signature.service.ts
backend/src/services/service-center/connectors/connector-task-mapper.service.ts
backend/src/services/service-center/connectors/connector.repository.ts

backend/tests/connector-webhook-service.test.ts
```

验收：

```txt
1. Connector 可创建。
2. Webhook 签名校验可用。
3. Webhook payload 可映射为 Team Task。
4. 映射失败写入 connector_webhook_events。
5. 成功创建任务写入 team_tasks 与 audit_events。
```

---

# 15. Cursor 实施约束

```txt
1. 不修改 frontend 全局 layout。
2. 不修改 frontend components/ui。
3. 不修改 ai-os-api。
4. 不把本地 Gateway 运行态写入 backend。
5. 不把本地 PID / gateway log / local sqlite path 写入 backend。
6. 不在 Route 层写 SQL。
7. 不绕过 packages/shared 定义 API validators。
8. 不手写 migration SQL；必须通过 pnpm db:generate。
9. 不引入微服务拆分。
10. 不引入第二套 ORM。
11. 不引入 Python backend。
12. 不让 MCP Tool 复制业务逻辑；必须复用 Service。
```

---

# 16. 验收总标准

```txt
1. backend 仍为单体服务。
2. /api/v1/auth、/workspaces、/documents、/email、/audit 既有能力保持可用。
3. /api/v1/team/tasks 支持任务创建、分派、领取、状态回传、结果回传。
4. /api/v1/service-center/profiles 支持 Profile 配置管理。
5. /api/v1/service-center/skill-templates 支持 Skill 模板与版本管理。
6. /api/v1/service-center/plugins 支持 Plugin manifest 管理。
7. /api/v1/service-center/mcp-* 支持 MCP Server / Tool registry。
8. /api/v1/service-center/desktop/bootstrap 支持桌面端配置下发。
9. 所有新增表包含 workspace_id。
10. 所有新增写操作写入 audit_events。
11. 所有新增 DTO / Validator 放入 packages/shared。
12. 所有新增 DB schema 放入 packages/db。
13. pnpm typecheck 通过。
14. pnpm test 通过。
15. pnpm build 通过。
```

---

# 17. README.md 写入结构

目标文件：

```txt
backend/README.md
```

写入章节：

```txt
# ai-os-full/backend

## 1. 服务定位
## 2. 职责边界
## 3. 技术栈
## 4. 模块化单体架构
## 5. 目录结构
## 6. 模块开发规则
## 7. API 分组
## 8. Auth / Workspace / RBAC
## 9. Documents / Email / Audit
## 10. Team Task Hub
## 11. Hermes Service Center
## 12. Profile 配置中心
## 13. Skill Template Hub
## 14. Plugin / MCP Registry
## 15. Desktop Sync / Bootstrap Config
## 16. 任务状态聚合与审计回放
## 17. 数据模型
## 18. 安全规则
## 19. Cursor 实施约束
## 20. 验收标准
```

---

# 18. 最终交付边界

```txt
team_v2.1 交付后，backend 完成从“业务 API 服务”到“业务 API + Hermes Service Center + Team Task Hub 控制面”的定位升级。

backend 保持单体服务。
copilot-serve 保持本地控制面。
copilot-desktop 保持桌面 UI 与本地入口。
Hermes Gateway Runtime 仍由本地服务管理。
ai-os-full/backend 只负责配置、任务、权限、同步、审计和状态聚合。
```
