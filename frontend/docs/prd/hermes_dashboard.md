按你刚确认的边界，方案收敛为一句话：

> **只把 `modules/hermes` 做成一个“真实 Gateway 只读监控页”，不接 CopilotKit，不改全局 Provider，不猜 Hermes 私有接口，只使用最新官方公开 API。**

先给结论，再给代码。

---

# 一、先把边界说死

基于 Hermes 最新官方 API Server 文档，当前**明确公开且稳定**的只读接口是：

* `GET /health`
* `GET /v1/health`
* `GET /health/detailed`
* `GET /v1/models`
* `POST /v1/runs`
* `GET /v1/runs/{run_id}/events`
* `GET /v1/responses/{id}`（前提是你手里已有 response id） ([GitHub][1])

同时，官方把 API Server 定义为 **OpenAI-compatible HTTP endpoint**，并明确说明：

* `/v1/chat/completions` 是**无状态**接口，完整对话由客户端随请求携带
* `/v1/responses` 才支持服务端会话链路，通过 `previous_response_id` 或 `conversation` 维持多轮上下文
* `GET /health/detailed` 会返回 active sessions、running agents、resource usage
* 没有文档化的 `GET /v1/sessions`
* 没有文档化的 `GET /v1/skills` ([GitHub][1])

所以，**这次真实连接不能再瞎猜 `sessions/messages/skills` REST 路径**。

---

# 二、这次 Dashboard 能做什么，不能做什么

## 能做

| Dashboard 区块                      | 数据来源                                       |
| --------------------------------- | ------------------------------------------ |
| Gateway 状态                        | `GET /health` or `GET /v1/health`          |
| 详细运行状态                            | `GET /health/detailed`                     |
| 当前模型列表                            | `GET /v1/models`                           |
| 活跃 session 数 / 运行中 agent 数 / 资源占用 | `GET /health/detailed`                     |
| 最近一次 runs 事件流观察                   | `GET /v1/runs/{run_id}/events`，但要你先创建过 run |

## 不能做

| 你原先想显示的内容                                 | 原因                  |
| ----------------------------------------- | ------------------- |
| 历史 session 列表                             | 官方公开 API 未文档化该接口    |
| 某个 session 的历史消息列表                        | 官方公开 API 未文档化该接口    |
| 技能列表                                      | 官方公开 API 未文档化该接口    |
| Dashboard 自己枚举 memory / skill / sessiondb | 这属于 Hermes 内部状态，不该猜 |

所以这次要把 `Hermes Dashboard` 先落成 **运行态监控页**，而不是“完整会话管理后台”。

这不是退缩，是按你要求的“没有提到的内容先确认，不瞎猜”。

---

# 三、最终落地结构

只改你允许的目录：

```text
src/
├─ app/
│  ├─ hermes/
│  │  └─ page.tsx
│  └─ api/
│     └─ hermes/
│        ├─ health/route.ts
│        ├─ health-detailed/route.ts
│        ├─ models/route.ts
│        └─ runs/[runId]/events/route.ts
│
└─ modules/
   └─ hermes/
      ├─ api/
      │  ├─ gateway-client.ts
      │  └─ bff-client.ts
      ├─ types/
      │  └─ gateway-dto.ts
      ├─ hooks/
      │  ├─ use-hermes-health.ts
      │  ├─ use-hermes-health-detailed.ts
      │  └─ use-hermes-models.ts
      └─ components/
         └─ dashboard/
            ├─ hermes-dashboard-page.tsx
            ├─ gateway-health-card.tsx
            ├─ gateway-runtime-card.tsx
            └─ models-card.tsx
```

---

# 四、环境变量

你已经定了从 `.env.local` 读取，这里只保留两项：

```env
HERMES_GATEWAY_BASE_URL=http://localhost:8642
HERMES_GATEWAY_TOKEN=change-me-local-dev
```

Hermes 官方当前 API Server 默认端口就是 `8642`，认证是 Bearer Token，`/v1/models` 的模型名默认来自当前 profile 名或默认 `hermes-agent`。([GitHub][1])

---

# 五、Gateway Client

## `modules/hermes/api/gateway-client.ts`

```ts
const HERMES_GATEWAY_BASE_URL = process.env.HERMES_GATEWAY_BASE_URL!;
const HERMES_GATEWAY_TOKEN = process.env.HERMES_GATEWAY_TOKEN!;

if (!HERMES_GATEWAY_BASE_URL) {
  throw new Error("Missing HERMES_GATEWAY_BASE_URL");
}

if (!HERMES_GATEWAY_TOKEN) {
  throw new Error("Missing HERMES_GATEWAY_TOKEN");
}

function buildHeaders(initHeaders?: HeadersInit): Headers {
  const headers = new Headers(initHeaders);
  headers.set("Authorization", `Bearer ${HERMES_GATEWAY_TOKEN}`);
  headers.set("Content-Type", "application/json");
  return headers;
}

export async function hermesGatewayFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${HERMES_GATEWAY_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(init?.headers),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Hermes Gateway error: ${response.status} ${text}`);
  }

  return response.json() as Promise<T>;
}
```

---

# 六、DTO 定义

## `modules/hermes/types/gateway-dto.ts`

```ts
export type HermesHealthDto = {
  status: string; // official docs say {"status":"ok"}
};

export type HermesHealthDetailedDto = {
  status?: string;
  active_sessions?: number;
  running_agents?: number;
  resource_usage?: {
    cpu_percent?: number;
    memory_mb?: number;
    memory_percent?: number;
  };
  [key: string]: unknown;
};

export type HermesModelDto = {
  id: string;
  object?: string;
  owned_by?: string;
};

export type HermesModelsResponseDto = {
  object?: string;
  data: HermesModelDto[];
};
```

`GET /health` 返回 `{"status":"ok"}`，`GET /health/detailed` 返回 active sessions、running agents、resource usage；`GET /v1/models` 返回 agent 作为可用 model 列表。([GitHub][1])

---

# 七、BFF Route Handlers

这里不引入额外 BFF 框架，只用 Next Route Handlers。

## `app/api/hermes/health/route.ts`

```ts
import { NextResponse } from "next/server";
import { hermesGatewayFetch } from "@/modules/hermes/api/gateway-client";
import type { HermesHealthDto } from "@/modules/hermes/types/gateway-dto";

export async function GET() {
  const data = await hermesGatewayFetch<HermesHealthDto>("/health");
  return NextResponse.json(data);
}
```

## `app/api/hermes/health-detailed/route.ts`

```ts
import { NextResponse } from "next/server";
import { hermesGatewayFetch } from "@/modules/hermes/api/gateway-client";
import type { HermesHealthDetailedDto } from "@/modules/hermes/types/gateway-dto";

export async function GET() {
  const data = await hermesGatewayFetch<HermesHealthDetailedDto>("/health/detailed");
  return NextResponse.json(data);
}
```

## `app/api/hermes/models/route.ts`

```ts
import { NextResponse } from "next/server";
import { hermesGatewayFetch } from "@/modules/hermes/api/gateway-client";
import type { HermesModelsResponseDto } from "@/modules/hermes/types/gateway-dto";

export async function GET() {
  const data = await hermesGatewayFetch<HermesModelsResponseDto>("/v1/models");
  return NextResponse.json(data);
}
```

## `app/api/hermes/runs/[runId]/events/route.ts`

先放占位转发。现在只读 Dashboard 不一定立即用到，但这个是**官方明确存在**的事件流接口，可以保留成后续运行态调试入口。([GitHub][1])

```ts
import { NextRequest } from "next/server";

const HERMES_GATEWAY_BASE_URL = process.env.HERMES_GATEWAY_BASE_URL!;
const HERMES_GATEWAY_TOKEN = process.env.HERMES_GATEWAY_TOKEN!;

type Props = {
  params: { runId: string };
};

export async function GET(_req: NextRequest, { params }: Props) {
  const response = await fetch(
    `${HERMES_GATEWAY_BASE_URL}/v1/runs/${params.runId}/events`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${HERMES_GATEWAY_TOKEN}`,
      },
      cache: "no-store",
    }
  );

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
```

---

# 八、前端 BFF Client

## `modules/hermes/api/bff-client.ts`

```ts
import type {
  HermesHealthDetailedDto,
  HermesHealthDto,
  HermesModelsResponseDto,
} from "../types/gateway-dto";

async function parseJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`BFF error: ${response.status} ${text}`);
  }

  return response.json() as Promise<T>;
}

export const hermesBffClient = {
  getHealth() {
    return parseJson<HermesHealthDto>("/api/hermes/health");
  },

  getHealthDetailed() {
    return parseJson<HermesHealthDetailedDto>("/api/hermes/health-detailed");
  },

  getModels() {
    return parseJson<HermesModelsResponseDto>("/api/hermes/models");
  },
};
```

---

# 九、Hooks

## `modules/hermes/hooks/use-hermes-health.ts`

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { hermesBffClient } from "../api/bff-client";

export function useHermesHealth() {
  return useQuery({
    queryKey: ["hermes", "health"],
    queryFn: () => hermesBffClient.getHealth(),
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
}
```

## `modules/hermes/hooks/use-hermes-health-detailed.ts`

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { hermesBffClient } from "../api/bff-client";

export function useHermesHealthDetailed() {
  return useQuery({
    queryKey: ["hermes", "health-detailed"],
    queryFn: () => hermesBffClient.getHealthDetailed(),
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}
```

## `modules/hermes/hooks/use-hermes-models.ts`

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { hermesBffClient } from "../api/bff-client";

export function useHermesModels() {
  return useQuery({
    queryKey: ["hermes", "models"],
    queryFn: () => hermesBffClient.getModels(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
```

---

# 十、Dashboard 页面成品

你说入口是 `modules/hermes/...` 再由现有 app 路由挂载，所以这里只给模块页。

## `modules/hermes/components/dashboard/gateway-health-card.tsx`

```tsx
"use client";

import { useHermesHealth } from "../../hooks/use-hermes-health";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GatewayHealthCard() {
  const { data, isLoading, error } = useHermesHealth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gateway Health</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Checking...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{String(error)}</div>
        ) : (
          <div className="text-sm">status: {data?.status ?? "unknown"}</div>
        )}
      </CardContent>
    </Card>
  );
}
```

## `modules/hermes/components/dashboard/gateway-runtime-card.tsx`

```tsx
"use client";

import { useHermesHealthDetailed } from "../../hooks/use-hermes-health-detailed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GatewayRuntimeCard() {
  const { data, isLoading, error } = useHermesHealthDetailed();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Runtime Status</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{String(error)}</div>
        ) : (
          <div className="space-y-2 text-sm">
            <div>Active Sessions: {String(data?.active_sessions ?? "-")}</div>
            <div>Running Agents: {String(data?.running_agents ?? "-")}</div>
            <div>CPU %: {String(data?.resource_usage?.cpu_percent ?? "-")}</div>
            <div>Memory MB: {String(data?.resource_usage?.memory_mb ?? "-")}</div>
            <div>Memory %: {String(data?.resource_usage?.memory_percent ?? "-")}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## `modules/hermes/components/dashboard/models-card.tsx`

```tsx
"use client";

import { useHermesModels } from "../../hooks/use-hermes-models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ModelsCard() {
  const { data, isLoading, error } = useHermesModels();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Models</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{String(error)}</div>
        ) : (
          <div className="space-y-2">
            {(data?.data ?? []).map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <div className="font-medium text-sm">{item.id}</div>
                <div className="text-xs text-muted-foreground">
                  {item.owned_by ?? "-"}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## `modules/hermes/components/dashboard/hermes-dashboard-page.tsx`

```tsx
"use client";

import { PageContainer } from "@/components/layout/page-container";
import { GatewayHealthCard } from "./gateway-health-card";
import { GatewayRuntimeCard } from "./gateway-runtime-card";
import { ModelsCard } from "./models-card";

export function HermesDashboardPage() {
  return (
    <PageContainer
      title="Hermes Dashboard"
      description="Readonly Gateway monitoring page"
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <GatewayHealthCard />
        <GatewayRuntimeCard />
        <ModelsCard />
      </div>
    </PageContainer>
  );
}
```

## `app/hermes/page.tsx`

```tsx
import { HermesDashboardPage } from "@/modules/hermes/components/dashboard/hermes-dashboard-page";

export default function HermesPage() {
  return <HermesDashboardPage />;
}
```

---

# 十一、落地步骤

按这个顺序，不要跳：

## Step 1

在前端 `.env.local` 写：

```env
HERMES_GATEWAY_BASE_URL=http://localhost:8642
HERMES_GATEWAY_TOKEN=你的token
```

## Step 2

新增这三个接口：

* `/api/hermes/health`
* `/api/hermes/health-detailed`
* `/api/hermes/models`

## Step 3

新增：

* `gateway-client.ts`
* `bff-client.ts`
* 3 个 hooks

## Step 4

把 `modules/hermes/components/dashboard/hermes-dashboard-page.tsx` 替换成上面只读版

## Step 5

页面访问：

```text
/hermes
```

验收结果应为：

* Gateway Health 显示 `ok`
* Runtime Status 显示 active sessions / running agents / resource usage
* Models 显示至少一个 model id，通常是 `hermes-agent` 或当前 profile 名 ([GitHub][1])

---

# 十二、你现在不要做的事

这次明确不做：

* 不做 `/api/copilot`
* 不做 CopilotKit runtime
* 不做 session/message/skills 列表
* 不做多 agent
* 不做 interrupt/resume
* 不猜 Hermes 私有接口

---

# 十三、下一步怎么推进

等这版只读 Dashboard 跑通后，再进入第二步：

## 第二步才做

**“基于官方 `responses` / `runs` API 的单 agent 运行观察页”**

那时可以接：

* `POST /v1/runs`
* `GET /v1/runs/{run_id}/events`
* 或 `POST /v1/responses` + `GET /v1/responses/{id}`

但那已经不是这条“只读 Dashboard 接 Gateway”的任务了。

---

# 十四、最终结论

在你给定的边界下，**当前最正确的真实连接方案**不是去猜 `sessions/messages/skills`，而是先用 Hermes 最新官方公开 API 把 Dashboard 做成：

* **Health**
* **Detailed Runtime**
* **Models**

这是现在能稳定落地、且不污染现有架构的最小正确方案。Hermes 最新官方 API Server 已公开这些接口，并明确说明 API Server 是 OpenAI-compatible 入口、`/health` 和 `/v1/models` 为标准发现/监控接口，`/health/detailed` 可返回 active sessions 和 running agents。([GitHub][1])
