# State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> SelectionReady: user_selects_range
    SelectionReady --> Submitting: submit_prompt
    Submitting --> Running: facade_task_created
    Running --> PatchProposed: agent_returns_patch
    Running --> CompletedNoPatch: agent_returns_answer
    Running --> Failed: task_failed
    PatchProposed --> Applying: user_approves
    PatchProposed --> Rejected: user_rejects
    Applying --> Applied: univer_patch_success
    Applying --> ApplyFailed: univer_patch_failed
    Applied --> Saving: save_snapshot
    Saving --> Saved: snapshot_saved
    Saving --> SaveFailed: snapshot_save_failed
```

## Constraints

- **Idle**：允许选择区域
- **SelectionReady**：允许提交 prompt（若 context 超限则禁止）
- **Running**：只允许查看事件/取消任务（MVP 可不实现 cancel）
- **PatchProposed**：允许预览/批准/拒绝
- **Applying**：禁止重复提交
- **Applied**：允许保存快照
- **Saved**：允许下一轮 AI 操作

