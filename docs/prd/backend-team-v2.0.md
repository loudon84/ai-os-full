# backend team_v2.0 — Hermes Service Center + Team Task Hub

> 完整 PRD 见仓库根目录 [`prd/team_v2.0_center_service.md`](../../prd/team_v2.0_center_service.md)（版本 team_v2.1 正文）。

## 定位

`backend`（`@portal/server`）升级为 **业务 API + Hermes Service Center + Team Task Hub 控制面** 的模块化单体服务。

## 核心新增域

| 域 | 路由前缀 | 职责 |
|---|---|---|
| Team Task Hub | `/api/v1/team/tasks` | 任务创建、分派、领取、状态/结果回传、审计 |
| Profile Center | `/api/v1/service-center/profiles` | Profile 配置、模板、manifest |
| Skill Hub | `/api/v1/service-center/skill-templates` | Skill 模板、版本、发布、安装 |
| Plugin Registry | `/api/v1/service-center/plugins` | Plugin manifest 管理 |
| MCP Registry | `/api/v1/service-center/mcp-*` | MCP Server / Tool 注册与绑定 |
| Desktop Sync | `/api/v1/service-center/desktop/*` | 桌面端注册、bootstrap、心跳、同步 |
| Connectors | `/api/v1/connectors/*` | Webhook 接入创建任务 |

## 边界（backend 不负责）

- 不启动/管理本地 Hermes Gateway（PID、端口、日志）
- 不访问用户本机文件系统
- 不执行 terminal / git / code write

本地运行时由 `copilot-serve` / `copilot-desktop` 承担。

## 代码落点

```
backend/src/routes/team-tasks.ts
backend/src/routes/service-center-*.ts
backend/src/routes/desktop-sync.ts
backend/src/routes/connectors.ts
backend/src/services/team-tasks/
backend/src/services/service-center/
packages/shared/src/team-tasks/
packages/shared/src/service-center/
packages/db/src/schema/team-tasks.ts
packages/db/src/schema/agent-profiles.ts
…（见完整 PRD §9）
```

## 验收

见 [`backend/README.md`](../../backend/README.md) §15 与完整 PRD §16。
