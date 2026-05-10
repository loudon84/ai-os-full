# AI-OS Portal — Generative UI 功能 PRD

用于 Hermes 单任务闭环验证（OpenCode → Cursor → Hermes 验收 → Obsidian/Graphify 沉淀）

---

## 1. 目标

在现有 **ai-os-portal** 基础上：

* 引入 **Generative UI Runtime**，允许 AI 基于 CopilotKit 组件动态生成前端交互内容。
* 生成内容仅在 **sandbox** 中运行，不直接影响生产业务页面。
* 通过 Hermes 单任务闭环验证整个生成、执行、验收、沉淀流程。

---

## 2. 功能范围

| 功能模块      | 描述                                              | 任务类型              | 限制                                          |
| --------- | ----------------------------------------------- | ----------------- | ------------------------------------------- |
| AI 生成界面   | 根据用户提示生成 React 组件或 UI 卡片                        | Open-ended UI     | 仅在 sandbox，禁止生产页面替换                         |
| 事件流       | AG-UI 事件协议将生成请求和组件状态传递给 CopilotKit              | Agentic Frontend  | 事件只影响 sandbox 上下文                           |
| 组件注册      | 使用 Tambo/Zod 风格 registry 对生成组件进行 schema 校验和类型约束 | 内部组件规范            | 生成组件必须符合 registry 定义                        |
| 组件渲染      | 在 sandbox iframe 或模拟 DOM 中渲染生成 UI               | Sandbox Runtime   | 不影响全局状态、路由、Redux store 等                    |
| Hermes 验证 | 通过 Hermes 验证生成计划是否符合规格、受约束                      | Plan + Verify     | Cursor 执行前必须通过 Hermes 审批和验收                 |
| 沉淀        | Obsidian / Graphify 保存生成计划、组件规范、事件映射            | Knowledge Capture | 保存为 markdown/json，记录 Cursor 执行与 Hermes 验收结果 |

---

## 3. 输入输出规范

### 3.1 输入

```json
{
  "task_id": "generative-ui-mvp-001",
  "goal": "生成一个 sandbox 中的用户信息展示卡片组件",
  "user_prompt": "生成一个显示用户头像、用户名、在线状态的卡片",
  "component_registry": "Zod schema 指定字段",
  "constraints": {
    "sandbox_only": true,
    "no_production_side_effects": true,
    "max_depth": 3
  }
}
```

### 3.2 输出

```json
{
  "plan": {
    "component_name": "UserCard",
    "props": ["avatar", "username", "status"],
    "ui_preview": "<iframe sandbox ...></iframe>",
    "schema_validation": "pass",
    "generated_files": ["UserCard.tsx", "UserCard.stories.tsx"],
    "Cursor_execution_package": {
        "task_id": "generative-ui-mvp-001",
        "affected_files": ["sandbox/UserCard.tsx"],
        "acceptance_criteria": ["sandbox_render_passes", "schema_validation_passes"]
    }
  }
}
```

---

## 4. 实现思路

1. **任务创建**
   Hermes 接收 PRD → OpenCode 生成 plan.json → 标记 affected_files、sandbox 目录。
2. **Plan 审核**
   Hermes 审核 plan 是否符合 `sandbox_only`、schema 规范。
3. **Cursor 执行**
   Cursor 根据 plan 创建 TSX 文件及 storybook 示例，放入 sandbox 目录。
4. **验证**
   Hermes Verify：

   * 检查 schema 是否通过 Tambo/Zod 校验
   * sandbox iframe 是否能渲染
   * Cursor 执行结果文件是否完整
5. **沉淀**
   Obsidian：

   * 记录 plan.json、生成文件清单、事件流映射
     Graphify：
   * 更新组件依赖关系图
6. **输出**
   Hermes 返回单任务闭环报告，包括 plan → 执行 → 验收 → 沉淀状态。

---

## 5. Sandbox 约束

* **禁止访问生产 DOM**
* **禁止影响全局 state / Redux / store**
* **禁止修改全局路由 / layout / provider**
* **生成组件仅用于临时渲染、验证、沉淀**

---

## 6. CopilotKit 与 AG-UI 协作

* **CopilotKit**：

  * 负责 Agentic Frontend 的生成和状态管理
  * 接收 AG-UI event，输出 component code
* **AG-UI**：

  * facade → frontend 事件协议
  * 事件格式固定 `{type, payload, context}`
  * 仅用于 sandbox → CopilotKit 通信
* **Tambo/Zod Registry**：

  * 内部组件 schema 校验
  * 限制生成组件必须满足 prop 类型、字段约束

---

## 7. Hermes 单任务闭环验证指标

| 阶段                | 验证点                                      |
| ----------------- | ---------------------------------------- |
| Plan              | plan.json 完整、符合 schema、sandbox_only=true |
| Cursor Execute    | TSX/Storybook 文件生成、sandbox 渲染            |
| Hermes Verify     | schema 校验通过、sandbox 渲染无异常、Cursor 执行包完整   |
| Obsidian/Graphify | 生成计划、事件流、组件依赖图沉淀完成                       |

---

## 8. 任务目录结构示例

```text
ai-os-portal/
  sandbox/
    UserCard.tsx
    UserCard.stories.tsx
  plans/
    generative-ui-mvp-001.json
  events/
    generative-ui-mvp-001.events.json
  logs/
    generative-ui-mvp-001.log
```

---

## 9. Hermes 验收标准（DoD）

1. plan.json 生成且被 Hermes 审核通过
2. Cursor 执行产生的文件在 sandbox
3. 组件在 sandbox iframe 渲染通过
4. Tambo/Zod schema 校验通过
5. Obsidian 保存 plan + 文件清单 + event mapping
6. Graphify 更新依赖关系图
7. Hermes 返回 PASS → 单任务闭环成功

---

这份 PRD 可直接 **喂给 Hermes** 做 OpenCode → Cursor → Hermes Verify → Obsidian/Graphify 单任务闭环验证。
