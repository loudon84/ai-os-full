# team_v1.6 实施任务

## P0（已完成）

- [x] Step 1: 修复 `src/main.py` `get_settings` import + `app_dir="src"`
- [x] Step 2: 重写 `port_allocator.py` + `profile_service.create_profile` 多 profile 端口分配
- [x] Step 3: `GatewayProcessManager` PID fallback stop
- [x] Step 4: `GatewaySupervisor.reconcile_on_boot` + `start_auto_start_profiles`
- [x] Step 5: `lifecycle.py` 接入 reconcile + auto_start（测试可通过 `_disable_gateway_autostart` 跳过）
- [x] Step 6: 新增 `src/local_service/` 包
- [x] Step 7: 新增 `scripts/service-*.ps1`
- [x] Step 8: `pyproject.toml` 增加 `service` extra + `ai-copilot-service` CLI

## P1（已完成）

- [x] Step 9: `GET /api/v1/service/status`
- [x] Step 10: 单元测试 + `smoke-test.ps1` 多 profile 扩展

## 验证

```powershell
cd copilot-serve
uv run pytest tests/test_port_allocator.py tests/test_gateway_process_pid.py tests/test_gateway_supervisor_boot.py tests/test_v1_acceptance.py -q
```
