把当前React 18 前端，升级为一个 可承载 AI OS 的用户操作面，但不侵入你现有后端控制面与编排层。


现有项目是 React 18 + TypeScript
UI 层可使用 shadcn/ui + Tailwind
先通过统一 /api/copilot 代理层接入
CopilotKit 作为前端 AI 壳层，后端 Runtime/Facade 以后再升级

CopilotKit 官方当前提供 React SDK / UI 组件，并以 Runtime / AG-UI 作为前后端连接模型，这种分层非常适合你现在的 AI OS 架构。

1. 页面目标

将现有 React 18 站点接入 CopilotKit，使整个前端具备以下基础能力：

全站统一 AI 助手入口
页面级上下文感知
页面内动作触发能力
统一 /api/copilot 代理层
后续可平滑升级到 AI OS / ai-os-facade / AG-UI
2. 使用角色
普通员工
在任意页面唤起 AI 助手
对当前页面进行问答、总结、辅助操作
主管
基于当前页面数据做归纳、判断、生成建议
运营 / AI 产品设计师
为页面配置 AI 能力、上下文、动作
前端工程师
维护统一 AI 接入层与页面适配规则
3. 核心业务场景
用户在任意页面点击“AI 助手”
右侧打开全局 Copilot Sidebar
Sidebar 自动读取当前页面上下文
用户发起指令，例如：
总结当前页面
分析当前表格
打开某个详情抽屉
生成当前页面摘要
前端将消息和上下文发给 /api/copilot
/api/copilot 再转发给 AI OS / facade / runtime
AI 返回文本、动作建议、执行状态、结构化结果
前端渲染聊天结果或触发页面动作
4. 信息架构（IA）
4.1 全局层
AppProviders
GlobalCopilotProvider
GlobalCopilotSidebar
GlobalCopilotTrigger
4.2 页面层
PageCopilotContext
usePageCopilotContext
PageCopilotPanel（后续可扩展）
4.3 接入层
ai-os-client.ts
/api/copilot
copilot-types.ts
copilot-config.ts
4.4 动作层
useCopilotActions
页面 action 注册机制
前端受控动作分发器
5. 页面区块布局
5.1 全站布局
根 Provider
全局浮动按钮
全局右侧 Sidebar
5.2 页面布局

复杂页面建议统一：

Header
Filter/Search
Main Content
Detail Drawer / Right Panel
AI Sidebar 独立于业务主区
5.3 AI Sidebar 内部
标题区
当前页面上下文摘要
会话消息区
输入区
动作区
错误/加载状态区
6. 目录树，参考如下

src/
├─ ai/
│  ├─ provider/
│  │  └─ GlobalCopilotProvider.tsx
│  ├─ components/
│  │  ├─ GlobalCopilotTrigger.tsx
│  │  ├─ GlobalCopilotSidebar.tsx
│  │  ├─ CopilotSessionPanel.tsx
│  │  ├─ CopilotMessageList.tsx
│  │  ├─ CopilotComposer.tsx
│  │  ├─ CopilotContextCard.tsx
│  │  └─ CopilotActionList.tsx
│  ├─ hooks/
│  │  ├─ usePageCopilotContext.ts
│  │  ├─ useGlobalCopilotStore.ts
│  │  └─ useCopilotActions.ts
│  ├─ lib/
│  │  ├─ ai-os-client.ts
│  │  ├─ copilot-config.ts
│  │  └─ copilot-types.ts
│  └─ registry/
│     └─ page-context-registry.ts
├─ app/
│  ├─ providers/
│  │  └─ AppProviders.tsx
│  └─ api/
│     └─ copilot/
│        └─ route.ts
├─ components/
├─ features/
├─ pages/
└─ shared/

如果不是 Next.js App Router，而是普通 React SPA，可把 app/api/copilot/route.ts 替换成：

src/server/copilot.ts
或前端 dev proxy 指向独立 BFF 服务
7. 关键组件清单
平台级
GlobalCopilotProvider
GlobalCopilotSidebar
GlobalCopilotTrigger
AI 会话级
CopilotSessionPanel
CopilotMessageList
CopilotComposer
CopilotContextCard
CopilotActionList
逻辑级
usePageCopilotContext
useGlobalCopilotStore
useCopilotActions
ai-os-client
8. 关键交互说明
8.1 全局唤起
用户点击右下角 AI 按钮
打开右侧 Sidebar
8.2 页面上下文注入
Sidebar 打开时，读取当前页面上下文
上下文包括页面名称、路由、模块、选中对象、可执行动作
8.3 发送消息
用户输入 Prompt
前端将 messages + pageContext + availableActions 发给 /api/copilot
8.4 动作执行
AI 返回 suggestedAction
前端校验是否为已注册动作
执行受控动作，例如：
打开详情抽屉
应用筛选器
复制摘要
跳转页面
8.5 失败兜底
runtime 不可用时显示错误提示
页面无上下文时显示“未配置 AI 页面上下文”
9. 状态设计（空 / 加载 / 错误 / 权限）
空状态
当前页面未注册上下文
当前页面无动作
当前会话无消息
加载状态
建立会话中
等待 AI 返回中
动作执行中
错误状态
/api/copilot 超时
上游 facade 不可达
解析 AI 返回失败
权限状态
某动作需更高角色权限
某页面数据不可完整暴露给 AI
10. 数据结构建议（前端字段）
10.1 copilot-types.ts
export type CopilotRole = "user" | "assistant" | "system" | "tool";

export type CopilotMessage = {
  id: string;
  role: CopilotRole;
  content: string;
  createdAt: string;
  status?: "idle" | "streaming" | "done" | "error";
};

export type PageCopilotSelection =
  | {
      type: "none";
      payload: null;
    }
  | {
      type: "table-row";
      payload: Record<string, unknown>;
    }
  | {
      type: "table-selection";
      payload: Record<string, unknown>[];
    }
  | {
      type: "form";
      payload: Record<string, unknown>;
    }
  | {
      type: "text";
      payload: {
        text: string;
      };
    }
  | {
      type: "card";
      payload: Record<string, unknown>;
    };

export type CopilotActionDefinition = {
  id: string;
  label: string;
  description?: string;
  dangerous?: boolean;
  requiredPermission?: string;
};

export type PageCopilotContext = {
  pageId: string;
  pageTitle: string;
  route: string;
  module: string;
  summary?: string;
  selection?: PageCopilotSelection;
  actions?: CopilotActionDefinition[];
};

export type CopilotChatRequest = {
  sessionId?: string;
  messages: CopilotMessage[];
  pageContext?: PageCopilotContext;
};

export type CopilotSuggestedAction = {
  id: string;
  payload?: Record<string, unknown>;
};

export type CopilotChatResponse = {
  sessionId: string;
  reply: CopilotMessage;
  suggestedActions?: CopilotSuggestedAction[];
  debug?: {
    upstream?: string;
    latencyMs?: number;
  };
};
11. React + shadcn/ui 代码示例

下面直接给文件级骨架。

11.1 src/ai/lib/copilot-config.ts
export const COPILOT_CONFIG = {
  runtimeUrl: "/api/copilot",
  appName: "AI OS Frontend",
  defaultPanelTitle: "AI 助手",
} as const;
11.2 src/ai/provider/GlobalCopilotProvider.tsx
"use client";

import { PropsWithChildren } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import { COPILOT_CONFIG } from "@/ai/lib/copilot-config";

type GlobalCopilotProviderProps = PropsWithChildren;

export function GlobalCopilotProvider({
  children,
}: GlobalCopilotProviderProps) {
  return (
    <CopilotKit runtimeUrl={COPILOT_CONFIG.runtimeUrl}>
      {children}
    </CopilotKit>
  );
}

CopilotKit 当前文档中的基础接入就是在 React 端安装核心包和 UI 包，并通过 Provider/Runtime 连接前后端。

11.3 src/ai/hooks/useGlobalCopilotStore.ts

这里用 Zustand，符合你项目偏好的轻量状态管理。

"use client";

import { create } from "zustand";

type GlobalCopilotStore = {
  open: boolean;
  sessionId?: string;
  setOpen: (open: boolean) => void;
  setSessionId: (sessionId?: string) => void;
};

export const useGlobalCopilotStore = create<GlobalCopilotStore>((set) => ({
  open: false,
  sessionId: undefined,
  setOpen: (open) => set({ open }),
  setSessionId: (sessionId) => set({ sessionId }),
}));
11.4 src/ai/components/GlobalCopilotTrigger.tsx
"use client";

import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGlobalCopilotStore } from "@/ai/hooks/useGlobalCopilotStore";

export function GlobalCopilotTrigger() {
  const setOpen = useGlobalCopilotStore((state) => state.setOpen);

  return (
    <Button
      type="button"
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
      onClick={() => setOpen(true)}
    >
      <Bot className="mr-2 h-4 w-4" />
      AI 助手
    </Button>
  );
}
11.5 src/ai/hooks/usePageCopilotContext.ts

这是最关键的页面上下文 Hook 骨架。

"use client";

import { useMemo } from "react";
import type { PageCopilotContext } from "@/ai/lib/copilot-types";

type UsePageCopilotContextInput = {
  pageId: string;
  pageTitle: string;
  route: string;
  module: string;
  summary?: string;
  selection?: PageCopilotContext["selection"];
  actions?: PageCopilotContext["actions"];
};

export function usePageCopilotContext(
  input: UsePageCopilotContextInput
): PageCopilotContext {
  return useMemo(
    () => ({
      pageId: input.pageId,
      pageTitle: input.pageTitle,
      route: input.route,
      module: input.module,
      summary: input.summary,
      selection: input.selection ?? {
        type: "none",
        payload: null,
      },
      actions: input.actions ?? [],
    }),
    [input]
  );
}
11.6 src/ai/lib/ai-os-client.ts

前端统一调用 /api/copilot 的 client。

import type {
  CopilotChatRequest,
  CopilotChatResponse,
} from "@/ai/lib/copilot-types";

export async function sendCopilotMessage(
  payload: CopilotChatRequest
): Promise<CopilotChatResponse> {
  const response = await fetch("/api/copilot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Copilot request failed.");
  }

  return response.json() as Promise<CopilotChatResponse>;
}
11.7 src/ai/components/CopilotContextCard.tsx
"use client";

import type { PageCopilotContext } from "@/ai/lib/copilot-types";

type CopilotContextCardProps = {
  context?: PageCopilotContext;
};

export function CopilotContextCard({ context }: CopilotContextCardProps) {
  if (!context) {
    return (
      <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        当前页面未配置 AI 上下文。
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
      <div className="font-medium">{context.pageTitle}</div>
      <div className="mt-1 text-muted-foreground">模块：{context.module}</div>
      <div className="text-muted-foreground">路由：{context.route}</div>
      {context.summary ? (
        <div className="mt-2 text-muted-foreground">{context.summary}</div>
      ) : null}
    </div>
  );
}
11.8 src/ai/components/CopilotMessageList.tsx
"use client";

import type { CopilotMessage } from "@/ai/lib/copilot-types";
import { cn } from "@/lib/utils";

type CopilotMessageListProps = {
  messages: CopilotMessage[];
};

export function CopilotMessageList({
  messages,
}: CopilotMessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        暂无会话内容。可以先让 AI 总结当前页面。
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "rounded-xl border p-3 text-sm",
            message.role === "user" ? "bg-primary/5" : "bg-background"
          )}
        >
          <div className="mb-1 text-xs text-muted-foreground">
            {message.role}
          </div>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      ))}
    </div>
  );
}
11.9 src/ai/components/CopilotComposer.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CopilotComposerProps = {
  loading?: boolean;
  onSend: (content: string) => Promise<void>;
};

export function CopilotComposer({
  loading,
  onSend,
}: CopilotComposerProps) {
  const [value, setValue] = useState("");

  async function handleSend() {
    const content = value.trim();
    if (!content) return;
    await onSend(content);
    setValue("");
  }

  return (
    <div className="border-t p-4">
      <Textarea
        rows={4}
        placeholder="输入你的问题，或让 AI 总结当前页面..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="mt-3 flex justify-end">
        <Button type="button" disabled={loading} onClick={handleSend}>
          {loading ? "处理中..." : "发送"}
        </Button>
      </div>
    </div>
  );
}
11.10 src/ai/components/CopilotActionList.tsx
"use client";

import type { CopilotActionDefinition } from "@/ai/lib/copilot-types";
import { Button } from "@/components/ui/button";

type CopilotActionListProps = {
  actions?: CopilotActionDefinition[];
  onInvoke?: (actionId: string) => void;
};

export function CopilotActionList({
  actions = [],
  onInvoke,
}: CopilotActionListProps) {
  if (actions.length === 0) return null;

  return (
    <div className="border-t p-4">
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        当前页面可用动作
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onInvoke?.(action.id)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
11.11 src/ai/components/CopilotSessionPanel.tsx
"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { sendCopilotMessage } from "@/ai/lib/ai-os-client";
import type {
  CopilotMessage,
  PageCopilotContext,
} from "@/ai/lib/copilot-types";
import { CopilotContextCard } from "./CopilotContextCard";
import { CopilotMessageList } from "./CopilotMessageList";
import { CopilotComposer } from "./CopilotComposer";
import { CopilotActionList } from "./CopilotActionList";
import { useGlobalCopilotStore } from "@/ai/hooks/useGlobalCopilotStore";

type CopilotSessionPanelProps = {
  context?: PageCopilotContext;
};

export function CopilotSessionPanel({
  context,
}: CopilotSessionPanelProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sessionId = useGlobalCopilotStore((state) => state.sessionId);
  const setSessionId = useGlobalCopilotStore((state) => state.setSessionId);

  async function handleSend(content: string) {
    const userMessage: CopilotMessage = {
      id: nanoid(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
      status: "done",
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const response = await sendCopilotMessage({
        sessionId,
        messages: nextMessages,
        pageContext: context,
      });

      setSessionId(response.sessionId);
      setMessages((prev) => [...prev, response.reply]);
    } catch (error) {
      const errorMessage: CopilotMessage = {
        id: nanoid(),
        role: "assistant",
        content:
          error instanceof Error
            ? `请求失败：${error.message}`
            : "请求失败，请稍后重试。",
        createdAt: new Date().toISOString(),
        status: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  const actions = useMemo(() => context?.actions ?? [], [context]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <CopilotContextCard context={context} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <CopilotMessageList messages={messages} />
      </div>

      <CopilotActionList
        actions={actions}
        onInvoke={(actionId) => {
          void handleSend(`请执行动作：${actionId}`);
        }}
      />

      <CopilotComposer loading={loading} onSend={handleSend} />
    </div>
  );
}
11.12 src/ai/components/GlobalCopilotSidebar.tsx
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useGlobalCopilotStore } from "@/ai/hooks/useGlobalCopilotStore";
import { CopilotSessionPanel } from "./CopilotSessionPanel";
import type { PageCopilotContext } from "@/ai/lib/copilot-types";

type GlobalCopilotSidebarProps = {
  context?: PageCopilotContext;
};

export function GlobalCopilotSidebar({
  context,
}: GlobalCopilotSidebarProps) {
  const open = useGlobalCopilotStore((state) => state.open);
  const setOpen = useGlobalCopilotStore((state) => state.setOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-[460px] p-0 sm:max-w-[460px]">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>AI OS 助手</SheetTitle>
        </SheetHeader>
        <div className="h-[calc(100vh-57px)]">
          <CopilotSessionPanel context={context} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
11.13 src/app/providers/AppProviders.tsx
"use client";

import { PropsWithChildren } from "react";
import { GlobalCopilotProvider } from "@/ai/provider/GlobalCopilotProvider";

type AppProvidersProps = PropsWithChildren;

export function AppProviders({ children }: AppProvidersProps) {
  return <GlobalCopilotProvider>{children}</GlobalCopilotProvider>;
}
11.14 页面接入示例：src/pages/dashboard/DashboardPage.tsx
"use client";

import { GlobalCopilotTrigger } from "@/ai/components/GlobalCopilotTrigger";
import { GlobalCopilotSidebar } from "@/ai/components/GlobalCopilotSidebar";
import { usePageCopilotContext } from "@/ai/hooks/usePageCopilotContext";

export function DashboardPage() {
  const copilotContext = usePageCopilotContext({
    pageId: "dashboard",
    pageTitle: "工作台",
    route: "/dashboard",
    module: "portal",
    summary: "当前页面展示任务摘要、待办事项和最近结果。",
    actions: [
      {
        id: "summarize-page",
        label: "总结当前页面",
      },
      {
        id: "find-risks",
        label: "识别风险点",
      },
      {
        id: "draft-report",
        label: "生成日报摘要",
      },
    ],
  });

  return (
    <>
      <div className="p-6">
        <div className="text-xl font-semibold">Dashboard</div>
        <div className="mt-2 text-sm text-muted-foreground">
          这里是原有业务页面内容。
        </div>
      </div>

      <GlobalCopilotTrigger />
      <GlobalCopilotSidebar context={copilotContext} />
    </>
  );
}
12. /api/copilot 代理

这一层先做成最薄的 BFF。
作用不是做业务编排，而是：

屏蔽前端和上游 AI OS 的耦合
统一 session、上下文和鉴权入口
后续可切到 ai-os-facade

如果你是 Next.js App Router，可以这样写。

12.1 src/app/api/copilot/route.ts
import { NextRequest, NextResponse } from "next/server";
import type {
  CopilotChatRequest,
  CopilotChatResponse,
  CopilotMessage,
} from "@/ai/lib/copilot-types";

function buildMockReply(
  input: CopilotChatRequest
): CopilotChatResponse {
  const pageTitle = input.pageContext?.pageTitle ?? "当前页面";
  const reply: CopilotMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: `我已接收到你的请求。当前上下文页面为「${pageTitle}」。后续这里可以接入 ai-os-facade / agent runtime。`,
    createdAt: new Date().toISOString(),
    status: "done",
  };

  return {
    sessionId: input.sessionId ?? crypto.randomUUID(),
    reply,
    suggestedActions: [
      {
        id: "summarize-page",
      },
    ],
    debug: {
      upstream: "mock",
      latencyMs: 20,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as CopilotChatRequest;

    if (!payload.messages || !Array.isArray(payload.messages)) {
      return NextResponse.json(
        { error: "Invalid messages payload." },
        { status: 400 }
      );
    }

    const response = buildMockReply(payload);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown copilot error.",
      },
      { status: 500 }
    );
  }
}
12.2 升级为 facade 代理版

后续你只需要把上面的 mock 改成：

const upstreamResponse = await fetch(
  `${process.env.AI_OS_FACADE_URL}/agent-ui/chat`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AI_OS_FACADE_TOKEN ?? ""}`,
    },
    body: JSON.stringify(payload),
  }
);

然后把 facade 返回格式映射为 CopilotChatResponse。

13. 页面上下文注册机制建议

如果你不想在每个页面里手写太多内容，可以再抽一层 registry。

src/ai/registry/page-context-registry.ts
import type { PageCopilotContext } from "@/ai/lib/copilot-types";

export const PAGE_CONTEXT_REGISTRY: Record<string, Omit<PageCopilotContext, "route">> = {
  dashboard: {
    pageId: "dashboard",
    pageTitle: "工作台",
    module: "portal",
    summary: "用于查看任务摘要、待办和最近工作结果。",
    actions: [
      {
        id: "summarize-page",
        label: "总结当前页面",
      },
      {
        id: "draft-report",
        label: "生成日报摘要",
      },
    ],
  },
};

然后页面只补 route 和 selection。

14. 可扩展建议
14.1 第二阶段

在现有结构上继续加：

流式消息
AI 工具执行状态
Action result 渲染
ResultCard / ExecutionTimeline
14.2 第三阶段

接入：

ai-os-facade
AG-UI event stream
多 Agent 会话
页面内 Generative UI

CopilotKit 当前明确强调其可用于构建 agentic applications、generative UI，并基于 AG-UI 协议与 agent 后端通信。

14.3 你的 AI OS 架构里的正确定位

保持这条边界：

CopilotKit：用户操作面
Facade：统一 AI 接入面
HiClaw / OpenClaw / Dify / DeerFlow / RAGFlow：能力层

不要让 CopilotKit 直接变成业务编排中心。

15. 落地顺序

建议你按这个顺序进：

安装 @copilotkit/react-core、@copilotkit/react-ui
新增 GlobalCopilotProvider
新增 GlobalCopilotTrigger
新增 GlobalCopilotSidebar
新增 CopilotSessionPanel
新增 copilot-types.ts
新增 usePageCopilotContext.ts
新增 /api/copilot mock 代理
选一个页面先试点接入
再把 mock 代理替换成 facade 代理
16. 这一版的完成定义（DoD）

做到以下几点，就算第一阶段完成：

全站已挂载 Copilot Provider
任一页面可打开右侧 AI Sidebar
页面可注入 PageCopilotContext
可向 /api/copilot 发消息
可收到并展示 AI 回复
至少 1 个页面已接入 3 个以上动作定义
后续替换为 facade 时不需要改 UI 主结构

参考集成如下
一、Next.js App Router 版本
1. 目标目录树
src/
├─ ai/
│  ├─ provider/
│  │  └─ GlobalCopilotProvider.tsx
│  ├─ components/
│  │  ├─ GlobalCopilotTrigger.tsx
│  │  ├─ GlobalCopilotSidebar.tsx
│  │  ├─ CopilotSessionPanel.tsx
│  │  ├─ CopilotMessageList.tsx
│  │  ├─ CopilotComposer.tsx
│  │  ├─ CopilotContextCard.tsx
│  │  └─ CopilotActionList.tsx
│  ├─ hooks/
│  │  ├─ usePageCopilotContext.ts
│  │  ├─ useGlobalCopilotStore.ts
│  │  └─ useCopilotActions.ts
│  ├─ lib/
│  │  ├─ ai-os-client.ts
│  │  ├─ copilot-config.ts
│  │  └─ copilot-types.ts
│  └─ registry/
│     └─ page-context-registry.ts
├─ app/
│  ├─ api/
│  │  └─ copilot/
│  │     └─ route.ts
│  ├─ providers/
│  │  └─ AppProviders.tsx
│  ├─ dashboard/
│  │  └─ page.tsx
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  └─ ui/
│     ├─ button.tsx
│     ├─ textarea.tsx
│     └─ sheet.tsx
├─ lib/
│  └─ utils.ts
└─ features/
2. 安装依赖
pnpm add @copilotkit/react-core @copilotkit/react-ui zustand nanoid lucide-react

如果你已经有 shadcn/ui，则无需重复处理基础 UI。

3. 文件内容
3.1 src/ai/lib/copilot-types.ts
export type CopilotRole = "user" | "assistant" | "system" | "tool";

export type CopilotMessage = {
  id: string;
  role: CopilotRole;
  content: string;
  createdAt: string;
  status?: "idle" | "streaming" | "done" | "error";
};

export type PageCopilotSelection =
  | {
      type: "none";
      payload: null;
    }
  | {
      type: "table-row";
      payload: Record<string, unknown>;
    }
  | {
      type: "table-selection";
      payload: Record<string, unknown>[];
    }
  | {
      type: "form";
      payload: Record<string, unknown>;
    }
  | {
      type: "text";
      payload: {
        text: string;
      };
    }
  | {
      type: "card";
      payload: Record<string, unknown>;
    };

export type CopilotActionDefinition = {
  id: string;
  label: string;
  description?: string;
  dangerous?: boolean;
  requiredPermission?: string;
};

export type PageCopilotContext = {
  pageId: string;
  pageTitle: string;
  route: string;
  module: string;
  summary?: string;
  selection?: PageCopilotSelection;
  actions?: CopilotActionDefinition[];
};

export type CopilotChatRequest = {
  sessionId?: string;
  messages: CopilotMessage[];
  pageContext?: PageCopilotContext;
};

export type CopilotSuggestedAction = {
  id: string;
  payload?: Record<string, unknown>;
};

export type CopilotChatResponse = {
  sessionId: string;
  reply: CopilotMessage;
  suggestedActions?: CopilotSuggestedAction[];
  debug?: {
    upstream?: string;
    latencyMs?: number;
  };
};
3.2 src/ai/lib/copilot-config.ts
export const COPILOT_CONFIG = {
  runtimeUrl: "/api/copilot",
  appName: "AI OS Frontend",
  defaultPanelTitle: "AI 助手",
} as const;
3.3 src/ai/lib/ai-os-client.ts
import type {
  CopilotChatRequest,
  CopilotChatResponse,
} from "@/ai/lib/copilot-types";

export async function sendCopilotMessage(
  payload: CopilotChatRequest
): Promise<CopilotChatResponse> {
  const response = await fetch("/api/copilot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Copilot request failed.");
  }

  return response.json() as Promise<CopilotChatResponse>;
}
3.4 src/ai/hooks/useGlobalCopilotStore.ts
"use client";

import { create } from "zustand";

type GlobalCopilotStore = {
  open: boolean;
  sessionId?: string;
  setOpen: (open: boolean) => void;
  setSessionId: (sessionId?: string) => void;
};

export const useGlobalCopilotStore = create<GlobalCopilotStore>((set) => ({
  open: false,
  sessionId: undefined,
  setOpen: (open) => set({ open }),
  setSessionId: (sessionId) => set({ sessionId }),
}));
3.5 src/ai/hooks/usePageCopilotContext.ts
"use client";

import { useMemo } from "react";
import type { PageCopilotContext } from "@/ai/lib/copilot-types";

type UsePageCopilotContextInput = {
  pageId: string;
  pageTitle: string;
  route: string;
  module: string;
  summary?: string;
  selection?: PageCopilotContext["selection"];
  actions?: PageCopilotContext["actions"];
};

export function usePageCopilotContext(
  input: UsePageCopilotContextInput
): PageCopilotContext {
  return useMemo(
    () => ({
      pageId: input.pageId,
      pageTitle: input.pageTitle,
      route: input.route,
      module: input.module,
      summary: input.summary,
      selection: input.selection ?? {
        type: "none",
        payload: null,
      },
      actions: input.actions ?? [],
    }),
    [input]
  );
}
3.6 src/ai/hooks/useCopilotActions.ts
"use client";

type CopilotActionHandler = (
  payload?: Record<string, unknown>
) => void | Promise<void>;

type CopilotActionMap = Record<string, CopilotActionHandler>;

export function useCopilotActions(actionMap: CopilotActionMap) {
  async function invokeAction(
    actionId: string,
    payload?: Record<string, unknown>
  ) {
    const handler = actionMap[actionId];
    if (!handler) {
      throw new Error(`Unknown action: ${actionId}`);
    }
    await handler(payload);
  }

  return {
    invokeAction,
  };
}
3.7 src/ai/provider/GlobalCopilotProvider.tsx
"use client";

import { PropsWithChildren } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import { COPILOT_CONFIG } from "@/ai/lib/copilot-config";

type GlobalCopilotProviderProps = PropsWithChildren;

export function GlobalCopilotProvider({
  children,
}: GlobalCopilotProviderProps) {
  return (
    <CopilotKit runtimeUrl={COPILOT_CONFIG.runtimeUrl}>
      {children}
    </CopilotKit>
  );
}
3.8 src/ai/components/GlobalCopilotTrigger.tsx
"use client";

import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGlobalCopilotStore } from "@/ai/hooks/useGlobalCopilotStore";

export function GlobalCopilotTrigger() {
  const setOpen = useGlobalCopilotStore((state) => state.setOpen);

  return (
    <Button
      type="button"
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
      onClick={() => setOpen(true)}
    >
      <Bot className="mr-2 h-4 w-4" />
      AI 助手
    </Button>
  );
}
3.9 src/ai/components/CopilotContextCard.tsx
"use client";

import type { PageCopilotContext } from "@/ai/lib/copilot-types";

type CopilotContextCardProps = {
  context?: PageCopilotContext;
};

export function CopilotContextCard({ context }: CopilotContextCardProps) {
  if (!context) {
    return (
      <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        当前页面未配置 AI 上下文。
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
      <div className="font-medium">{context.pageTitle}</div>
      <div className="mt-1 text-muted-foreground">模块：{context.module}</div>
      <div className="text-muted-foreground">路由：{context.route}</div>
      {context.summary ? (
        <div className="mt-2 text-muted-foreground">{context.summary}</div>
      ) : null}
    </div>
  );
}
3.10 src/ai/components/CopilotMessageList.tsx
"use client";

import type { CopilotMessage } from "@/ai/lib/copilot-types";
import { cn } from "@/lib/utils";

type CopilotMessageListProps = {
  messages: CopilotMessage[];
};

export function CopilotMessageList({
  messages,
}: CopilotMessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        暂无会话内容。
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "rounded-xl border p-3 text-sm",
            message.role === "user" ? "bg-primary/5" : "bg-background"
          )}
        >
          <div className="mb-1 text-xs text-muted-foreground">
            {message.role}
          </div>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      ))}
    </div>
  );
}
3.11 src/ai/components/CopilotComposer.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CopilotComposerProps = {
  loading?: boolean;
  onSend: (content: string) => Promise<void>;
};

export function CopilotComposer({
  loading,
  onSend,
}: CopilotComposerProps) {
  const [value, setValue] = useState("");

  async function handleSend() {
    const content = value.trim();
    if (!content) return;
    await onSend(content);
    setValue("");
  }

  return (
    <div className="border-t p-4">
      <Textarea
        rows={4}
        placeholder="输入问题，或让 AI 总结当前页面..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="mt-3 flex justify-end">
        <Button type="button" disabled={loading} onClick={handleSend}>
          {loading ? "处理中..." : "发送"}
        </Button>
      </div>
    </div>
  );
}
3.12 src/ai/components/CopilotActionList.tsx
"use client";

import type { CopilotActionDefinition } from "@/ai/lib/copilot-types";
import { Button } from "@/components/ui/button";

type CopilotActionListProps = {
  actions?: CopilotActionDefinition[];
  onInvoke?: (actionId: string) => void;
};

export function CopilotActionList({
  actions = [],
  onInvoke,
}: CopilotActionListProps) {
  if (actions.length === 0) return null;

  return (
    <div className="border-t p-4">
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        当前页面动作
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onInvoke?.(action.id)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
3.13 src/ai/components/CopilotSessionPanel.tsx
"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { sendCopilotMessage } from "@/ai/lib/ai-os-client";
import type {
  CopilotMessage,
  PageCopilotContext,
} from "@/ai/lib/copilot-types";
import { CopilotContextCard } from "./CopilotContextCard";
import { CopilotMessageList } from "./CopilotMessageList";
import { CopilotComposer } from "./CopilotComposer";
import { CopilotActionList } from "./CopilotActionList";
import { useGlobalCopilotStore } from "@/ai/hooks/useGlobalCopilotStore";

type CopilotSessionPanelProps = {
  context?: PageCopilotContext;
};

export function CopilotSessionPanel({
  context,
}: CopilotSessionPanelProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sessionId = useGlobalCopilotStore((state) => state.sessionId);
  const setSessionId = useGlobalCopilotStore((state) => state.setSessionId);

  async function handleSend(content: string) {
    const userMessage: CopilotMessage = {
      id: nanoid(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
      status: "done",
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const response = await sendCopilotMessage({
        sessionId,
        messages: nextMessages,
        pageContext: context,
      });

      setSessionId(response.sessionId);
      setMessages((prev) => [...prev, response.reply]);
    } catch (error) {
      const errorMessage: CopilotMessage = {
        id: nanoid(),
        role: "assistant",
        content:
          error instanceof Error
            ? `请求失败：${error.message}`
            : "请求失败，请稍后重试。",
        createdAt: new Date().toISOString(),
        status: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  const actions = useMemo(() => context?.actions ?? [], [context]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <CopilotContextCard context={context} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <CopilotMessageList messages={messages} />
      </div>

      <CopilotActionList
        actions={actions}
        onInvoke={(actionId) => {
          void handleSend(`请执行动作：${actionId}`);
        }}
      />

      <CopilotComposer loading={loading} onSend={handleSend} />
    </div>
  );
}
3.14 src/ai/components/GlobalCopilotSidebar.tsx
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { PageCopilotContext } from "@/ai/lib/copilot-types";
import { useGlobalCopilotStore } from "@/ai/hooks/useGlobalCopilotStore";
import { CopilotSessionPanel } from "./CopilotSessionPanel";

type GlobalCopilotSidebarProps = {
  context?: PageCopilotContext;
};

export function GlobalCopilotSidebar({
  context,
}: GlobalCopilotSidebarProps) {
  const open = useGlobalCopilotStore((state) => state.open);
  const setOpen = useGlobalCopilotStore((state) => state.setOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-[460px] p-0 sm:max-w-[460px]">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>AI OS 助手</SheetTitle>
        </SheetHeader>
        <div className="h-[calc(100vh-57px)]">
          <CopilotSessionPanel context={context} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
3.15 src/app/providers/AppProviders.tsx
"use client";

import { PropsWithChildren } from "react";
import { GlobalCopilotProvider } from "@/ai/provider/GlobalCopilotProvider";

type AppProvidersProps = PropsWithChildren;

export function AppProviders({ children }: AppProvidersProps) {
  return <GlobalCopilotProvider>{children}</GlobalCopilotProvider>;
}
3.16 src/app/layout.tsx
import "./globals.css";
import { AppProviders } from "@/app/providers/AppProviders";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
3.17 src/app/api/copilot/route.ts
import { NextRequest, NextResponse } from "next/server";
import type {
  CopilotChatRequest,
  CopilotChatResponse,
  CopilotMessage,
} from "@/ai/lib/copilot-types";

function buildMockReply(input: CopilotChatRequest): CopilotChatResponse {
  const pageTitle = input.pageContext?.pageTitle ?? "当前页面";

  const reply: CopilotMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: `已接收请求。当前页面为「${pageTitle}」。后续这里可对接 ai-os-facade。`,
    createdAt: new Date().toISOString(),
    status: "done",
  };

  return {
    sessionId: input.sessionId ?? crypto.randomUUID(),
    reply,
    suggestedActions: [
      {
        id: "summarize-page",
      },
    ],
    debug: {
      upstream: "mock",
      latencyMs: 25,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as CopilotChatRequest;

    if (!payload.messages || !Array.isArray(payload.messages)) {
      return NextResponse.json(
        { error: "Invalid payload: messages is required." },
        { status: 400 }
      );
    }

    return NextResponse.json(buildMockReply(payload));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
3.18 src/app/dashboard/page.tsx
"use client";

import { GlobalCopilotTrigger } from "@/ai/components/GlobalCopilotTrigger";
import { GlobalCopilotSidebar } from "@/ai/components/GlobalCopilotSidebar";
import { usePageCopilotContext } from "@/ai/hooks/usePageCopilotContext";

export default function DashboardPage() {
  const copilotContext = usePageCopilotContext({
    pageId: "dashboard",
    pageTitle: "工作台",
    route: "/dashboard",
    module: "portal",
    summary: "当前页面展示任务摘要、待办事项和最近结果。",
    actions: [
      {
        id: "summarize-page",
        label: "总结当前页面",
      },
      {
        id: "draft-report",
        label: "生成日报摘要",
      },
      {
        id: "find-risks",
        label: "识别风险点",
      },
    ],
  });

  return (
    <>
      <main className="p-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          这里是工作台主内容区域。
        </p>
      </main>

      <GlobalCopilotTrigger />
      <GlobalCopilotSidebar context={copilotContext} />
    </>
  );
}
4. Next.js 版本接入说明
4.1 接入顺序
安装依赖
新增 GlobalCopilotProvider
包裹 layout.tsx
新增 /api/copilot
选一个页面挂 Trigger + Sidebar
页面注入 usePageCopilotContext
4.2 第二阶段怎么升

只改 /api/copilot/route.ts，把 mock 换成：

facade 转发
runtime 转发
AG-UI / streaming

不用改主 UI 结构。

17. Storybook 适配

当前项目使用 Storybook 10.3.5 + CSF 3.0 格式，stories/ 目录下已有 95+ 个 story 文件。AI 组件必须与现有 Storybook 体系对齐。

17.1 AI 组件 Story 文件规划

stories/ai/
├─ global-copilot-trigger.stories.tsx
├─ global-copilot-sidebar.stories.tsx
├─ copilot-session-panel.stories.tsx
├─ copilot-message-list.stories.tsx
├─ copilot-composer.stories.tsx
├─ copilot-context-card.stories.tsx
└─ copilot-action-list.stories.tsx

17.2 各组件 Story 变体

遵循项目现有 Default / Empty / Loading / Error 变体约定：

GlobalCopilotTrigger
Default — 默认浮动按钮

GlobalCopilotSidebar
Default — 打开状态，带完整 context
Empty — 打开状态，无 context（未配置页面上下文）
Loading — 等待 AI 返回中
Error — fetch 失败

CopilotSessionPanel
Default — 正常会话，有消息
Empty — 无消息
Loading — 等待 AI 返回
Error — 请求失败

CopilotMessageList
Default — 有消息列表
Empty — 无消息

CopilotComposer
Default — 正常输入
Loading — 发送中（disabled）

CopilotContextCard
Default — 有 context
Empty — 无 context（未配置）

CopilotActionList
Default — 有动作列表
Empty — 无动作
Forbidden — 含 dangerous 动作

17.3 CopilotKit Provider Mock

当前 .storybook/preview.tsx 仅有主题 decorator，缺少 Provider decorator。GlobalCopilotSidebar、CopilotSessionPanel 等组件依赖 CopilotKit Provider 上下文，在 Storybook 中无法独立渲染。

解决方案：在 .storybook/mocks/ 中新增 CopilotKit mock，与现有 next-themes.tsx mock 模式一致。

.storybook/mocks/copilotkit.tsx

import React from "react";

export function CopilotKit({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

并在 .storybook/main.ts 的 webpackFinal 中添加 alias：

config.resolve.alias = {
  ...config.resolve.alias,
  "@copilotkit/react-core": path.resolve(__dirname, "./mocks/copilotkit.tsx"),
  "@copilotkit/react-ui": path.resolve(__dirname, "./mocks/copilotkit.tsx"),
};

这样 AI 组件的 Story 可以在不依赖真实 CopilotKit runtime 的情况下渲染 UI。

17.4 CopilotKit CSS 加载

GlobalCopilotProvider.tsx 导入了 @copilotkit/react-ui/styles.css。Storybook 需要确保该 CSS 被加载。

方案 A（推荐）：在 mock CopilotKit 时不导入该 CSS，Story 中用项目自身 Tailwind 样式即可覆盖。
方案 B：在 .storybook/preview.tsx 中条件导入 @copilotkit/react-ui/styles.css。

17.5 Zustand Store 隔离

useGlobalCopilotStore 在 Story 之间是共享的，不会自动重置。多个 Story 操作 open / sessionId 会互相干扰。

解决方案：在每个 AI 组件 Story 的 decorators 中重置 store：

decorators: [
  (Story) => {
    useGlobalCopilotStore.setState({ open: false, sessionId: undefined });
    return <Story />;
  },
],

17.6 fetch Mock（ai-os-client）

CopilotSessionPanel 内部调用 sendCopilotMessage，会发起真实 fetch 请求。Storybook 中不应发起真实请求。

方案 A（推荐）：使用 MSW (Mock Service Worker) 拦截 /api/copilot 请求，返回 mock CopilotChatResponse。
方案 B：在 Story 中通过 decorator 替换 sendCopilotMessage 模块。

MSW handler 示例：

import { http, HttpResponse } from "msw";

export const copilotHandlers = [
  http.post("/api/copilot", async ({ request }) => {
    const payload = await request.json();
    return HttpResponse.json({
      sessionId: "mock-session-1",
      reply: {
        id: "mock-reply-1",
        role: "assistant",
        content: "这是 mock AI 回复。",
        createdAt: new Date().toISOString(),
        status: "done",
      },
      suggestedActions: [{ id: "summarize-page" }],
      debug: { upstream: "msw", latencyMs: 10 },
    });
  }),
];

17.7 component-seed.json 注册

PRD 新增的 7 个 UI 组件需要注册到 generated/raw/component-seed.json，否则 ast-grep → postprocess 流程无法感知它们：

{ "name": "GlobalCopilotTrigger", "path": "ai/components/GlobalCopilotTrigger.tsx", "level": "base", "hasStory": true, "hasAutodocs": true, "isReusable": true },
{ "name": "GlobalCopilotSidebar", "path": "ai/components/GlobalCopilotSidebar.tsx", "level": "composite", "hasStory": true, "hasAutodocs": true, "isReusable": true },
{ "name": "CopilotSessionPanel", "path": "ai/components/CopilotSessionPanel.tsx", "level": "composite", "hasStory": true, "hasAutodocs": true, "isReusable": true },
{ "name": "CopilotMessageList", "path": "ai/components/CopilotMessageList.tsx", "level": "base", "hasStory": true, "hasAutodocs": true, "isReusable": true },
{ "name": "CopilotComposer", "path": "ai/components/CopilotComposer.tsx", "level": "base", "hasStory": true, "hasAutodocs": true, "isReusable": true },
{ "name": "CopilotContextCard", "path": "ai/components/CopilotContextCard.tsx", "level": "base", "hasStory": true, "hasAutodocs": true, "isReusable": true },
{ "name": "CopilotActionList", "path": "ai/components/CopilotActionList.tsx", "level": "base", "hasStory": true, "hasAutodocs": true, "isReusable": true }

18. ast-grep 适配

当前项目使用 ast-grep 进行代码结构分析和组件元数据提取，扫描路径为 ["app", "components"]，规则覆盖组件导出、Props 类型、页面布局块、Import 依赖、状态模式 5 个维度。AI 组件必须纳入 ast-grep 扫描体系。

18.1 扫描路径扩展

当前 scan.ts 中 scanPaths 仅包含 ["app", "components"]，ai/ 目录完全不在扫描范围内。

需修改 tools/ast-grep/scan.ts：

const scanPaths = ["app", "components", "ai/components", "ai/provider"].map(
  (p) => join(PROJECT_ROOT, p)
);

注意：ai/lib/、ai/hooks/、ai/registry/ 不纳入扫描，原因：
ai/lib/ 下是纯 TS 文件（copilot-types.ts、ai-os-client.ts、copilot-config.ts），language: Tsx 规则无法匹配
ai/hooks/ 下的 hook 函数会被 component-export.yaml 误匹配为组件
ai/registry/ 下是纯数据注册表，不是组件

18.2 page-blocks.yaml 新增规则

PRD 引入了 3 个新的页面级 UI 块组件，当前规则无法识别。需在 tools/ast-grep/rules/page-blocks.yaml 中新增：

- id: copilot-sidebar-block
  language: Tsx
  rule:
    pattern: <GlobalCopilotSidebar $$PROPS />

- id: copilot-session-panel-block
  language: Tsx
  rule:
    pattern: <CopilotSessionPanel $$PROPS />

- id: copilot-trigger-block
  language: Tsx
  rule:
    pattern: <GlobalCopilotTrigger $$PROPS />

同时，GlobalCopilotSidebar 内部使用了 <Sheet>，已被现有 sheet-block 规则覆盖，无需重复。

18.3 state-patterns.yaml 新增规则

PRD 组件使用了现有规则未覆盖的状态属性，需在 tools/ast-grep/rules/state-patterns.yaml 中新增：

- id: status-state-prop
  language: Tsx
  rule:
    pattern: $NAME={$$EXPR}
  constraints:
    NAME:
      regex: "^status$"

- id: dangerous-state-prop
  language: Tsx
  rule:
    pattern: $NAME={$$EXPR}
  constraints:
    NAME:
      regex: "^dangerous$"

对应关系：
status — CopilotMessage.status（idle / streaming / done / error）
dangerous — CopilotActionDefinition.dangerous（标记危险动作）

18.4 现有规则对 AI 组件的兼容性

component-export.yaml — 兼容。PRD 组件使用 export function 命名导出，完全匹配 export-function-component 规则。

props-type.yaml — 兼容。PRD 组件使用 type XXXProps 模式，完全匹配 type-props-declaration 规则（regex Props$）。

imports.yaml — 兼容。PRD 组件的 import 模式完全标准（import { X } from "@/ai/..."），能被 import-declaration 规则匹配。

18.5 scanTargets 扩展

如需对 AI 组件单独输出扫描结果，可在 tools/ast-grep/scan.ts 的 scanTargets 中新增：

{ ruleFile: "page-blocks.yaml", outputFile: "ai-pages.raw.json", label: "AI 页面布局", scanPaths: ["ai/components", "ai/provider"] },

但通常复用现有 scanTargets 即可，只需扩展 scanPaths。

19. Storybook + ast-grep 适配落地顺序

在 PRD 第 15 节落地顺序基础上，补充 Storybook 和 ast-grep 的适配步骤：

安装依赖（含 @copilotkit/react-core、@copilotkit/react-ui、nanoid、msw）
新增 GlobalCopilotProvider
新增 GlobalCopilotTrigger
新增 GlobalCopilotSidebar
新增 CopilotSessionPanel 及子组件
新增 copilot-types.ts
新增 usePageCopilotContext.ts
新增 /api/copilot mock 代理
选一个页面试点接入
--- 以下为 Storybook + ast-grep 适配 ---
新增 .storybook/mocks/copilotkit.tsx（CopilotKit Provider mock）
更新 .storybook/main.ts（webpackFinal 添加 alias）
更新 .storybook/preview.tsx（Zustand store 重置 decorator）
新增 stories/ai/ 下 7 个 Story 文件
更新 generated/raw/component-seed.json（注册 7 个 AI 组件）
更新 tools/ast-grep/scan.ts（扩展 scanPaths）
更新 tools/ast-grep/rules/page-blocks.yaml（新增 3 条 AI 块规则）
更新 tools/ast-grep/rules/state-patterns.yaml（新增 2 条状态规则）
运行 ast-grep:all 验证扫描结果
运行 storybook 验证 AI 组件 Stories 渲染
--- 后续 ---
把 mock 代理替换成 facade 代理

20. Storybook + ast-grep 兼容性风险矩阵

| 维度 | 兼容性 | 风险 | 需要的改动 |
|---|---|---|---|
| Storybook CSF 3.0 格式 | 完全兼容 | 无 | 无 |
| Story 变体约定（Default/Empty/Loading/Error） | 完全对齐 | 无 | 无 |
| CopilotKit Provider Decorator | 不兼容 | 高 | 新增 mock + alias |
| CopilotKit CSS 加载 | 不兼容 | 中 | mock 中不导入，用 Tailwind 覆盖 |
| Zustand Store 隔离 | 部分兼容 | 中 | Story decorator 中重置 store |
| fetch Mock（ai-os-client） | 不兼容 | 中 | MSW 拦截 /api/copilot |
| ast-grep 扫描路径 | 不兼容 | 高 | 扩展 scanPaths 含 ai/components + ai/provider |
| ast-grep page-blocks 规则 | 部分兼容 | 低 | 新增 3 条 AI 块规则 |
| ast-grep state-patterns 规则 | 部分兼容 | 低 | 新增 2 条状态规则 |
| ast-grep TSX vs TS | 部分兼容 | 低 | ai/lib/ 下 TS 文件不纳入扫描 |
| component-seed.json | 不兼容 | 中 | 注册 7 个新组件 |