# team_v1.7.1_hotfix：copilot-serve 部署闭环修补

## 目标

在 [team_v1.7_install.md](team_v1.7_install.md) 已交付基础上，修复 code review 与验收暴露的缺口，**不改变** `/api/v1/*` 契约，**不默认启用** Windows Service，git 默认分支仍为 **master**。

## 修复项

| ID | 问题 | 修复 |
|----|------|------|
| H1 | `uv sync` / `uv venv` 无退出码检查 | `deploy-copilot-serve.ps1` 增加 `Assert-LastExit` |
| H2 | 部署后当前 Electron 进程读不到 User env | `applyCopilotServeEnvFromDisk()` 在 deploy 成功后写入 `process.env` |
| H3 | 部署日志非流式 | IPC `copilot-serve:deploy-progress` + Settings UI 订阅 |
| M1 | 8765 占用未在 runtime preflight | `checkCopilotServePort()` + Win `netstat` PID |
| M2 | `missing`/`stopped` 状态误判 | 以 `runtimeDir` + `pyproject.toml` 区分 |
| M3 | 升级用户缺 `copilotServe*` 字段 | `mergeRuntimeConfig` 显式合并三字段 |
| M4 | deploy 类型重复定义 | 统一使用 `copilot-serve-contract.ts` |
| L1 | 非 Windows 调用 deploy | 返回明确错误 |
| L2 | Portal Runtime 条不同步 | `emitStatusChanged` 写 `runtime_services` |
| L3 | UI `stop` 未 await | `await copilotServe.stop()` |

## 涉及文件（copilot-desktop）

- `build/scripts/deploy-copilot-serve.ps1`
- `src/main/copilot-serve/copilot-serve-{paths,deploy,preflight,process,ipc,runtime-state}.ts`
- `src/shared/copilot-serve/copilot-serve-contract.ts`
- `src/preload/copilot-serve-api.ts`
- `src/main/enterprise/desktop-runtime-config.ts`
- `src/renderer/.../CopilotServeRuntimeSection.tsx`

## 验收记录模板

| # | 场景 | 步骤 | 期望 | 结果 | 备注 |
|---|------|------|------|------|------|
| 1 | uv sync 失败 | 断网或破坏 lock 后 deploy | 非 0 退出；UI 流式日志有错误；`deploy-state.json` 为 failed | | |
| 2 | 同会话 deploy+start | deploy 成功不重启 desktop → 点启动 | health OK | | |
| 3 | 8765 占用 | 外部进程占 8765 → precheck | `port8765` fail，detail 含 PID | | |
| 4 | 升级 json | 旧 `desktop-runtime.json` 无 copilot 字段 → 启动 app | Settings 可找到 deploy 脚本 | | |
| 5 | Runtime 条 | deploy/start 后看 Portal 顶栏 | copilot-serve 与 Settings 状态一致 | | |
| 6 | 类型检查 | `npx tsc --noEmit` | 通过 | | |

## 边界（未做）

- `runtime/copilot-serve-cache` 目录逻辑
- Settings 文案 i18n
- 默认 git 分支改为 ver5.0
