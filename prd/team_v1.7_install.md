# team_v1.7 功能方案：copilot-desktop + copilot-serve 本地部署闭环

以下统一命名为：

```text
copilot-desktop: https://github.com/loudon84/ai-os-desktop
copilot-serve:   https://github.com/loudon84/ai-os-serve
```

你上面写的 `copilo-serve` 按 `copilot-serve` 处理，避免后续目录、脚本、环境变量不一致。

---

## 1. team_v1.7 版本目标

team_v1.7 的核心目标是把当前已经可运行的链路固化成 **Windows 10+ 一键部署方案**：

```text
copilot-desktop 安装器
  ├─ 安装 / 初始化 Hermes Agent
  ├─ 创建 bin/hermes.cmd
  ├─ 准备 runtime 目录
  └─ 提供 deploy-copilot-serve.ps1

deploy-copilot-serve.ps1
  ├─ 拉取 copilot-serve 到 runtime\copilot-serve
  ├─ 创建 Python 3.12 venv
  ├─ uv sync --extra service
  ├─ 写入 .env
  ├─ alembic upgrade head
  ├─ 设置 COPILOT_SERVE_ROOT
  ├─ 设置 COPILOT_SERVE_PYTHON
  └─ 重启 copilot-desktop

copilot-desktop Main Process
  ├─ 读取 COPILOT_SERVE_ROOT
  ├─ 启动 copilot-serve
  ├─ 注入 token
  ├─ 轮询 /api/v1/health
  └─ Renderer 调用本地 API

copilot-serve
  ├─ SQLite: ~/.hermes/desktop/sqlite.db
  ├─ Hermes Home: ~/.hermes
  ├─ Gateway Command: hermes gateway
  └─ Gateway Profile: default / writer / coding / ...
```

当前 `copilot-serve` 已经是 Python 3.12 + FastAPI + Uvicorn + SQLite + Alembic 架构，项目要求 `requires-python >=3.12,<3.13`，并已经提供 `smc-copilot-serve` 与 `ai-copilot-service` 两个入口。
当前 `copilot-desktop` 已经具备通过 Main Process 启动本地 `copilot-serve` 的基础能力：读取路径、spawn Python、注入 SQLite 路径和 token、健康检查。

---

## 2. 版本范围

## 2.1 本次必须完成

| 模块                        | team_v1.7 要完成的内容                                               |
| ------------------------- | -------------------------------------------------------------- |
| copilot-desktop installer | 创建 `runtime\copilot-serve` 目录，内置或释放 `deploy-copilot-serve.ps1` |
| deploy-copilot-serve.ps1  | 完成 copilot-serve 下载、venv、依赖、`.env`、迁移、环境变量、重启                  |
| Main Process              | 优先识别 `$INSTDIR\runtime\copilot-serve`，兼容 `COPILOT_SERVE_ROOT`  |
| Renderer                  | 增加 copilot-serve 安装 / 状态 / 启动失败日志入口                            |
| copilot-serve             | 保持 API 不破坏，补充 Windows 部署脚本和文档                                  |
| 验收脚本                      | 提供 Windows 一键 smoke test                                       |

## 2.2 本次不做

| 不做项                     | 原因                                                                           |
| ----------------------- | ---------------------------------------------------------------------------- |
| 默认启用 Windows Service 模式 | 当前 desktop 会自己 spawn copilot-serve，Service 会造成 8765 端口抢占                     |
| 修改 Hermes Gateway 内部逻辑  | copilot-serve 只负责 supervisor 和代理                                             |
| 修改 `/api/v1/*` API 路径   | Renderer 和已有联调依赖当前 API                                                       |
| 改名环境变量为新前缀              | 继续使用 `COPILOT_SERVE_ROOT / COPILOT_SERVE_PYTHON / COPILOT_SERVE_PORT`，降低迁移风险 |

---

## 3. 安装目录规范

Windows 默认目录：

```text
%LOCALAPPDATA%\Programs\SMC Copilot\
├── SMC Copilot.exe
├── bin\
│   ├── smc-copilot.cmd
│   ├── hermes-desktop.cmd
│   └── hermes.cmd
└── runtime\
    ├── hermes-agent\
    ├── copilot-serve\
    │   ├── pyproject.toml
    │   ├── .venv\
    │   ├── .env
    │   ├── src\
    │   ├── migrations\
    │   └── scripts\
    ├── logs\
    ├── cache\
    └── downloads\

%USERPROFILE%\.hermes\
├── profiles\
├── desktop\
│   ├── sqlite.db
│   └── copilot-serve.log
└── ...
```

当前安装器已经会创建 `runtime\hermes-agent`、`runtime\logs`、`runtime\cache`、`runtime\downloads`，并创建 `bin\hermes.cmd`。team_v1.7 在这个基础上新增 `runtime\copilot-serve`。

---

## 4. deploy-copilot-serve.ps1 设计

脚本位置：

```text
copilot-desktop/
├── build/
│   └── scripts/
│       └── deploy-copilot-serve.ps1
```

安装后释放到：

```text
%LOCALAPPDATA%\Programs\SMC Copilot\runtime\deploy-copilot-serve.ps1
```

### 4.1 参数设计

```powershell
param(
  [string]$InstallRoot = "$env:LOCALAPPDATA\Programs\SMC Copilot",
  [string]$RepoUrl = "https://github.com/loudon84/ai-os-serve.git",
  [string]$Branch = "master",
  [int]$Port = 8765,
  [switch]$Force,
  [switch]$RestartDesktop
)
```

### 4.2 执行流程

```text
1. 检查 Windows 版本
2. 检查 Git
3. 检查 Python 3.12
4. 检查 / 安装 uv
5. 创建 runtime\copilot-serve
6. clone / pull copilot-serve
7. 创建 .venv
8. uv sync --extra service
9. 写入 .env
10. alembic upgrade head
11. 设置用户环境变量
12. 写入 deploy-state.json
13. 可选重启 copilot-desktop
```

### 4.3 写入 .env

生成：

```env
COPILOT_HOST=127.0.0.1
COPILOT_PORT=8765

SQLITE_PATH=~/.hermes/desktop/sqlite.db
HERMES_HOME=~/.hermes
LOG_DIR=./data/logs

DEFAULT_GATEWAY_PORT=8642
HERMES_GATEWAY_COMMAND=hermes gateway

AIOS_TEAM_HUB_USE_STUB=true

COPILOT_REQUIRE_TOKEN=false
CORS_ALLOW_ORIGINS=http://127.0.0.1,http://localhost
```

`copilot-serve` 当前默认 SQLite 路径就是 `~/.hermes/desktop/sqlite.db`，默认 Hermes Home 是 `~/.hermes`，默认端口是 `8765`。
数据库迁移必须显式执行 `alembic upgrade head`，因为应用启动时不再自动 `create_all`。

### 4.4 设置环境变量

```powershell
[Environment]::SetEnvironmentVariable("COPILOT_SERVE_ROOT", "$ServeRoot", "User")
[Environment]::SetEnvironmentVariable("COPILOT_SERVE_PYTHON", "$ServeRoot\.venv\Scripts\python.exe", "User")
[Environment]::SetEnvironmentVariable("COPILOT_SERVE_PORT", "$Port", "User")
```

当前 `copilot-desktop` 已经通过 `COPILOT_SERVE_ROOT` 查找服务根目录，并要求目录下存在 `pyproject.toml`。

---

## 5. copilot-desktop Main Process 改造

## 5.1 copilot-serve 路径识别

修改：

```text
src/main/copilot-serve/copilot-serve-paths.ts
```

当前识别顺序是：

```text
1. COPILOT_SERVE_ROOT
2. process.cwd()\copilot-serve
3. process.cwd()\..\copilot-serve
4. 若干开发态相对路径
```

team_v1.7 增加安装态路径：

```text
$APP_INSTALL_DIR\runtime\copilot-serve
$APP_INSTALL_DIR\resources\runtime\copilot-serve
```

优先级：

```text
1. COPILOT_SERVE_ROOT
2. desktop-runtime.json 中的 runtimeRoot\copilot-serve
3. app.getPath("exe") 推导的 runtime\copilot-serve
4. 开发态候选路径
```

## 5.2 Python 解释器识别

当前默认使用：

```ts
process.env.COPILOT_SERVE_PYTHON || "python"
```

team_v1.7 调整为：

```text
1. COPILOT_SERVE_PYTHON
2. <COPILOT_SERVE_ROOT>\.venv\Scripts\python.exe
3. py -3.12
4. python
```

这样用户不需要手工配置 Python 路径。

## 5.3 启动命令保持不变

继续使用：

```text
python -m uvicorn main:app --app-dir src --host 127.0.0.1 --port 8765
```

当前代码就是这种启动方式，并注入 `SQLITE_PATH`、`COPILOT_DESKTOP_TOKEN`、`COPILOT_REQUIRE_TOKEN=true`。

## 5.4 token 策略

保持当前策略：

```text
/api/v1/health 不需要 token
其它 /api/v1/* 默认由 desktop 注入 X-Copilot-Desktop-Token
```

`copilot-serve` 当前 `verify_desktop_token` 已经支持该策略。

---

## 6. Renderer 功能入口

新增页面或卡片：

```text
Settings / Runtime / Copilot Serve
```

功能：

```text
1. 当前状态
   - installed / missing / starting / running / degraded / error / stopped
   - pid
   - port
   - baseUrl
   - logPath
   - lastError

2. 操作按钮
   - 安装 copilot-serve
   - 启动
   - 停止
   - 重启
   - 查看日志
   - 打开 runtime 目录

3. 验证项
   - Python 3.12
   - Git
   - uv
   - pyproject.toml
   - .venv\Scripts\python.exe
   - .env
   - SQLite
   - /api/v1/health
```

IPC 复用当前：

```text
copilot-serve:get-connection
copilot-serve:get-status
copilot-serve:get-logs
copilot-serve:start
copilot-serve:stop
copilot-serve:restart
```

当前这些 IPC 已存在。

新增 IPC：

```text
copilot-serve:deploy
copilot-serve:precheck
copilot-serve:open-runtime-dir
```

---

## 7. copilot-serve 侧改造

## 7.1 保持 API 稳定

保留：

```text
GET  /api/v1/health
GET  /api/v1/service/status
GET  /api/v1/profiles
POST /api/v1/profiles
POST /api/v1/profiles/{profile_id}/start
POST /api/v1/profiles/{profile_id}/stop
GET  /api/v1/profiles/{profile_id}/status
GET  /api/v1/profiles/{profile_id}/models
POST /api/v1/profiles/{profile_id}/runs
GET  /api/v1/tasks
GET  /api/v1/desktop/task-workbench/summary
GET  /api/v1/desktop/task-workbench/events/stream
```

当前 API contract 已经覆盖 System、Profiles、Gateways、Hermes proxy、Tasks、Team Tasks、Approvals、Workspaces、Desktop Workbench。

## 7.2 增加 Windows 部署脚本

新增：

```text
copilot-serve/
├── scripts/
│   ├── bootstrap-windows.ps1
│   ├── migrate-windows.ps1
│   └── smoke-test-windows.ps1
```

其中 `smoke-test-windows.ps1` 可以基于当前已有 `scripts/smoke-test.ps1` 扩展；当前脚本已经会检查 health、service status、创建 default/writer profile、验证端口、尝试启动 profile。

## 7.3 Windows Service 保留但不默认启用

`copilot-serve` 当前已经提供 Windows Service 命令，服务名是 `HermesLocalService`。 

team_v1.7 规则：

```text
默认模式：copilot-desktop Main Process spawn copilot-serve
可选模式：ai-copilot-service install/start
禁止同时启用：避免 8765 端口冲突
```

---

## 8. 安装器改造点

修改：

```text
copilot-desktop/
├── electron-builder.yml
├── build/
│   ├── installer.nsh
│   └── scripts/
│       └── deploy-copilot-serve.ps1
```

## 8.1 installer.nsh 新增目录

在 `customInstall` 中增加：

```nsh
CreateDirectory "$INSTDIR\runtime\copilot-serve"
CreateDirectory "$INSTDIR\runtime\copilot-serve-cache"
```

## 8.2 释放部署脚本

```nsh
SetOutPath "$INSTDIR\runtime"
File "build\scripts\deploy-copilot-serve.ps1"
```

## 8.3 desktop-runtime.json 增加字段

```json
{
  "productName": "SMC Copilot",
  "runtimeRoot": "$INSTDIR\\runtime",
  "agentDir": "$INSTDIR\\runtime\\hermes-agent",
  "copilotServeDir": "$INSTDIR\\runtime\\copilot-serve",
  "copilotServeDeployScript": "$INSTDIR\\runtime\\deploy-copilot-serve.ps1",
  "copilotServePort": 8765
}
```

---

## 9. team_v1.7 文件级任务清单

## 9.1 copilot-desktop

```text
build/scripts/deploy-copilot-serve.ps1
  新增。完整部署 copilot-serve。

build/installer.nsh
  增加 runtime\copilot-serve 目录和 deploy 脚本释放。

src/main/copilot-serve/copilot-serve-paths.ts
  增加安装态 runtime\copilot-serve 识别。

src/main/copilot-serve/copilot-serve-process.ts
  增加 .venv Python 自动识别。
  增加部署缺失状态。
  增加启动前 preflight。

src/main/copilot-serve/copilot-serve-ipc.ts
  增加 deploy/precheck/open-runtime-dir IPC。

src/preload/index.ts
  暴露 copilotServe.deploy / precheck / openRuntimeDir。

src/renderer/src/screens/...
  增加 Copilot Serve Runtime 状态卡片。
```

## 9.2 copilot-serve

```text
scripts/bootstrap-windows.ps1
  新增。单仓库开发部署。

scripts/migrate-windows.ps1
  新增。执行 alembic upgrade head。

scripts/smoke-test-windows.ps1
  新增或复用 smoke-test.ps1。

README.md
  改名为 copilot-serve 说明。

docs/api-contract.md
  补充 team_v1.7 Windows Desktop 部署说明。

.env.example
  保持默认值，补充 HERMES_GATEWAY_COMMAND 说明。
```

---

## 10. 验收标准

## 10.1 干净 Windows 10 机器

前置环境：

```text
Python 3.12.x
Git for Windows
uv
copilot-desktop installer
```

验收：

```text
1. 安装 copilot-desktop 成功
2. 启动后能看到 Hermes Agent 已安装
3. bin\hermes.cmd 可执行
4. 点击安装 copilot-serve
5. runtime\copilot-serve 存在
6. runtime\copilot-serve\.venv 存在
7. ~/.hermes/desktop/sqlite.db 存在
8. /api/v1/health 返回 ok
9. /api/v1/service/status 返回 pid、port、sqlite_path、hermes_home
10. 创建 default profile 成功
11. 启动 default gateway 成功
12. /api/v1/profiles/{id}/models 能返回 Hermes Gateway 模型列表
```

## 10.2 升级安装

```text
1. 旧版本 desktop 可升级安装
2. ~/.hermes/desktop/sqlite.db 不删除
3. ~/.hermes/profiles 不删除
4. runtime\copilot-serve 可 pull 更新
5. alembic upgrade head 可重复执行
6. copilot-desktop 重启后自动恢复 copilot-serve 连接
```

## 10.3 异常场景

```text
1. Git 不存在：Renderer 显示 Git 缺失，并提示安装前置环境
2. Python 不是 3.12：阻断部署
3. 8765 被占用：显示占用进程 PID
4. uv sync 失败：展示 deploy log
5. alembic 失败：停止部署，不启动服务
6. Hermes CLI 不存在：copilot-serve 可启动，但 profile start 失败并展示 gateway log
7. Gateway 启动失败：可通过 /api/v1/gateways/{id}/logs 查看日志
```

---

## 11. team_v1.7 交付物

```text
1. copilot-desktop Windows 安装器
2. deploy-copilot-serve.ps1
3. Copilot Serve Runtime 设置页
4. Main Process 自动启动 copilot-serve
5. copilot-serve Windows bootstrap / smoke test 脚本
6. team_v1.7 部署文档
7. Windows 10 验收记录
```

---

## 12. 最终运行链路

```text
用户安装 copilot-desktop
  ↓
安装器创建 runtime / bin / hermes.cmd
  ↓
首次启动进入 Runtime 检查
  ↓
执行 deploy-copilot-serve.ps1
  ↓
copilot-serve 安装到 runtime\copilot-serve
  ↓
写入 COPILOT_SERVE_ROOT / COPILOT_SERVE_PYTHON
  ↓
copilot-desktop 重启
  ↓
Main Process spawn copilot-serve
  ↓
Renderer 获取 connection
  ↓
Renderer 调用 /api/v1/*
  ↓
copilot-serve 管理 Hermes Gateway
  ↓
default / writer / coding profile 正常运行
```

这就是 team_v1.7 的核心交付边界：**copilot-desktop 负责安装、启动、状态展示；copilot-serve 负责本地控制面；Hermes Agent 负责 gateway 和 profile runtime。**
