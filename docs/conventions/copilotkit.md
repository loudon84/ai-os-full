## CopilotKit 全局连接与路由约定（必须先改规则再改代码）

本文件定义 **Portal 全站 CopilotKit 与 Hermes AI Gateway 的连接逻辑规则**（包括 agentId 路由、网关连接方式、降级策略、事件协议）。  
任何对 CopilotKit 连接方式、agent 路由、网关 URL 规则、事件流格式的修改，都必须 **先更新本约定**，再修改实现代码。

---

## 一、核心目标

- **全站一致**：所有页面共享同一套 CopilotKit Runtime 与 Agent 连接规则。
- **网关统一出口**：所有 agent 的推理请求都必须通过 **Hermes AI Gateway**，前端不直连第三方 LLM。
- **兼容默认 agent**：CopilotKit UI 默认会发送 `agentId="default"`，系统必须保证该 agent 可用且可路由。
- **流式可消费**：无论底层是 Hermes 专用 SSE 还是 OpenAI-compatible streaming，都必须转换为 CopilotKit Runtime 能消费的 AG-UI 事件序列。

---

## 二、职责分层（端点与组件）

### 2.1 `/api/copilot` 的职责（唯一运行时入口）

- **唯一入口**：前端 CopilotKit（UI / react-core）统一请求 `POST /api/copilot`。
- **Runtime 端点**：`/api/copilot` 必须是 CopilotKit 官方 Next.js App Router Runtime 端点。
- **Agent 注册**：在 runtime 内注册并暴露这些 agent key：
  - `default`（必须存在，映射到 Hermes `finance`）
  - `finance`
  - `risk`
  - `forecast`

实现位置（代码必须与本约定一致）：
- `app/api/copilot/route.ts`

### 2.2 全站 UI 的职责（Sidebar/Trigger）

- **全站展示**：`GlobalCopilotSidebar` 必须在 `app/[lang]/layout.tsx` 全局渲染，保证任何路由都可打开对话面板。
- **Provider 全局包裹**：`GlobalCopilotProvider` 必须在 `app/[lang]/layout.tsx` 包裹全站 children。
- **禁止替换 CopilotKit 内置浮动按钮**：  
  - **禁止**将任何自定义组件（含 `GlobalCopilotTrigger`）作为 `Button` prop 传入 `CopilotSidebar`。  
  - 原因：CopilotKit 通过内置 `.copilotKitButton` + `useChatContext` 管理打开/关闭与位置；自定义按钮注入 `Button` 插槽后会被 `.copilotKitSidebar` 容器样式接管，导致按钮 **错位、文本不可见、无法触发 openState**，进而使得 `/api/copilot` 的消息无处可渲染。  
  - 仅允许通过 `labels`（`title`/`initial`/`placeholder`）与 `icons` 做文案/图标定制，**不得**替换 `Button`。
- `GlobalCopilotTrigger` 组件目前仅保留用于 Storybook / 规格样例展示，**禁止**在生产运行时路径（layout / page）中渲染或作为 Sidebar 的 Button 插槽。

实现位置：
- `app/[lang]/layout.tsx`
- `modules/copilotkit/provider/GlobalCopilotProvider.tsx`
- `modules/copilotkit/components/GlobalCopilotSidebar.tsx`
- `modules/copilotkit/components/GlobalCopilotTrigger.tsx`（仅 storybook 样例，不参与运行时）

---

## 三、agentId 规则（UI → Runtime → Hermes）

### 3.1 CopilotKit 侧 agentId 的输入约定

- CopilotKit UI 可能会发 `agentId="default"`（缺省行为）。
- 业务侧显式选择 agent 时仅允许：
  - `finance`
  - `risk`
  - `forecast`

### 3.2 `default` 的强制映射规则

- **`default` 必须映射到 Hermes `finance`**（即：默认对话走财务 agent）。
- 禁止在前端随意把 `default` 改为其它 agent；如需变更默认策略，必须先修改本文件并同步实现。

---

## 四、Hermes Gateway 连接策略（必须具备双栈能力）

Hermes Gateway 在不同部署形态下可能暴露不同的推理接口。系统必须支持以下两类，并按顺序尝试：

### 4.1 优先：Hermes 专用 Agent SSE（如果存在）

当网关暴露 agent SSE 路由时，按 agent route 拼接：

- `/<base><gatewayPath>/sessions/<sessionId>/stream`
- 其中 `gatewayPath` 来自 agent 路由表（finance/risk/forecast）。

若请求返回 **404**（路由不存在），必须自动切换到 4.2（OpenAI-compatible）。

相关实现位置：
- `modules/hermes/copilot/agent-router.ts`（`gatewayPath` 与系统上下文 tag）
- `modules/hermes/copilot/gateway-streaming-agent.ts`（连接与 fallback）

### 4.2 降级：OpenAI-compatible Streaming Chat Completions（必须支持）

当网关不提供 agent SSE（或返回 404）时，必须改用：

- `POST <openaiBaseUrl>/chat/completions`
- `openaiBaseUrl` 必须规范化为以 `/v1` 结尾（例如 `http://host:8642/v1`）
- `stream: true` 必须开启

并将 OpenAI streaming 的 `delta.content` 转为 AG-UI 文本事件序列（见第六节）。

---

## 五、环境变量约定（连接层唯一配置来源）

### 5.1 Hermes 专用 SSE（可选）

- `HERMES_GATEWAY_BASE_URL`：Hermes Gateway 根地址（不含 `/v1` 也允许）
- `HERMES_GATEWAY_TOKEN`：访问 token（Bearer）

### 5.2 OpenAI-compatible（必需，作为 fallback）

- `HERMES_BASE_URL`：OpenAI-compatible base url（建议直接填 `.../v1`）
- `HERMES_API_KEY`：OpenAI-compatible API key（Bearer）
- `HERMES_MODEL`：模型名（默认 `default`）

约束：
- 连接层不得硬编码生产地址；仅允许在无配置时提供本地开发兜底值。
- 若 `HERMES_API_KEY` 无效，会导致 `/v1/chat/completions` 返回 401；此时属于环境配置问题，不应在前端“吞掉错误”。

---

## 六、事件流协议约定（AG-UI 必须完整且字段正确）

所有出站事件都会经过 CopilotKit Runtime 的 `verifyEvents` 通道，底层使用 `@ag-ui/core` 的 zod schema **严格校验字段名**。字段名写错会导致整个事件流被拒绝，UI 表现为"EventStream 有数据、Sidebar 里什么都看不到"。

### 6.1 Run 生命周期事件（字段名强制约定）

| 事件 | 必需字段 | 禁止使用的字段 |
|------|---------|----------------|
| `RUN_STARTED` | `type`, `threadId`, `runId` | 不得用 `sessionId` / `agentId` 代替 `threadId` |
| `RUN_FINISHED` | `type`, `threadId`, `runId` | 同上 |
| `RUN_ERROR`   | `type`, `message`           | 不得用 `error` 代替 `message` |

- `threadId` 与 `runId` 必须直接从 `AbstractAgent.run(input)` 的 `input` 读取（由 CopilotKit Runtime 的 `prepareRunAgentInput` 注入），**禁止**在 agent 内部自己用 `crypto.randomUUID()` 重新生成。
- 内部会话标识（如 Hermes 网关 `sessionId`）只可用于"我们自己"拼接网关路径，**不得**放到 AG-UI 事件的顶层字段中。

### 6.2 文本消息事件序列

- 首次输出文本前必须发：
  - `TEXT_MESSAGE_START`（`type`, `messageId`, `role: "assistant"`）
- 之后每个增量发：
  - `TEXT_MESSAGE_CONTENT`（`type`, `messageId`, `delta`）必须复用同一个 `messageId`
- 流结束 / `[DONE]` 前必须发：
  - `TEXT_MESSAGE_END`（`type`, `messageId`）
- 最后发 `RUN_FINISHED`。

禁止：
- 只发 `TEXT_MESSAGE_CONTENT` 不发 `START` / `END`（触发 `INCOMPLETE_STREAM`）。
- 发 `END` 前又发新一轮 `CONTENT` 却不重开 `START`。

### 6.3 Agent 基类与签名

- 所有自定义 agent 必须继承 `AbstractAgent`（`@ag-ui/client`），并实现：
  - `run(input: RunAgentInput): Observable<BaseEvent>`
- **禁止**改写 `run` 的入参签名为自定义结构；框架注入的 `threadId` / `runId` / `messages` / `tools` / `context` / `forwardedProps` / `state` 都必须从 `input` 里读。

---

## 七、修改流程（强制）

任何涉及下列内容的修改：
- `/api/copilot` 端点形态（Runtime vs 自定义 handler）
- agent 注册表（增删 agent key、修改默认 agent）
- Hermes Gateway URL 拼接规则（含 `/v1` 处理、fallback 条件）
- 事件流格式（AG-UI 事件类型、字段要求）

都必须遵循：

1. **先修改本文件**（`docs/conventions/copilotkit.md`），写清楚新规则与迁移影响。
2. 再修改实现代码，并确保与本约定一致。
3. 至少用一次 `agent/run`（`agentId=default`）验证能产生完整事件序列并成功完成 run。

