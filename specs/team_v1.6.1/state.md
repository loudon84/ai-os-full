# team_v1.6.1_hotfix — 状态

> 基于 team_v1.6 代码 review 的最小补丁（仅 copilot-serve）

## 修复项

| ID | 问题 | 状态 |
|----|------|------|
| P0-1 | Windows Service `daemon=True` 导致 uvicorn 崩溃后 SCM 仍显示 RUNNING | 已修复 |
| P0-2 | `update_profile` 改端口无冲突检测 | 已修复 |
| P0-3 | `shutdown_all` 不清理 reconcile 后 untracked 的 Gateway 子进程 | 已修复 |
| P1-1 | `_compute_status` 重复 health 检查 | 已修复 |
| P1-2 | auto_start / shutdown 自动化测试 | 已补充 |

## 明确不改

- reconcile 时 PID 不存在仍标 `ERROR`（用户确认）
- Electron Service 集成、Job Object、PID cmdline 校验（P2）

## 验收清单

- [x] `windows_service.py`：`daemon=False`，`SvcDoRun` 阻塞 `join`，`SvcStop` 调用 `request_shutdown` + `join(30s)`
- [x] `PATCH /profiles/{id}` 端口与已有 profile 冲突返回 409
- [x] `shutdown_all` 后 untracked running 的 gateway PID 已终止，DB 为 `stopped`
- [x] lifespan + `auto_start` 单 profile 测试通过
- [x] v1.6 相关回归测试通过

## 验证命令

```powershell
cd copilot-serve
uv run pytest tests/test_profile_port_update.py tests/test_gateway_shutdown_orphans.py tests/test_gateway_autostart_lifespan.py tests/test_gateway_supervisor_boot.py tests/test_port_allocator.py tests/test_gateway_process_pid.py tests/test_v1_acceptance.py -q
```
