# AI-OS Backend — Hermes Service Center

> **team_v2.1** — Hermes Service Center 集成：backend-owned Gateway、Run/Events、Tool Facade、Prompt Template、Task Replay。PRD：[`prd/team_v2.1_center_agent.md`](../prd/team_v2.1_center_agent.md)  
> **team_v2.0.1_hotfix** — v2.0 安全与契约修补（Webhook/RBAC/审批/Desktop-Id）。Hotfix PRD：[`prd/team_v2.0.1_hotfix_center_service.md`](../prd/team_v2.0.1_hotfix_center_service.md)  
> **team_v2.0** — 模块化单体升级：Team Task Hub + Hermes Service Center。PRD：[`docs/prd/backend-team-v2.0.md`](../docs/prd/backend-team-v2.0.md) · 完整方案：[`prd/team_v2.0_center_service.md`](../prd/team_v2.0_center_service.md)

`backend` 是 AI-OS 的服务器单体后端，负责业务 API、团队任务中心、Hermes Service Center、配置同步、资源注册、审计与回放。

backend 不是普通 CRUD API 层，也不是用户端 hermes-agent 的进程管理器。

## Hermes 集成边界（team_v2.1）

- backend **只集成 backend 自己的 Hermes Agent Gateway**（`HERMES_GATEWAY_BASE_URL` 或 `hermes_gateway_instances` 表）。
- backend **不直接调用**用户端 copilot-serve 管理的本地 Hermes Gateway。
- 用户端 Hermes Profile 通过 copilot-serve 向 backend 注册元数据；backend 向用户端分派任务，copilot-serve 拉取、本地执行、回传状态。

## Hermes Service Center 模块（team_v2.1）

| 模块 | 路径 | API 前缀 |
|------|------|----------|
| AI Chat / Agent Run | `services/hermes/hermes-run.service.ts` | `POST /api/v1/hermes/chat` |
| Run Events / SSE | `services/hermes/hermes-event.service.ts` | `GET /api/v1/hermes/runs/:id/stream` |
| Gateway Router/Client | `services/hermes/hermes-gateway-*.ts` | `GET/POST /api/v1/hermes/gateways/*` |
| Tool Facade | `services/hermes/tool-facade.service.ts` | `POST /api/v1/hermes/tool-calls/dispatch` + `POST .../tool-calls/:id/approve`（批准后自动执行 handler） |
| Context Builder | `services/hermes/context-builder.ts` | 内部 |
| Prompt Template | `services/hermes/prompt-template.service.ts` | `GET/POST /api/v1/hermes/prompt-templates/*` |
| Task Replay | `services/hermes/task-replay.service.ts` | `GET /api/v1/team/tasks/:id/replay` |

环境变量：

```bash
HERMES_GATEWAY_BASE_URL=http://127.0.0.1:9000   # 可选，无 DB gateway 时的默认
HERMES_GATEWAY_AUTH_TOKEN=...                   # 可选
HERMES_GATEWAY_TIMEOUT_MS=30000
HERMES_RUN_MAX_DURATION_SEC=300
```

---

# ai-os-full Backend（历史说明）

`backend` 是 ai-os-full 的服务器端业务 API 与 Hermes Service Center 控制面。它不负责本机 Hermes Gateway 进程管理，不直接提供 UI，也不执行本地文件系统操作；这些能力由 `copilot-desktop` 与 `copilot-serve` 承担。

## 1. 定位

backend 的核心定位是：

- 作为云端/服务器部署的业务 API 服务。
- 作为 Team Task Hub，为团队 Agent 协作提供任务分派、状态聚合、结果回传和审计能力。
- 作为 Hermes Service Center，为用户、Workspace、权限、Profile 配置、Skill 模板、MCP/Plugin 注册和同步提供中心化管理能力。
- 为 frontend / copilot-desktop / copilot-serve 提供统一 REST API。

## 2. 技术栈

当前 backend 使用 Node.js + TypeScript：

- Runtime：Node.js
- Language：TypeScript ESM
- HTTP Framework：Express 5
- Validation：Zod
- Database：PostgreSQL + Drizzle ORM，通过 `@portal/db` 访问
- Object Storage：S3 / MinIO，通过 AWS SDK v3 访问
- Auth：JWT Access Token + Refresh Token
- Logging：Pino + pino-http
- Test：Vitest

技术选型原则：

- REST API、权限、任务中心、配置中心优先使用 TypeScript，便于与 frontend、shared validators、DTO 类型保持一致。
- Hermes Agent Runtime、LLM 推理、工具执行、MCP 适配器中的 Python 能力放在独立 worker 或 copilot-serve 中，不混入 backend 主进程。
- MCP Server 可以由 TypeScript 实现，但必须复用 backend application service，不允许绕过服务层直接访问数据库。

## 3. 职责边界

### backend 负责

- 用户注册、登录、Token 刷新、登出。
- Workspace 多租户、成员、角色、权限。
- Documents 元数据、版本、快照、权限、事件。
- Email 账号、邮件、附件、同步、发送、审计。
- Audit Events 审计日志。
- Team Task Hub：任务分派、领取、状态同步、结果回传、事件流。
- Hermes Service Center：Profile 配置、Skill 模板、Plugin/MCP Registry、桌面端同步策略。
- 对 frontend、copilot-desktop、copilot-serve 提供 REST API。

### backend 不负责

- 不启动、停止、重启本地 Hermes Gateway。
- 不直接访问用户本机文件系统。
- 不直接执行代码、不直接调用本机 terminal。
- 不保存 Hermes Profile 的运行态 PID、端口、进程日志。
- 不提供前端页面。

## 4. 当前代码结构

```txt
backend/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── scripts/
│   └── test-imap-sync.ts
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── config.ts
│   ├── errors.ts
│   ├── auth-provider/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── storage/
└── tests/
```

当前 `src/app.ts` 是 Composition Root，负责创建 Express App、创建 DB、实例化 Auth / RBAC / Documents / Email / Audit 服务，并挂载 `/api/v1` 路由。

## 5. 目标代码架构

backend 后续按“模块化单体”演进，不先拆微服务。模块化单体的好处是：保留单进程部署简单性，同时按 domain 切开代码边界，后续 Team Task、MCP、Skill Hub 具备独立拆分条件。

目标结构：

```txt
backend/src/
├── index.ts
├── app.ts
├── config.ts
├── core/
│   ├── errors.ts
│   ├── logger.ts
│   ├── http.ts
│   ├── request-context.ts
│   ├── auth.ts
│   └── rbac.ts
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   ├── token.service.ts
│   │   └── index.ts
│   ├── rbac/
│   ├── workspaces/
│   ├── documents/
│   ├── email/
│   ├── audit/
│   ├── team-tasks/
│   │   ├── team-task.routes.ts
│   │   ├── team-task.service.ts
│   │   ├── team-task.repository.ts
│   │   ├── team-task.events.ts
│   │   ├── team-task.policy.ts
│   │   └── index.ts
│   └── service-center/
│       ├── profiles/
│       ├── skills/
│       ├── mcp/
│       ├── plugins/
│       ├── desktop-sync/
│       └── connectors/
├── integrations/
│   ├── s3/
│   ├── mail/
│   ├── hermes-gateway/
│   ├── copilot-serve/
│   └── webhook/
├── jobs/
│   ├── scheduler.ts
│   ├── email-sync.job.ts
│   ├── task-timeout.job.ts
│   └── desktop-heartbeat.job.ts
└── server/
    ├── register-routes.ts
    ├── register-services.ts
    └── container.ts
```

## 6. 模块开发规则

每个业务模块采用统一文件约定：

```txt
<module>/
├── <module>.routes.ts       # HTTP Route，只处理 request/response
├── <module>.service.ts      # 业务用例、事务、权限编排
├── <module>.repository.ts   # 数据访问，只访问 @portal/db
├── <module>.policy.ts       # 权限/策略判断
├── <module>.events.ts       # 领域事件、审计事件
├── <module>.types.ts        # 模块内部类型
└── index.ts                 # 模块导出
```

规则：

- Route 不直接写 SQL。
- Route 不直接访问 S3 / SMTP / IMAP / Hermes Gateway。
- Service 可以编排 Repository、Storage、Provider、Audit。
- Repository 只负责数据读写，不做权限判断。
- MCP Tool、REST Route、定时任务必须复用同一套 Service。
- DTO 与校验优先放在 `@portal/shared`，避免 frontend / backend 重复定义字段。
- API 响应字段统一使用 `snake_case`。

## 7. REST API 分组

当前已存在：

```txt
GET    /health
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

/api/v1/workspaces
/api/v1/permissions
/api/v1/users
/api/v1/documents
/api/v1/email
/api/v1/audit
```

新增 Hermes Service Center API：

```txt
/api/v1/service-center/profiles
/api/v1/service-center/profile-configs
/api/v1/service-center/skill-templates
/api/v1/service-center/plugins
/api/v1/service-center/mcp-servers
/api/v1/service-center/mcp-tools
/api/v1/service-center/desktop-clients
/api/v1/service-center/sync
```

新增 Team Task Hub API：

```txt
POST   /api/v1/team/tasks
GET    /api/v1/team/tasks
GET    /api/v1/team/tasks/:task_id
GET    /api/v1/team/tasks/assigned
POST   /api/v1/team/tasks/:task_id/ack
POST   /api/v1/team/tasks/:task_id/status
POST   /api/v1/team/tasks/:task_id/result
GET    /api/v1/team/tasks/:task_id/events
POST   /api/v1/team/tasks/:task_id/cancel
POST   /api/v1/team/tasks/:task_id/retry
```

## 8. Team Task Hub 设计目标

Team Task Hub 是团队作战的中心控制面。它负责把团队任务分派到指定用户、指定 Agent、指定 Profile，再由用户本机 `copilot-serve` 领取并执行。

核心能力：

- 任务创建：来自 frontend、项目经理、同事 Agent、Feishu/Slack/OA Webhook。
- 任务分派：按 `assignee_user_id`、`target_agent_id`、`target_profile` 分配。
- 任务领取：copilot-serve 拉取 `assigned_to_me` 任务。
- 状态同步：received / approved / running / succeeded / failed / cancelled。
- 结果回传：文本摘要、产物 URL、Git commit、PR URL、日志摘要。
- 审计回放：记录任务事件、操作者、来源 Agent、目标 Workspace、风险等级。

状态机：

```txt
created
  -> assigned
  -> acknowledged
  -> pending_approval
  -> approved
  -> running
  -> succeeded

failed / cancelled / rejected 可以从中间状态进入终态。
```

## 9. Hermes Service Center 设计目标

Hermes Service Center 是服务器中心，不替代本地 Hermes Runtime。它负责用户与配置的中心化管理，并与用户本机 copilot-serve 同步。

核心能力：

- 用户与组织：用户、Workspace、成员、角色、权限。
- Profile 配置中心：保存 profile 元数据、模型配置、工具开关、默认技能模板、同步版本。
- Skill Hub：保存 Skill 模板、分类、版本、适用 profile、安装策略。
- Plugin Hub：保存外部工具、连接器、Webhook、MCP Server 注册信息。
- Desktop Sync：为 copilot-desktop / copilot-serve 下发 bootstrap 配置、profile 配置、skill manifest。
- Team Task Hub：提供跨用户、跨 Agent、跨机器任务协作闭环。
- Audit Replay：对任务、配置变更、技能安装、状态回传进行审计。

## 10. MCP 架构原则

MCP 是 backend 的工具暴露层，不是第二套业务逻辑。

```txt
REST Route ─┐
            ├─ Application Service ─ Repository / Provider / Storage
MCP Tool  ──┘
```

规则：

- MCP Tool 只做参数校验、权限上下文构造、调用 Service、返回结构化结果。
- MCP Tool 不直接访问数据库。
- MCP Tool 不直接保存审计，审计由 Service 统一触发。
- MCP Server 的 tool manifest 来自 `service-center/mcp` 模块。
- 高风险工具必须走 Policy + Approval，不允许自动执行。

## 11. 数据模型新增建议

在 `packages/db/src/schema` 中新增：

```txt
agent_profiles
agent_profile_configs
skill_templates
skill_template_versions
skill_install_records
plugin_manifests
mcp_servers
mcp_tools
desktop_clients
desktop_sync_cursors
team_tasks
team_task_events
team_task_results
policy_rules
connector_webhooks
```

关键约束：

- `workspace_id` 是多租户隔离边界。
- `created_by_user_id`、`source_agent_id`、`target_agent_id` 必须保留。
- 任务、配置、技能安装必须写入 audit events。
- Secret 不写入普通配置表，只保存加密引用或托管密钥 ID。

## 12. 安全规则

- 所有 `/api/v1/*` 默认需要 Bearer Token，除 `/api/v1/auth/register`、`/api/v1/auth/login`、`/api/v1/auth/refresh`、`/health`。
- Workspace 权限必须在 API 层裁剪，不能只依赖前端隐藏按钮。
- Team Task 必须校验：来源用户、来源 Agent、目标用户、目标 Workspace、任务类型、风险等级。
- backend 不信任 copilot-serve 回传的任意状态，必须校验 task_id、assignee_user_id、client_id、签名或 token。
- 未知 workspace_path、高风险操作、发布部署、代码写入类任务必须进入审批流程。

## 13. 环境变量

基础变量：

```bash
PORT=8000
NODE_ENV=development
DATABASE_URL=postgres://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...

S3_ENDPOINT_URL=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
DOCUMENT_SNAPSHOT_BUCKET=portal-documents
EMAIL_ATTACHMENT_BUCKET=portal-email-attachments

EMAIL_CREDENTIAL_ENCRYPTION_KEY=<64-hex>
EMAIL_SYNC_ENABLED=true
EMAIL_DEFAULT_SYNC_INTERVAL_SEC=300
```

后续新增：

```bash
SERVICE_CENTER_BASE_URL=http://localhost:8000
DESKTOP_SYNC_TOKEN_SECRET=...
TEAM_TASK_WEBHOOK_SECRET=...
MCP_SERVER_ENABLED=true
MCP_SERVER_PORT=8010
```

## 14. 开发命令

```bash
pnpm --filter @portal/server dev
pnpm --filter @portal/server build
pnpm --filter @portal/server typecheck
pnpm --filter @portal/server test
```

## 15. team_v2.0.1_hotfix 要点

- Connector Webhook：`/api/v1/connectors/webhooks/:connector_key` 免 JWT，仅 HMAC 验签；raw body 保留用于 signature。
- RBAC：Team Task / Service Center 端点挂 `team_task:*`、`profile:*` 等权限码；部署后需重跑 RBAC seed。
- 审批：`POST .../approve`、`POST .../reject` 写入 `team_task_approvals`。
- Desktop：copilot-serve 拉取/回传任务须带 `X-Desktop-Client-Id` header。

详见 [`prd/team_v2.0.1_hotfix_center_service.md`](../prd/team_v2.0.1_hotfix_center_service.md)。

## 16. 验收标准

- backend 可独立启动，`GET /health` 返回正常。
- Auth / Workspace / RBAC / Documents / Email / Audit 现有测试通过。
- 新增 Team Task Hub 后，copilot-serve 可拉取 assigned tasks，并回传状态与结果。
- 新增 Service Center 后，copilot-desktop 可获取 bootstrap 配置、profile manifest、skill manifest。
- MCP Tool 与 REST API 复用同一 Service，不产生重复业务逻辑。
- 所有新增 API 有 Zod Schema、权限校验、审计事件和 Vitest 测试。
