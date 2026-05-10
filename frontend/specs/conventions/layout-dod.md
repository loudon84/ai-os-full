# Layout DoD

> 用途：每次新增页面、重构页面、增加功能模块后，Cursor / Agent 必须执行本检查。
> 目标：保证页面 Layout 符合 `specs/layout-structure.md`，避免绕过 Dashboard Shell、重复造 Layout、错误接入 Copilot。

---

## 1. Route 检查

- [ ] 页面放在正确 route group
- [ ] 需要登录的页面放在 `app/[lang]/(dashboard)/`
- [ ] 不需要登录的页面没有误放入 `(dashboard)`
- [ ] 已确认是否需要共享 route group layout
- [ ] `page.tsx` 只做挂载，不堆复杂业务逻辑
- [ ] 业务页面主体落在 `modules/<domain>/pages/*`

---

## 2. Shell 检查

- [ ] 未修改 `app/[lang]/layout.tsx`
- [ ] 未修改 `app/[lang]/(dashboard)/layout.tsx`
- [ ] 未修改 `provider/*`
- [ ] 未修改 `components/ui/*`
- [ ] 页面继承正确的 Header / Sidebar / Footer / ThemeCustomize
- [ ] 页面继承正确的 Auth protection
- [ ] 页面继承正确的 i18n / DirectionProvider
- [ ] 页面没有重复创建全局 Provider

---

## 3. Template 检查

- [ ] 已选择 6 个页面母版之一
- [ ] 页面区块顺序符合所选母版
- [ ] 页面不是随意卡片堆叠
- [ ] 页面有清晰的业务对象
- [ ] 页面有清晰的主操作
- [ ] 页面有清晰的状态信息
- [ ] 页面有清晰的下一步操作
- [ ] 复杂页面使用 RightDrawer / Inspector / DetailPanel，而不是把所有详情塞进主列表

### 3.1 模板对应检查

#### WorkspaceDashboardTemplate

适用：Dashboard、Finance、Risk、运营概览。

- [ ] 有 PageHeader
- [ ] 有 KPI / Summary 区
- [ ] 有关键告警或趋势
- [ ] 有主数据区
- [ ] 可选 RightInsightPanel / Copilot Insight

#### DataManagementTemplate

适用：用户、任务、文件、知识库、审批列表。

- [ ] 有 PageHeader
- [ ] 有 FilterBar / Search
- [ ] 有 DataTable / List
- [ ] 有 Empty / Loading / Error / Forbidden
- [ ] 有 Row Action
- [ ] 危险操作有确认
- [ ] 可选 BulkActionBar
- [ ] 可选 RightDrawer / Inspector

#### AgentWorkspaceTemplate

适用：AI 助手工作页、会话中心、多 Agent 协作。

- [ ] 有 PageHeader
- [ ] 有 ContextPanel
- [ ] 有 Stream / Conversation / Task Flow
- [ ] 有 ExecutionTimeline / StepPanel
- [ ] 有 ResultPanel / References
- [ ] 有 PromptComposer
- [ ] 有 Feedback / Retry / Approve

#### ExecutionDetailTemplate

适用：Workflow、Agent Run、审批流明细。

- [ ] 有 RunHeader
- [ ] 有状态、Owner、时间、关键动作
- [ ] 有 RunStatusSummary
- [ ] 有 ExecutionTimeline
- [ ] 有 StepLogViewer
- [ ] 有 Artifacts / Result
- [ ] 有 AuditInfo
- [ ] 失败状态有 Retry / Diagnose / View Logs

#### DocumentWorkspaceTemplate

适用：文档、知识库、Univer、Article Studio。

- [ ] 有 DocumentTopBar
- [ ] 有保存状态
- [ ] 有权限 / 分享 / 版本入口
- [ ] 有 DocumentTree / WorkspaceFiles
- [ ] 有 EditorCanvas
- [ ] 有 RightAIPanel
- [ ] 可选 VersionHistoryDrawer
- [ ] 主编辑区不会被 Sidebar / Copilot 挤压到不可用

#### SettingsTemplate

适用：Agent、Workflow、Tool、MCP、Skill、RBAC、系统设置。

- [ ] 有 SettingsTabs / SideNav
- [ ] 有 FormSection / ConfigTable
- [ ] 有说明或测试区域
- [ ] 高风险操作进入 DangerZone
- [ ] 保存、测试、重置操作分级明确
- [ ] 表单有校验与错误提示

---

## 4. Page-level Layout 检查

- [ ] 已确认是否需要新增 `layout.tsx`
- [ ] 没有为简单页面滥用页面级 `layout.tsx`
- [ ] 明细页如需文件树，已使用 WorkspaceLayout
- [ ] 文档类页面已考虑 WorkspaceFiles / EditorCanvas / RightAIPanel
- [ ] 表格类页面已考虑 FilterBar / DataTable / RightDrawer
- [ ] 配置类页面已考虑 SettingsTabs / FormSection / DangerZone
- [ ] 页面内部滚动边界明确
- [ ] 主内容区有合理 `min-width` 或 overflow 处理

---

## 5. AI Layout 检查

仅适用于 AI / Agent / Workflow / Task Execution 页面。

- [ ] 有 PromptInput 或 TaskForm
- [ ] 有 ContextPanel
- [ ] 有 ExecutionStatePanel
- [ ] 有 ExecutionTimeline
- [ ] 有 ResultPanel
- [ ] 有 References / Sources
- [ ] 有 Feedback / Retry / Approve
- [ ] 使用全局 Copilot
- [ ] 未新建 Copilot Provider
- [ ] 未修改 GlobalCopilotProvider
- [ ] Copilot 打开时主内容不会被遮挡
- [ ] Waiting Human / Failed / Running 状态有明确 UI
- [ ] 长任务有当前步骤、日志、错误恢复入口

---

## 6. State 检查

每个页面必须覆盖：

- [ ] Loading
- [ ] Empty
- [ ] Error
- [ ] Forbidden

按场景补充：

- [ ] Saving
- [ ] Running
- [ ] Waiting Human
- [ ] Partial Success
- [ ] Failed
- [ ] No Data but Has Permission
- [ ] Has Data but No Action Permission

要求：

- [ ] 状态不是只用 toast 表达
- [ ] Error 有重试入口
- [ ] Forbidden 有角色 / 权限说明
- [ ] Empty 有下一步操作
- [ ] Loading 不造成大幅布局跳动

---

## 7. Responsive 检查

- [ ] 主内容不会被 Sidebar / Copilot 挤压到不可用
- [ ] Drawer / Inspector 在小屏可关闭
- [ ] 表格页面有横向溢出处理
- [ ] 文档 / 编辑器页面有最小宽度策略
- [ ] 移动端能使用 MobileSidebar
- [ ] 固定底部操作栏不会遮挡内容
- [ ] Copilot Sidebar 开关后内容区联动正常

---

## 8. Code Boundary 检查

- [ ] 没有把业务逻辑写进 `app/[lang]/**/page.tsx`
- [ ] 没有把业务组件写进 `components/ui/*`
- [ ] 没有新增重复基础 UI 组件
- [ ] 没有引入 AntD / MUI / Chakra / Bootstrap
- [ ] 没有硬编码颜色
- [ ] 使用 Tailwind semantic token
- [ ] 使用现有 shadcn/ui 本地组件
- [ ] 类型定义放在 `modules/<domain>/types/*`
- [ ] mock 数据放在 `modules/<domain>/mocks/*`
- [ ] service 占位放在 `modules/<domain>/services/*`
- [ ] hooks 放在 `modules/<domain>/hooks/*`

---

## 9. Layout Decision 文件检查

- [ ] 已存在 `layout-decision.md` 或 Page Spec 中包含 `Layout Decision` 章节
- [ ] Layout Decision 包含 route type
- [ ] Layout Decision 包含 page template
- [ ] Layout Decision 包含 shell inheritance
- [ ] Layout Decision 包含 page-level layout 判断
- [ ] Layout Decision 包含 Copilot 判断
- [ ] Layout Decision 包含 forbidden changes
- [ ] Layout Decision 与最终代码一致

---

## 10. 最终结论

Agent 在任务结束前必须输出：

```md
## Layout DoD Result

- Route: pass/fail
- Shell: pass/fail
- Template: pass/fail
- Page-level Layout: pass/fail
- AI Layout: pass/fail/not-applicable
- State: pass/fail
- Responsive: pass/fail
- Code Boundary: pass/fail
- Layout Decision File: pass/fail

结论：
- [ ] 可以交付
- [ ] 需要修复
```

如果任一强制项为 `fail`，不得声明任务完成。
