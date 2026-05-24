# team_v2.0.1_hotfix：Service Center / Team Task 安全与契约修补

## 目标

在 [team_v2.0_center_service.md](team_v2.0_center_service.md) 已交付骨架基础上，修复 code review 暴露的 **P0 安全缺口** 与 **P1 集成缺口**，不改变既有 API 路径契约，仅补齐鉴权、审批、Desktop 绑定与数据约束。

## 修复项

| ID | 优先级 | 问题 | 修复 |
|----|--------|------|------|
| P0-1 | P0 | Webhook 仍要求 Bearer Token | auth-v2 公开 webhook 路径 + HMAC signature-only |
| P0-1b | P0 | Webhook 用 `JSON.stringify(req.body)` 验签 | express.json verify 保留 rawBody |
| P0-2 | P0 | 新 API 未挂 RBAC | 扩展 PERMISSION_CODES + 各 route 挂 rbacMiddleware |
| P0-3 | P0 | 审批流半成品 | approve/reject API + team_task_approvals 写入 |
| P0-4 | P0 | X-Desktop-Client-Id 未校验 | header 强制 + assignment 绑定校验 |
| P1-1 | P1 | connector_key 无 workspace 唯一 | schema unique + migration 0004 |
| P1-2 | P1 | EventBus 未接入 | publish-domain-event + service emit |
| P1-3 | P1 | MCP health 无 API | mcp-health.service + health-check/events 端点 |
| P1-4 | P1 | policy_rule_bindings 未用 | bootstrap 合并 scoped rules |
| P1-5 | P1 | timeout job 用 updatedAt | assigned 用 assignment.created_at |
| P1-6 | P1 | retryTask 停在 retrying | failed/retrying → assigned |
| P1-7 | P1 | 缺 team-task-service 测试 | mock repository 集成测试 |

## 部署注意

hotfix 后需重跑 RBAC seed 以写入新权限码：

```bash
pnpm db:migrate
pnpm --filter @portal/db seed   # 或项目内 seed-auth-rbac 脚本
```

## 涉及文件

- `backend/src/middleware/auth-v2.ts`, `desktop-client.ts`
- `backend/src/routes/team-tasks.ts`, `connectors.ts`, `service-center-*.ts`, `desktop-sync.ts`
- `backend/src/services/team-tasks/*`, `service-center/mcp/mcp-health.service.ts`
- `backend/src/events/publish-domain-event.ts`
- `backend/src/jobs/task-timeout-scan.job.ts`
- `packages/shared/src/constants.ts`, `team-tasks/validators.ts`
- `packages/db/src/schema/connectors.ts`, migration `0004_*.sql`

## 验收记录

| # | 场景 | 步骤 | 期望 | 结果 | 备注 |
|---|------|------|------|------|------|
| 1 | Webhook 无 JWT | POST webhook + 正确 HMAC，无 Bearer | 201 | | |
| 2 | Webhook 错误签名 | POST webhook + 错误 HMAC | 401 | | |
| 3 | RBAC create | user 无 team_task:create → POST /team/tasks | 403 | | |
| 4 | 审批 | pending_approval → POST approve | approved / running | | |
| 5 | Desktop header | GET /assigned 无 X-Desktop-Client-Id | 400 | | |
| 6 | connector 唯一 | 同 workspace 重复 connector_key | 409 | | |
| 7 | MCP health | POST health-check | health_events 有记录 | | |
| 8 | 自动化 | pnpm --filter @portal/server test | 全绿 | | |
