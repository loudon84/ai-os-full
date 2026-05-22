# team_v1.6 — Gateway Supervisor 升级 · 状态分析

> 分析时间：2026-05-21  
> PRD 来源：`prd/team_v1.6_gateway-supervisor.md`  
> 目标仓库：`copilot-serve/`（独立 git）  
> 关联仓库：`copilot-desktop/`（Electron 对接层）

---

## 一、PRD 核心目标

将 `copilot-serve`（HermesLocalService）从「FastAPI 进程内 supervisor」升级为 **Windows 常驻服务模式**，补齐多 Profile 并发下的端口分配、进程恢复、开机自启、服务重启后状态一致性。

## 二、当前代码现状

### 2.1 已具备的基础

| 模块 | 现状 | 评估 |
|------|------|------|
| `GatewaySupervisor` | 已实现 start/stop/restart/refresh_status + 审计日志 | 可用，需扩展 reconcile/auto_start |
| `GatewayProcessManager` | asyncio subprocess 管理，内存 `_handles` 字典 | 需增加 PID fallback stop |
| `ProfileService` | CRUD + set_status + config sync | 需改 create_profile 端口分配逻辑 |
| `Profile` 模型 | 含 gateway_port / auto_start / status / gateway_pid / enabled | 字段齐全，无需加列 |
| `port_allocator.py` | 9 行代码，无冲突检测 | **必须重写** |
| `lifecycle.py` | lifespan 内创建 supervisor 但无 reconcile/auto_start | 需追加两步 |
| `main.py` | `get_settings()` 未导入 → NameError | **P0 bug** |
| API 路由 | profiles CRUD + start/stop/restart/status 已完整 | 仅需新增 service/status |
| 迁移链 | 0001 → 0002 → 001_role_spec | 本版无新 migration |

### 2.2 缺失项（PRD 明确列出）

1. **main.py import bug** — `get_settings()` 未导入，CLI 入口 `smc-copilot-serve` 无法运行
2. **端口分配不支持多 profile** — 多 profile 默认都拿 8642，端口冲突
3. **服务重启后进程状态丢失** — `_handles` 是内存字典，重启后 handle 丢失，已启动的 gateway 变成孤儿
4. **auto_start 字段有但未执行** — Profile 模型有 auto_start，lifecycle 启动时未调用
5. **stop 只能停内存 handle** — 服务重启后无法通过 PID fallback 停止孤儿 gateway
6. **无 Windows Service 入口** — 当前只能 `uvicorn main:app` 手动跑
7. **无 service/status API** — Electron 无法查询服务整体运行状态

### 2.3 copilot-desktop 侧现状

| 模块 | 现状 |
|------|------|
| `window.copilotServe` | Preload 已有 get-connection / start / stop / logs（V1.3） |
| Electron Main | 可 spawn copilot-serve 进程，通过 HTTP 访问 :8765 |
| Profile Runtime UI | V4.0 Settings Profiles 管理 UI 已就绪 |
| 对接方式 | Renderer 直调 `http://127.0.0.1:8765/api/v1/*` |

v1.6 Electron 侧改动很小：主要是 Main Process 启动时增加 Windows Service 检测/启动逻辑。

## 三、改造范围评估

### 文件级影响

| 文件 | 操作 | 优先级 |
|------|------|--------|
| `src/main.py` | 修复 import | P0 |
| `src/runtime/port_allocator.py` | 重写 | P0 |
| `src/runtime/gateway_process.py` | 增加 PID fallback stop + `is_pid_alive` + `terminate_pid` | P0 |
| `src/services/gateway_supervisor.py` | 增加 `reconcile_on_boot` + `start_auto_start_profiles` + 改 `stop_profile` | P0 |
| `src/services/profile_service.py` | `create_profile` 调用新端口分配 | P0 |
| `src/core/lifecycle.py` | 增加 reconcile + auto_start 调用 | P0 |
| `src/local_service/__init__.py` | 新建 | P0 |
| `src/local_service/runner.py` | 新建 — 服务运行器 | P0 |
| `src/local_service/windows_service.py` | 新建 — pywin32 ServiceFramework | P0 |
| `src/local_service/service_state.py` | 新建 — 服务状态 | P0 |
| `src/local_service/service_cli.py` | 新建 — install/start/stop/remove/status/run CLI | P0 |
| `scripts/service-install.ps1` | 新建 | P0 |
| `scripts/service-uninstall.ps1` | 新建 | P0 |
| `scripts/service-start.ps1` | 新建 | P0 |
| `scripts/service-stop.ps1` | 新建 | P0 |
| `scripts/service-status.ps1` | 新建 | P0 |
| `scripts/service-dev.ps1` | 新建 | P0 |
| `pyproject.toml` | 增加 pywin32 optional-dep + 新 CLI 入口 | P0 |
| `src/api/v1/system.py` | 新增 `/api/v1/service/status` | P1 |
| `src/schemas/system.py` | 新增 ServiceStatusResponse | P1 |
| `tests/` | 多 profile 端口/reconcile/auto_start 测试 | P1 |
| `scripts/smoke-test.ps1` | 增加多 profile 并发启动测试 | P1 |

### 不需要改的

- `db/models/profile.py` — 字段已齐全
- `migrations/` — 无新表/列
- `api/v1/profiles.py` — 路由不变
- `copilot-desktop/` — P2，暂不改（Electron 对接在后续版本）

## 四、风险项

| 风险 | 等级 | 缓解 |
|------|------|------|
| pywin32 在 uv/venv 环境下 Windows Service 安装需要管理员权限 | 中 | service_cli 明确报错提示 |
| 孤儿 gateway 进程 kill 可能误杀同 PID 的其他进程 | 低 | 用 psutil 校验进程 cmdline |
| uvicorn.Server 在 Windows Service 内的 graceful shutdown | 中 | 使用 server.should_exit 而非死循环 |
| 端口扫描 max_scan=100 范围不够 | 低 | 可配置，100 已足够 |

## 五、验收标准

- [x] `smc-copilot-serve` CLI 可正常启动（main.py import 修复）
- [x] 创建多个 profile 时端口自动递增分配，不冲突
- [x] 同时启动多个 profile gateway，各自独立运行（需 Hermes 或 mock gateway）
- [x] 服务重启后 auto_start=true 的 profile 自动恢复
- [x] 服务重启后 reconcile 清理孤儿进程/脏状态
- [x] Windows Service CLI 可安装/启动/停止/卸载（需 `uv sync --extra service` + 管理员）
- [x] `/api/v1/service/status` 返回服务整体状态（P1）

## 六、实施状态

**已完成**（2026-05-21）。详见 `specs/team_v1.6/task.md` 与 `specs/team_v1.6/log.md`。
