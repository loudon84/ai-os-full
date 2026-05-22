# Hermes Multi Profiles 角色初始化方案

版本：**team_v1.4**

## 1. 目标

在 `copilot-desktop` 与 `copilot-serve` 的 multi_profiles 架构上，引入 `agency-agents-zh` 作为 Hermes 专家角色初始化库。每个 Hermes Profile 独立端口、独立 Profile Home、独立 `SOUL.md`、`MEMORY.md`、`role-source skills`，由 Desktop 负责本机安装与 UI 管理，由 Serve 负责 API、Gateway Supervisor、任务路由与事件流。

关键约束：**角色名称不要带端口号**。端口只作为 Runtime 配置，不进入 `roleName`、SOUL 标题、页面标题。

---

## 2. 当前代码判断

### 2.1 copilot-desktop

`copilot-desktop` 已经具备 multi_profiles 的主要落点。现有代码中，`profile-runtime-db.ts` 使用 SQLite 管理 `profiles`、`runtime_instances`、`profile_entries`、`profile_capabilities`、`profile_skills`、`shared_contexts`、`delegation_events`、`audit_events`，并在 schema v3 增加 `profile_role_specs`，适合承载 role source、SOUL/MEMORY 路径、checksum 等初始化信息。([GitHub][1])

角色库相关链路也已经存在：`role-library-sync.ts` 会把角色库 clone / fetch 到 `HERMES_HOME/desktop/role-library/agency-agents-zh`，并记录同步审计；`role-install-service.ts` 已有 `roleSpec` 校验、sourcePaths 校验、角色源文件复制、`profile_role_specs` 写入、`profile_skills` 写入和 audit event 记录；`role-compiler.ts` 已能生成 `SOUL.md`、`MEMORY.md`、`profile-role.json`。([GitHub][2])

结论：**team_v1.4 不需要重做 multi_profiles 底座**，应在现有 `profile-runtime`、`profile-roles`、SQLite schema 上补齐新的 preset、role source mapping、UI 操作与 Serve API 对齐。

### 2.2 copilot-serve

`copilot-serve` 当前目录包含 `src/api`、`src/core`、`src/db`、`src/integrations`、`src/runtime`、`src/schemas`、`src/services`、`src/workers` 等主结构，符合本地服务/API/运行时控制层定位。([GitHub][3])

其中 `src/services` 已包含 `gateway_supervisor.py`、`hermes_gateway_client.py`、`profile_service.py`、`task_runtime.py`、`task_state_machine.py`、`workbench_event_stream.py` 等文件；`src/runtime` 已包含 `gateway_process.py` 与 `port_allocator.py`；`src/integrations/hermes` 已包含 Hermes client、config_writer、profile_loader。([GitHub][4])

结论：`copilot-serve` 应承担 **Profile Runtime API、Gateway Supervisor、健康检查、任务路由、SSE 事件流**，不要和 Desktop 分裂生成两套角色文件格式。角色文件生成规则应共享同一份 preset schema。

---

## 3. Profile 清单

| Profile ID      |   端口 | 角色名称   | 定位                       | 角色库来源                     |
| --------------- | ---: | ------ | ------------------------ | ------------------------- |
| `writer-9601`   | 9601 | 写作生文专家 | 模板创作、一键生文、内容改写、内容日历      | `marketing`               |
| `engineer-9612` | 9612 | 智能体专家  | 生产 skill、代码、工具、插件、集成方案   | `engineering`             |
| `research-9602` | 9602 | 数据研究专家 | 策略研究、趋势分析、投放/搜索词洞察       | `strategy` + `paid-media` |
| `hurman-9621`   | 9621 | 招聘专家   | JD、简历筛选、面试流程、招聘看板        | `hr`                      |
| `finance-9631`  | 9631 | 财经专家   | 财务分析、预算、预测、发票/经营指标辅助     | `finance`                 |
| `sales-9641`    | 9641 | 销售专家   | 客户拓展、商机策略、提案、Pipeline 分析 | `sales`                   |

说明：`hurman-9621` 保留你给定的拼写，不自动改成 `human-9621`，避免 profile id、路由、SQLite 记录、配置文件不一致。

---

## 4. 角色库映射

### 4.1 写作生文专家

`marketing` 目录中包含 `marketing-content-creator.md`、`marketing-book-co-author.md`、`marketing-linkedin-content-creator.md`、`marketing-wechat-official-account.md`、`marketing-zhihu-strategist.md` 等适合内容创作、平台化生文与内容运营的角色文件。([GitHub][5])

初始化建议：

```yaml
roleKey: writer
roleName: 写作生文专家
sourcePaths:
  - marketing/marketing-content-creator.md
  - marketing/marketing-book-co-author.md
  - marketing/marketing-linkedin-content-creator.md
  - marketing/marketing-wechat-official-account.md
  - marketing/marketing-zhihu-strategist.md
```

角色边界：

```text
负责：内容模板、文章大纲、内容扩写、平台改写、营销口径统一。
不负责：代码实现、数据库改造、生产发布。
委派：代码/工具开发交给智能体专家；数据研究交给数据研究专家。
```

### 4.2 智能体专家

`engineering` 目录中包含 `engineering-ai-engineer.md`、`engineering-senior-developer.md`、`engineering-software-architect.md`、`engineering-rapid-prototyper.md`、`engineering-code-reviewer.md`、`engineering-devops-automator.md` 等工程角色，适合作为 Hermes skill、tools、代码和插件生产型专家的初始化源。([GitHub][6])

初始化建议：

```yaml
roleKey: engineer
roleName: 智能体专家
sourcePaths:
  - engineering/engineering-ai-engineer.md
  - engineering/engineering-senior-developer.md
  - engineering/engineering-software-architect.md
  - engineering/engineering-rapid-prototyper.md
  - engineering/engineering-code-reviewer.md
  - engineering/engineering-devops-automator.md
```

角色边界：

```text
负责：Hermes skill、tools、插件、API、代码生成、Cursor/OpenCode 可执行稿。
不负责：替代财务、招聘、销售业务专家做最终业务判断。
委派：业务分析交给对应业务 Profile。
```

### 4.3 数据研究专家

`strategy` 目录包含 `nexus-strategy.md`、`EXECUTIVE-BRIEF.md`、`QUICKSTART.md` 等策略资料；`paid-media` 目录包含 `paid-media-search-query-analyst.md`、`paid-media-auditor.md`、`paid-media-tracking-specialist.md` 等投放与搜索词分析角色，适合组合成数据研究专家。([GitHub][7])

初始化建议：

```yaml
roleKey: research
roleName: 数据研究专家
sourcePaths:
  - strategy/nexus-strategy.md
  - strategy/EXECUTIVE-BRIEF.md
  - strategy/QUICKSTART.md
  - paid-media/paid-media-search-query-analyst.md
  - paid-media/paid-media-auditor.md
  - paid-media/paid-media-tracking-specialist.md
```

角色边界：

```text
负责：市场、行业、策略、趋势、搜索词、投放数据研究。
输出：研究报告、趋势摘要、机会清单、渠道洞察。
委派：生文交给写作生文专家；数据工具/接口交给智能体专家。
```

### 4.4 招聘专家

`hr` 目录包含 `hr-recruiter.md` 与 `hr-performance-reviewer.md`，适合初始化招聘与人才评估相关 Profile。([GitHub][8])

初始化建议：

```yaml
roleKey: hurman
roleName: 招聘专家
sourcePaths:
  - hr/hr-recruiter.md
  - hr/hr-performance-reviewer.md
```

角色边界：

```text
负责：JD、简历筛选标准、面试题、招聘流程、招聘看板指标。
禁止：根据无关敏感属性做候选人筛选。
委派：招聘系统集成、看板自动化交给智能体专家。
```

### 4.5 财经专家

`finance` 目录包含 `finance-financial-analyst.md`、`finance-financial-forecaster.md`、`finance-fpa-analyst.md`、`finance-investment-researcher.md`、`finance-invoice-manager.md` 等文件，适合初始化财务分析、预测、FP&A、发票辅助等能力。([GitHub][9])

初始化建议：

```yaml
roleKey: finance
roleName: 财经专家
sourcePaths:
  - finance/finance-financial-analyst.md
  - finance/finance-financial-forecaster.md
  - finance/finance-fpa-analyst.md
  - finance/finance-investment-researcher.md
  - finance/finance-invoice-manager.md
```

角色边界：

```text
负责：财务分析、预算、预测、发票/税务辅助、经营指标解释。
限制：输出作为内部分析辅助，不作为审计、税务、投资最终决策。
委派：ERP/CRM/WMS 数据接入交给智能体专家。
```

### 4.6 销售专家

`sales` 目录包含 `sales-account-strategist.md`、`sales-deal-strategist.md`、`sales-outbound-strategist.md`、`sales-pipeline-analyst.md`、`sales-proposal-strategist.md`，适合初始化客户拓展、商机策略、提案和 Pipeline 分析角色。([GitHub][10])

初始化建议：

```yaml
roleKey: sales
roleName: 销售专家
sourcePaths:
  - sales/sales-account-strategist.md
  - sales/sales-deal-strategist.md
  - sales/sales-outbound-strategist.md
  - sales/sales-pipeline-analyst.md
  - sales/sales-proposal-strategist.md
```

角色边界：

```text
负责：客户拓展、商机策略、提案、Pipeline 分析、客户健康度分析。
委派：销售物料交给写作生文专家；回款/账期交给财经专家；系统集成交给智能体专家。
```

---

## 5. 目标架构

```text
agency-agents-zh Git Repo
        │
        ▼
RoleLibrarySync
clone / fetch / reset
        │
        ▼
RolePreset YAML team_v1.4
profile id + port + roleSpec + sourcePaths
        │
        ▼
Profile Import Service
写入 SQLite: profiles / runtime_instances / entries / capabilities / role_specs
        │
        ▼
Role Compiler
生成 SOUL.md / MEMORY.md / profile-role.json
复制 role-source markdown 到 profile skills
        │
        ▼
HermesLocalService / Gateway Supervisor
多 profile 独立启动、健康检查、日志、自动重启
        │
        ├── Desktop UI：Profile workspace / role install / logs / actions
        └── Serve API：profile runtime API / task route / event stream
```

---

## 6. Preset 文件

新增文件：

```text
copilot-desktop/resources/profile-presets/hermes-expert-profiles.team_v1.4.yaml
```

内容：

```yaml
version: team_v1.4
runtime:
  db: sqlite
  defaultAdapter: hermes-local

gateway:
  host: "127.0.0.1"
  healthPath: "/health"

roleLibrary:
  repo: "https://github.com/jnMetaCode/agency-agents-zh.git"
  branch: "main"
  localDir: "agency-agents-zh"

profiles:
  writer-9601:
    displayName: "Writer"
    role: "specialist"
    roleName: "写作生文专家"
    description: "模板创作、一键生文、内容改写、内容日历。"
    runtimeType: "hermes-local"
    enabled: true
    autoStart: true
    port: 9601
    entry:
      type: "specialist-workspace"
      route: "profile/writer"
      title: "写作生文"
      icon: "pen-tool"
    capabilities:
      - delegation
      - skill-sync
      - session-share
    roleSpec:
      roleKey: "writer"
      roleName: "写作生文专家"
      sourceRepo: "https://github.com/jnMetaCode/agency-agents-zh"
      sourcePaths:
        - "marketing/marketing-content-creator.md"
        - "marketing/marketing-book-co-author.md"
        - "marketing/marketing-linkedin-content-creator.md"
        - "marketing/marketing-wechat-official-account.md"
        - "marketing/marketing-zhihu-strategist.md"
      outputMode: "soul-memory-skill"

  engineer-9612:
    displayName: "Engineer"
    role: "specialist"
    roleName: "智能体专家"
    description: "生产 Hermes skill、代码、工具、插件与集成方案。"
    runtimeType: "hermes-local"
    enabled: true
    autoStart: true
    port: 9612
    entry:
      type: "specialist-workspace"
      route: "profile/engineer"
      title: "智能体专家"
      icon: "bot"
    capabilities:
      - delegation
      - skill-sync
      - session-share
      - gateway-supervisor
    roleSpec:
      roleKey: "engineer"
      roleName: "智能体专家"
      sourceRepo: "https://github.com/jnMetaCode/agency-agents-zh"
      sourcePaths:
        - "engineering/engineering-ai-engineer.md"
        - "engineering/engineering-senior-developer.md"
        - "engineering/engineering-software-architect.md"
        - "engineering/engineering-rapid-prototyper.md"
        - "engineering/engineering-code-reviewer.md"
        - "engineering/engineering-devops-automator.md"
      outputMode: "soul-memory-skill"

  research-9602:
    displayName: "Research"
    role: "specialist"
    roleName: "数据研究专家"
    description: "策略研究、趋势分析、投放与搜索词洞察。"
    runtimeType: "hermes-local"
    enabled: true
    autoStart: true
    port: 9602
    entry:
      type: "specialist-workspace"
      route: "profile/research"
      title: "数据研究"
      icon: "search"
    capabilities:
      - delegation
      - skill-sync
      - session-share
    roleSpec:
      roleKey: "research"
      roleName: "数据研究专家"
      sourceRepo: "https://github.com/jnMetaCode/agency-agents-zh"
      sourcePaths:
        - "strategy/nexus-strategy.md"
        - "strategy/EXECUTIVE-BRIEF.md"
        - "strategy/QUICKSTART.md"
        - "paid-media/paid-media-search-query-analyst.md"
        - "paid-media/paid-media-auditor.md"
        - "paid-media/paid-media-tracking-specialist.md"
      outputMode: "soul-memory-skill"

  hurman-9621:
    displayName: "Hurman"
    role: "specialist"
    roleName: "招聘专家"
    description: "JD、简历筛选、面试流程、招聘看板。"
    runtimeType: "hermes-local"
    enabled: true
    autoStart: true
    port: 9621
    entry:
      type: "specialist-workspace"
      route: "profile/hurman"
      title: "招聘专家"
      icon: "users"
    capabilities:
      - delegation
      - skill-sync
      - session-share
    roleSpec:
      roleKey: "hurman"
      roleName: "招聘专家"
      sourceRepo: "https://github.com/jnMetaCode/agency-agents-zh"
      sourcePaths:
        - "hr/hr-recruiter.md"
        - "hr/hr-performance-reviewer.md"
      outputMode: "soul-memory-skill"

  finance-9631:
    displayName: "Finance"
    role: "specialist"
    roleName: "财经专家"
    description: "财务分析、预算、预测、发票与经营指标辅助。"
    runtimeType: "hermes-local"
    enabled: true
    autoStart: true
    port: 9631
    entry:
      type: "specialist-workspace"
      route: "profile/finance"
      title: "财经分析"
      icon: "chart-line"
    capabilities:
      - delegation
      - skill-sync
      - session-share
    roleSpec:
      roleKey: "finance"
      roleName: "财经专家"
      sourceRepo: "https://github.com/jnMetaCode/agency-agents-zh"
      sourcePaths:
        - "finance/finance-financial-analyst.md"
        - "finance/finance-financial-forecaster.md"
        - "finance/finance-fpa-analyst.md"
        - "finance/finance-investment-researcher.md"
        - "finance/finance-invoice-manager.md"
      outputMode: "soul-memory-skill"

  sales-9641:
    displayName: "Sales"
    role: "specialist"
    roleName: "销售专家"
    description: "客户拓展、商机策略、提案、Pipeline 分析。"
    runtimeType: "hermes-local"
    enabled: true
    autoStart: true
    port: 9641
    entry:
      type: "specialist-workspace"
      route: "profile/sales"
      title: "销售专家"
      icon: "briefcase"
    capabilities:
      - delegation
      - skill-sync
      - session-share
    roleSpec:
      roleKey: "sales"
      roleName: "销售专家"
      sourceRepo: "https://github.com/jnMetaCode/agency-agents-zh"
      sourcePaths:
        - "sales/sales-account-strategist.md"
        - "sales/sales-deal-strategist.md"
        - "sales/sales-outbound-strategist.md"
        - "sales/sales-pipeline-analyst.md"
        - "sales/sales-proposal-strategist.md"
      outputMode: "soul-memory-skill"
```

---

## 7. SOUL.md 生成规则

现有 `role-compiler.ts` 已经生成 `SOUL.md`、`MEMORY.md`、`profile-role.json`，并在 manifest 中记录 profile、port、roleKey、roleName、sourceRepo、sourcePaths、checksum 等信息。team_v1.4 需要调整的是：**SOUL.md 的身份段不要写“端口”**，端口只保留在 manifest/runtime。([GitHub][11])

目标 `SOUL.md`：

```md
# 写作生文专家

## 身份
你是 Hermes Desktop 中的写作生文专家，负责模板创作、一键生文、内容改写与内容日历。

## 角色来源
- agency-agents-zh/marketing/marketing-content-creator.md
- agency-agents-zh/marketing/marketing-book-co-author.md

## 工作边界
- 涉及代码实现时，应委派给智能体专家。
- 涉及市场数据研究时，应委派给数据研究专家。
- 涉及财务测算时，应委派给财经专家。
- 涉及客户拓展时，应委派给销售专家。

## 默认交付物
- 内容模板
- 生文提示词
- 长文大纲
- 多平台改写版本
- 内容日历
```

`profile-role.json` 允许保留端口：

```json
{
  "profile": "writer-9601",
  "port": 9601,
  "roleKey": "writer",
  "roleName": "写作生文专家",
  "sourceRepo": "https://github.com/jnMetaCode/agency-agents-zh",
  "sourcePaths": [
    "marketing/marketing-content-creator.md"
  ]
}
```

---

## 8. Desktop 改造清单

### 8.1 新增文件

```text
resources/profile-presets/hermes-expert-profiles.team_v1.4.yaml
src/main/profile-roles/team-v14-role-map.ts
src/main/profile-roles/team-v14-preset-installer.ts
src/shared/profile-roles/team-v14-contract.ts

src/renderer/modules/profiles/pages/MultiProfilesPage.tsx
src/renderer/modules/profiles/components/ProfileRoleCard.tsx
src/renderer/modules/profiles/components/ProfileRuntimeActions.tsx
src/renderer/modules/profiles/components/ProfileRoleSourceList.tsx
```

### 8.2 修改文件

```text
src/main/profile-roles/role-compiler.ts
src/main/profile-roles/role-preset-installer.ts
src/main/profile-runtime-manager.ts
src/main/ipc/profile-runtime-ipc.ts
src/main/ipc/profile-role-ipc.ts
src/preload/index.ts
resources/profiles/profile-runtime.template.yaml
```

### 8.3 关键实现点

```text
role-compiler.ts
- buildSoulMarkdown() 移除“端口身份描述”。
- 委派文案使用角色名称，不使用 profile id。
- manifest 保留 profile id 与 port。

role-preset-installer.ts
- 支持 hermes-expert-profiles.team_v1.4.yaml。
- preview 阶段校验端口冲突。
- 校验 sourcePaths 均存在。
- 支持 overwrite=false 时返回 existingWithoutOverwrite。

profile-runtime-manager.ts
- startAllProfiles() 只启动 enabled + autoStart。
- 单个 profile 失败不阻塞其它 profile。
- runtime 状态写回 SQLite。

UI
- 增加“专家 Profile 初始化”入口。
- 每个 Profile Card 显示：角色名称、端口、状态、模型、role source、SOUL/MEMORY 路径。
- 操作按钮：Sync Role Library、Preview Install、Install/Overwrite、Start、Stop、Restart、Recompile Role。
```

---

## 9. Serve 改造清单

### 9.1 API

```text
GET  /api/v1/profiles
GET  /api/v1/profiles/{profile_id}
POST /api/v1/profiles/import-preset
POST /api/v1/profiles/{profile_id}/start
POST /api/v1/profiles/{profile_id}/stop
POST /api/v1/profiles/{profile_id}/restart
GET  /api/v1/profiles/{profile_id}/health
GET  /api/v1/profiles/{profile_id}/events
     # team_v1.4.1: REST 列表（非 SSE）。聚合：
     # - task_events（local_tasks.target_profile_id 匹配）
     # - audit_logs（gateway start/stop/restart，payload_json.profile_id）
     # 全局任务 SSE 仍用 /api/v1/desktop/task-workbench/events/stream

POST /api/v1/role-library/sync
POST /api/v1/role-library/recompile/{profile_id}
GET  /api/v1/role-library/specs
```

### 9.2 职责边界

```text
copilot-desktop
- 本机安装器
- Electron UI
- preload IPC
- 本地 Profile Home 文件写入
- 用户可视化操作入口

copilot-serve
- HTTP API
- Gateway Supervisor
- Profile Runtime 查询/启动/停止
- 健康检查
- Task Workbench 事件流
- profile task routing
```

Desktop 与 Serve 共享同一份 team_v1.4 preset schema，不允许各自定义一套 roleSpec 字段。

---

## 10. SQLite 落地策略

继续使用现有 SQLite，不引入新数据库。

关键表：

```text
profiles
runtime_instances
profile_entries
profile_capabilities
profile_skills
profile_role_specs
audit_events
delegation_events
shared_contexts
```

写入规则：

```text
profiles
- name = writer-9601
- display_name = Writer
- role = specialist
- description = 模板创作、一键生文、内容改写、内容日历

runtime_instances
- host = 127.0.0.1
- port = 9601
- base_url = http://127.0.0.1:9601
- status = stopped / running / failed

profile_role_specs
- role_key = writer
- role_name = 写作生文专家
- role_source_repo = https://github.com/jnMetaCode/agency-agents-zh
- role_source_paths_json = [...]
- soul_path = <profile_home>/SOUL.md
- memory_path = <profile_home>/MEMORY.md
- source_checksum = sha256(source files)

profile_skills
- category = role-source
- source_type = role-library
- skill_path = skills/role-source/...
- enabled = true

audit_events
- sync_role_library
- install_role_spec
- recompile_role_spec
- start_profile
- stop_profile
```

不建议把角色 Markdown 正文写入 SQLite。SQLite 只保存路径、checksum、安装记录；源文件保留在 Profile Home 的 skills 目录。

---

## 11. 验收标准

### 11.1 Profile 初始化

```text
[ ] 能一键同步 agency-agents-zh。
[ ] 能 preview team_v1.4 preset。
[ ] 无端口冲突时，能一次导入 6 个专家 profile。
[ ] 已存在 profile 且 overwrite=false 时，返回 existingWithoutOverwrite。
[ ] 端口被占用时，返回 portConflicts。
```

### 11.2 Role 编译

每个 profile HOME 必须生成：

```text
SOUL.md
MEMORY.md
profile-role.json
skills/role-source/**/*.md
```

强制规则：

```text
[ ] SOUL.md 标题只能是角色名，例如“写作生文专家”。
[ ] 不允许出现“写作生文专家-9601”。
[ ] 不允许把端口写入 roleName。
[ ] profile-role.json 可以保留 port。
```

### 11.3 Runtime

```text
[ ] writer-9601 启动后 http://127.0.0.1:9601/health 可访问。
[ ] research-9602 启动后 http://127.0.0.1:9602/health 可访问。
[ ] engineer-9612 启动后 http://127.0.0.1:9612/health 可访问。
[ ] hurman-9621 启动后 http://127.0.0.1:9621/health 可访问。
[ ] finance-9631 启动后 http://127.0.0.1:9631/health 可访问。
[ ] sales-9641 启动后 http://127.0.0.1:9641/health 可访问。
[ ] 单个 profile 启动失败不影响其它 profile。
[ ] Stop/Restart 能更新 SQLite 状态与 audit_events。
```

### 11.4 UI

```text
[ ] Profile 列表显示 6 个专家入口。
[ ] 角色名称不显示端口。
[ ] 端口只在 Runtime 信息区显示。
[ ] 每个专家可进入独立 workspace route。
[ ] 每个专家可查看 role source 文件列表。
[ ] 支持 recompile role。
```

---

## 12. Cursor 执行顺序

```text
1. 新增 resources/profile-presets/hermes-expert-profiles.team_v1.4.yaml。

2. 修改 src/main/profile-roles/role-compiler.ts：
   - SOUL 身份段移除端口。
   - roleName 保持纯角色名称。
   - manifest 保留 profile id 与 port。

3. 修改 role-preset-installer：
   - 支持 team_v1.4 preset。
   - 支持 preview / overwrite / port conflict / sourcePaths 校验。

4. 补 preload IPC：
   - syncLibrary
   - previewInstall
   - installPreset
   - listSpecs
   - recompile
   - startProfile
   - stopProfile
   - restartProfile

5. 补 Desktop UI：
   - MultiProfilesPage
   - ProfileRoleCard
   - ProfileRuntimeActions
   - ProfileRoleSourceList

6. copilot-serve 增加 Profile Runtime API：
   - 复用 gateway_supervisor.py
   - 复用 hermes_gateway_client.py
   - 复用 profile_service.py
   - 接入 workbench_event_stream.py

7. 写集成测试：
   - preset preview
   - install preset
   - compile role
   - start / stop / restart
   - port conflict
   - recompile role

8. Windows 10 Home 验证：
   - 一键导入
   - 多 profile 同时启动
   - 不弹命令行窗口
   - SQLite 状态正确
```

---

## 13. 最终交付边界

team_v1.4 的核心交付不是“复制角色文本”，而是建立一条稳定初始化链路：

```text
agency-agents-zh role source
→ sync role library
→ team_v1.4 preset
→ SQLite profile runtime
→ SOUL.md / MEMORY.md / profile-role.json / role-source skills
→ 多 Hermes Gateway
→ Desktop / Serve 统一管理
```

完成后，新增专家只需要扩展 preset 的 `profiles.*.roleSpec.sourcePaths`，不需要改 multi_profiles 核心运行逻辑。

[1]: https://raw.githubusercontent.com/loudon84/ai-os-desktop/main/src/main/profile-runtime-db.ts "raw.githubusercontent.com"
[2]: https://raw.githubusercontent.com/loudon84/ai-os-desktop/main/src/main/profile-roles/role-library-sync.ts "raw.githubusercontent.com"
[3]: https://github.com/loudon84/ai-os-serve/tree/master/src "ai-os-serve/src at master · loudon84/ai-os-serve · GitHub"
[4]: https://github.com/loudon84/ai-os-serve/tree/master/src/services "ai-os-serve/src/services at master · loudon84/ai-os-serve · GitHub"
[5]: https://github.com/jnMetaCode/agency-agents-zh/tree/main/marketing "agency-agents-zh/marketing at main · jnMetaCode/agency-agents-zh · GitHub"
[6]: https://github.com/jnMetaCode/agency-agents-zh/tree/main/engineering "agency-agents-zh/engineering at main · jnMetaCode/agency-agents-zh · GitHub"
[7]: https://github.com/jnMetaCode/agency-agents-zh/tree/main/strategy "agency-agents-zh/strategy at main · jnMetaCode/agency-agents-zh · GitHub"
[8]: https://github.com/jnMetaCode/agency-agents-zh/tree/main/hr "agency-agents-zh/hr at main · jnMetaCode/agency-agents-zh · GitHub"
[9]: https://github.com/jnMetaCode/agency-agents-zh/tree/main/finance "agency-agents-zh/finance at main · jnMetaCode/agency-agents-zh · GitHub"
[10]: https://github.com/jnMetaCode/agency-agents-zh/tree/main/sales "agency-agents-zh/sales at main · jnMetaCode/agency-agents-zh · GitHub"
[11]: https://raw.githubusercontent.com/loudon84/ai-os-desktop/main/src/main/profile-roles/role-compiler.ts "raw.githubusercontent.com"
