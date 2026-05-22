# team_v1.6.1_hotfix 实施日志

## 2026-05-22

### 代码变更

- `src/local_service/windows_service.py` — 工作线程非 daemon；`SvcDoRun` 在 `join()` 上阻塞直至 uvicorn 退出
- `src/services/profile_service.py` — `update_profile` 复用 `allocate_port`，冲突映射为 `ConflictError`
- `src/services/gateway_supervisor.py` — `shutdown_all` 按 DB running/starting/pid 停止进程并写审计；`_compute_status` 避免重复 health
- `tests/test_profile_port_update.py` — 端口更新 409
- `tests/test_gateway_shutdown_orphans.py` — untracked + shutdown_all
- `tests/test_gateway_autostart_lifespan.py` — lifespan autostart（单 profile）

### 测试

- 新增 3 项 + v1.6 回归：全部通过
