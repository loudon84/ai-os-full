## 结论

`HermesLocalService` 可以支持 **多个 Hermes Gateway Profile 同时启动**。当前代码已经具备基础条件：Profile 表里已有 `gateway_port / auto_start / status / gateway_pid` 字段，API 已有 `/profiles/{id}/start|stop|restart|status`，GatewaySupervisor 已能按 profile 启动子进程并做健康检查。 

但 ver1.6 要补齐的是：**把当前 FastAPI 进程内的 supervisor 升级为 Windows 常驻服务模式**，并解决多 profile 并发下的端口分配、进程恢复、开机自启、服务重启后的状态一致性问题。

---

# 1. 当前代码结构判断

当前 `ai-os-serve` 已经是一个本地控制面服务：

```text
src/
├─ app.py                  # FastAPI 应用创建、CORS、中间件
├─ main.py                 # uvicorn 启动入口
├─ core/
│  ├─ config.py             # .env / Settings / sqlite / hermes_home / gateway command
│  └─ lifecycle.py          # FastAPI lifespan，初始化 DB、Supervisor、Workers
├─ api/
│  ├─ router.py             # /api/v1 路由聚合
│  └─ v1/
│     ├─ profiles.py        # profile 管理与 gateway start/stop/status
│     ├─ gateways.py        # gateway health/logs
│     ├─ hermes_runs.py     # 转发 Hermes /v1/models /v1/runs
│     └─ system.py          # 本地服务信息
├─ services/
│  ├─ gateway_supervisor.py # Hermes gateway 子进程生命周期管理
│  └─ profile_service.py    # profile CRUD + config sync
├─ runtime/
│  ├─ gateway_process.py    # subprocess 启停、日志文件
│  └─ port_allocator.py     # 当前端口分配过于简单
├─ integrations/hermes/
│  └─ client.py             # Hermes Gateway HTTP client
└─ db/
   ├─ models/profile.py
   └─ repositories/profile_repo.py
```

`app.py` 已经将 FastAPI 包装为本地服务应用，挂载统一 `/api/v1` 路由，并使用自定义 CORS 中间件，适合被 Electron Renderer 访问。

`lifecycle.py` 负责创建数据库 engine、session、GatewaySupervisor、TeamHub、任务 worker，并在关闭时执行 `supervisor.shutdown_all()`。这说明当前 Hermes Gateway 生命周期仍绑定在 FastAPI 进程生命周期内。

`GatewaySupervisor` 当前已实现 `start_profile / stop_profile / restart_profile / refresh_status / read_gateway_logs`，并在启动 profile 时调用 `GatewayProcessManager.start(profile.id, profile.name, profile.gateway_port)`。

`GatewayProcessManager` 当前用 `asyncio.create_subprocess_exec()` 启动 `hermes gateway --port <port> --profile <profile>`，日志写入 `data/logs/gateway-{profile}.log`。

---

# 2. 当前 ver1.6 必须修正的问题

## 2.1 `main.py` 有直接运行 bug

`main.py` 里调用了 `get_settings()`，但没有导入：

```python
settings = get_settings()
```

当前文件只导入了：

```python
from app import build_asgi_app
```

所以 `python src/main.py` 或 entrypoint 直接运行会触发 `NameError`。

**修正：**

```python
from core.config import get_settings
```

---

## 2.2 端口分配不支持多 profile

当前 `allocate_port()` 逻辑是：

```python
if requested is not None:
    return requested
return settings.default_gateway_port
```

这会导致多个 profile 默认都拿 `8642`，多 profile 同时启动必然端口冲突。

**ver1.6 必须改成：**

```text
default_gateway_port = 8642
profile default  -> 8642
profile writer   -> 8643
profile finance  -> 8644
profile research -> 8645
```

分配规则：

1. 用户指定端口：检查 DB 是否冲突，检查 OS 是否已监听。
2. 未指定端口：从 `DEFAULT_GATEWAY_PORT` 开始递增扫描。
3. 端口分配必须写入 SQLite。
4. 启动前再次做 OS 端口占用检查，避免脏数据。

---

## 2.3 服务重启后进程状态会丢失

当前 `GatewayProcessManager` 的 `_handles` 是内存字典：

```python
self._handles: dict[str, GatewayProcessHandle] = {}
```

一旦 HermesLocalService 重启，原来启动过的 gateway 子进程 handle 会丢失。

`GatewaySupervisor._compute_status()` 当前如果 DB 里是 `running`，但本地没有 handle，会把 profile 标记成 `error`，即使 PID 还存在。

ver1.6 要改成：

```text
服务启动
  ├─ 读取 profiles 表
  ├─ 对 status=running 的 profile 做 reconcile
  │   ├─ pid 存在 + health ok     -> 保持 running，标记 tracked=false
  │   ├─ pid 存在 + health failed -> kill 或标记 error
  │   └─ pid 不存在              -> stopped/error
  ├─ 对 auto_start=true 的 profile 自动启动
  └─ 写 audit_log
```

---

## 2.4 `auto_start` 字段已有，但未执行

Profile 模型中已有 `auto_start` 字段。

`ProfileService.create_profile()` 也已经保存 `body.auto_start`。

但 `lifecycle.py` 启动时没有调用 `start_auto_start_profiles()`。

ver1.6 要在 FastAPI lifespan 初始化完成后增加：

```python
await supervisor.reconcile_on_boot()
await supervisor.start_auto_start_profiles()
```

---

# 3. ver1.6 推荐架构

## 3.1 不要把每个 profile 做成独立 Windows Service

正确方式是：

```text
Windows Service: HermesLocalService
  ├─ FastAPI Local Control Plane : 127.0.0.1:8765
  ├─ SQLite : ~/.hermes/desktop/sqlite.db
  ├─ GatewaySupervisor
  │   ├─ default profile gateway : 127.0.0.1:8642
  │   ├─ writer profile gateway  : 127.0.0.1:8643
  │   ├─ finance profile gateway : 127.0.0.1:8644
  │   └─ research profile gateway: 127.0.0.1:8645
  └─ Logs
      ├─ local-service.log
      ├─ gateway-default.log
      ├─ gateway-writer.log
      └─ gateway-finance.log
```

原因：

1. Electron 只需要连接一个本地 API：`http://127.0.0.1:8765/api/v1`
2. 多 profile 只作为 HermesLocalService 的子进程管理。
3. Profile 启停、状态、日志、runs 都能通过统一 API 暴露。
4. 安装、升级、卸载复杂度最低。

---

# 4. Windows 常驻服务实现方案

## 4.1 Windows Service 优先使用 pywin32

`pywin32` 支持 Python 程序作为 Windows Service 运行，但官方说明中强调：服务模式通常需要全局安装 pywin32，并确保运行服务的账户能访问 Python 安装目录和相关 DLL。([PyPI][1])

ver1.6 推荐增加：

```toml
[project.optional-dependencies]
service = [
  "pywin32>=306; platform_system == 'Windows'"
]
```

## 4.2 增加服务入口

新增目录：

```text
src/local_service/
├─ __init__.py
├─ runner.py              # 纯 Python 服务运行器，负责启动 uvicorn
├─ windows_service.py     # pywin32 ServiceFramework
├─ service_state.py       # 服务状态、pid、版本、启动时间
└─ service_cli.py         # install/start/stop/remove/status 命令
```

## 4.3 增加脚本

```text
scripts/
├─ service-install.ps1
├─ service-uninstall.ps1
├─ service-start.ps1
├─ service-stop.ps1
├─ service-status.ps1
└─ service-dev.ps1
```

## 4.4 pyproject 增加 CLI

```toml
[project.scripts]
ai-copilot-serve = "main:main"
ai-copilot-service = "local_service.service_cli:main"
```

---

# 5. Cursor 执行稿：ver1.6 文件级改造

## 5.1 修复 `src/main.py`

目标：

```python
from __future__ import annotations

from app import build_asgi_app
from core.config import get_settings

app = build_asgi_app()


def main() -> None:
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "main:app",
        host=settings.copilot_host,
        port=settings.copilot_port,
        reload=False,
        app_dir="src",
    )


if __name__ == "__main__":
    main()
```

---

## 5.2 改造 `src/runtime/port_allocator.py`

目标：

```python
from __future__ import annotations

import socket

from core.config import Settings


def is_port_available(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.2)
        return sock.connect_ex((host, port)) != 0


def allocate_port(
    settings: Settings,
    requested: int | None,
    used_ports: set[int],
    *,
    max_scan: int = 100,
) -> int:
    if requested is not None:
        if requested in used_ports:
            raise ValueError(f"Gateway port already used by another profile: {requested}")
        if not is_port_available("127.0.0.1", requested):
            raise ValueError(f"Gateway port already occupied by OS process: {requested}")
        return requested

    base = settings.default_gateway_port
    for port in range(base, base + max_scan):
        if port in used_ports:
            continue
        if is_port_available("127.0.0.1", port):
            return port

    raise ValueError(f"No available gateway port in range {base}-{base + max_scan - 1}")
```

同时修改 `ProfileService.create_profile()`：

```python
profiles = await self._repo.list_all()
used_ports = {p.gateway_port for p in profiles}
port = allocate_port(self._settings, body.gateway_port, used_ports)
```

---

## 5.3 改造 `GatewayProcessManager`

新增能力：

```text
start()
stop()
shutdown_all()
read_logs()
is_pid_alive(pid)
terminate_pid(pid)
```

当前 stop 只能停止 `_handles` 里的进程。服务重启后 `_handles` 丢失，必须增加 PID fallback：

```python
async def stop(self, profile_id: str, *, pid: int | None = None) -> None:
    handle = self._handles.pop(profile_id, None)

    if handle is not None:
        await self._stop_handle(handle)
        return

    if pid and psutil.pid_exists(pid):
        proc = psutil.Process(pid)
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except psutil.TimeoutExpired:
            proc.kill()
```

---

## 5.4 改造 `GatewaySupervisor`

新增方法：

```python
async def reconcile_on_boot(self) -> None:
    """
    HermesLocalService 启动时执行：
    - 修复 running 但 pid 不存在的 profile
    - 保留 pid 存在且 health ok 的 profile
    - 清理 pid 存在但 health failed 的脏进程
    """

async def start_auto_start_profiles(self) -> list[ProfileStatusResponse]:
    """
    启动 enabled=true and auto_start=true 的 profile。
    """
```

`stop_profile()` 要改成：

```python
await self._process_manager.stop(profile.id, pid=profile.gateway_pid)
```

而不是只依赖内存 handle。

---

## 5.5 改造 `src/core/lifecycle.py`

在创建 `supervisor` 后加入：

```python
await supervisor.reconcile_on_boot()
await supervisor.start_auto_start_profiles()
```

建议位置：

```python
app.state.gateway_supervisor = supervisor
...
await supervisor.reconcile_on_boot()
await supervisor.start_auto_start_profiles()
```

注意：测试场景要允许关闭自动启动，例如：

```python
disable_gateway_autostart = bool(getattr(app.state, "_disable_gateway_autostart", False))
if not disable_gateway_autostart:
    await supervisor.reconcile_on_boot()
    await supervisor.start_auto_start_profiles()
```

---

## 5.6 新增 `src/local_service/runner.py`

职责：以普通进程方式启动本地 API，用于 Windows Service 和开发模式复用。

```python
from __future__ import annotations

import uvicorn

from core.config import get_settings


def run_local_service() -> None:
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host=settings.copilot_host,
        port=settings.copilot_port,
        reload=False,
        app_dir="src",
        access_log=False,
    )
```

---

## 5.7 新增 `src/local_service/windows_service.py`

职责：pywin32 Windows Service 包装器。

核心逻辑：

```python
class HermesLocalWindowsService(win32serviceutil.ServiceFramework):
    _svc_name_ = "HermesLocalService"
    _svc_display_name_ = "Hermes Local Service"
    _svc_description_ = "Local API and Hermes gateway supervisor for smc-copilot desktop"

    def SvcDoRun(self):
        self.ReportServiceStatus(win32service.SERVICE_START_PENDING)
        self.ReportServiceStatus(win32service.SERVICE_RUNNING)
        run_local_service()

    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        # 触发 uvicorn shutdown
        self.ReportServiceStatus(win32service.SERVICE_STOPPED)
```

实际实现时不要把 `uvicorn.run()` 放在无法退出的死循环里。需要可控 shutdown，可以使用 `uvicorn.Server(config)` 并设置 `server.should_exit = True`。

---

## 5.8 新增 `src/local_service/service_cli.py`

支持命令：

```bash
ai-copilot-service install
ai-copilot-service start
ai-copilot-service stop
ai-copilot-service restart
ai-copilot-service remove
ai-copilot-service status
ai-copilot-service run
```

Windows 无管理员权限时，`install` 应明确失败，不要静默降级。

---

# 6. ver1.6 API 保持策略

不需要大改现有 API。当前已有：

```text
GET    /api/v1/system/info
GET    /api/v1/profiles
POST   /api/v1/profiles
POST   /api/v1/profiles/{profile_id}/start
POST   /api/v1/profiles/{profile_id}/stop
POST   /api/v1/profiles/{profile_id}/restart
GET    /api/v1/profiles/{profile_id}/status
GET    /api/v1/gateways/{gateway_id}/health
GET    /api/v1/gateways/{gateway_id}/logs
GET    /api/v1/profiles/{profile_id}/models
POST   /api/v1/profiles/{profile_id}/runs
GET    /api/v1/profiles/{profile_id}/runs/{run_id}
GET    /api/v1/profiles/{profile_id}/runs/{run_id}/events
```

这些路由已经在 `api/router.py` 中统一挂载到 `/api/v1`。

ver1.6 建议只新增：

```text
GET /api/v1/service/status
```

返回：

```json
{
  "service": "HermesLocalService",
  "version": "1.6.0",
  "pid": 1234,
  "uptime_seconds": 3600,
  "host": "127.0.0.1",
  "port": 8765,
  "sqlite_path": "~/.hermes/desktop/sqlite.db",
  "hermes_home": "~/.hermes",
  "profiles": {
    "total": 3,
    "running": 2,
    "error": 0
  }
}
```

---

# 7. Electron 对接方式

Electron Main Process 只负责检查和启动 HermesLocalService：

```text
Electron Main
  ├─ 检查 127.0.0.1:8765/api/v1/health
  ├─ 如果不可用：
  │   ├─ 优先调用 Windows Service start
  │   └─ 开发模式下 fallback 到 ai-copilot-service run
  ├─ 不直接启动 hermes gateway profile
  └─ 不直接管理 gateway pid
```

Electron Renderer 只访问：

```text
http://127.0.0.1:8765/api/v1
```

Renderer 不感知 Hermes Gateway 真实端口。Profile 页面显示端口、PID、状态、日志即可。

---

# 8. 验收用例

## 8.1 服务启动

```powershell
ai-copilot-service install
ai-copilot-service start
curl http://127.0.0.1:8765/api/v1/system/info
```

预期：

```json
{
  "service": "ai-copilot-serve",
  "hermes_home": "...",
  "default_gateway_port": 8642
}
```

## 8.2 创建多个 profile

```bash
POST /api/v1/profiles
{
  "name": "default",
  "type": "default",
  "auto_start": true
}

POST /api/v1/profiles
{
  "name": "writer",
  "type": "writer",
  "auto_start": true
}
```

预期：

```text
default -> 8642
writer  -> 8643
```

不能都分配到 8642。

## 8.3 同时启动多个 gateway

```bash
POST /api/v1/profiles/{default_id}/start
POST /api/v1/profiles/{writer_id}/start
```

预期：

```text
default status = running, healthy = true
writer  status = running, healthy = true
```

## 8.4 服务重启恢复

```powershell
ai-copilot-service restart
```

预期：

```text
auto_start=true 的 profile 自动恢复
running 但 pid 丢失的 profile 被 reconcile
孤儿 gateway 不造成状态假 running
```

## 8.5 Electron 启动

Electron 打开后：

```text
1. 检查 /api/v1/service/status
2. 加载 profiles
3. 显示每个 profile 的 running/stopped/error
4. 可点击 start/stop/restart
5. 可查看 gateway logs
```

---

# 9. ver1.6 优先级

## P0：必须完成

```text
1. 修复 main.py get_settings import
2. 修复多 profile 端口分配
3. GatewayProcessManager 增加 pid fallback stop
4. GatewaySupervisor 增加 reconcile_on_boot
5. GatewaySupervisor 增加 start_auto_start_profiles
6. lifecycle 接入 reconcile + auto_start
7. 新增 Windows Service CLI
8. 新增 scripts/service-*.ps1
```

## P1：建议完成

```text
1. /api/v1/service/status
2. profile events 里写入 service_boot / profile_autostart / profile_reconciled
3. gateway logs 增加按 profile name fallback
4. smoke-test.ps1 增加多 profile 并发启动测试
```

## P2：后续优化

```text
1. Windows Job Object 管理子进程树
2. 服务崩溃后 gateway orphan 自动清理策略
3. Electron 安装器集成 Windows Service 安装
4. UI 增加 Local Service 管理页
```

---

# 10. 最终判断

当前 `ai-os-serve` 已经具备 ver1.6 的基础框架，不需要推倒重做。核心改造点是：

```text
HermesLocalService = Windows 常驻服务
GatewaySupervisor = 多 profile 子进程管理器
SQLite profiles = profile / port / auto_start / pid / status 状态源
Electron = 只调用 127.0.0.1:8765 的本地 API
Hermes Gateway = 由 HermesLocalService 按 profile 启停
```

这条路线可以支撑 Windows 10 环境下的本地 API、Hermes Gateway 多 profile 同时运行、开机自启和 Electron 桌面统一管理。

[1]: https://pypi.org/project/pywin32/ "pywin32 · PyPI"
