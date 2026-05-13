"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EmailMessageResponse } from "@portal/shared";

import { createHermesClient } from "../client";
import { createHermesRuntimeSession } from "../client/web-hermes-client";
import type { HermesPanelMessage } from "../client/hermes-client.types";
import type { RuntimeMessage, RuntimeToolCall } from "../runtime/types";
import {
  clearPanelSessionBinding,
  getPanelSessionBinding,
  setPanelSessionBinding,
} from "../stores/hermes-panel-session-binding";
import { htmlToPlainText } from "@/modules/email/lib/html-to-text";
import { injectEmailToWorkspace, type EmailWorkspaceInjectResult } from "../services/workspace-email-inject";

export type HermesPanelChatContext = {
  type: string;
  payload: unknown;
  summary?: string;
};

function buildContextPrefix(ctx: HermesPanelChatContext | null | undefined): string {
  if (!ctx) return "";
  const summary = ctx.summary ?? "";
  let dataStr = "";
  try {
    dataStr = JSON.stringify(ctx.payload);
  } catch {
    dataStr = String(ctx.payload);
  }
  const clipped = dataStr.length > 12000 ? dataStr.slice(0, 12000) + "\n…（已截断）" : dataStr;
  return `[上下文类型: ${ctx.type}]\n摘要: ${summary}\n数据:\n${clipped}\n\n`;
}

function runtimeMessagesToPanel(msgs: RuntimeMessage[]): HermesPanelMessage[] {
  const out: HermesPanelMessage[] = [];
  for (const m of msgs) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    out.push({
      role: m.role,
      content: m.content ?? "",
      timestamp: m._ts ?? m.timestamp ?? Date.now() / 1000,
      isStreaming: false,
    });
  }
  return out;
}

async function fetchRuntimeSession(
  sessionId: string,
): Promise<{ messages: HermesPanelMessage[]; notFound: boolean; workspace: string | null }> {
  const res = await fetch(
    `/api/hermes/runtime/session?session_id=${encodeURIComponent(sessionId)}`,
    { cache: "no-store", credentials: "same-origin" },
  );
  if (res.status === 404) {
    return { messages: [], notFound: true, workspace: null };
  }
  if (!res.ok) {
    return { messages: [], notFound: false, workspace: null };
  }
  const data = (await res.json()) as {
    session?: { messages?: RuntimeMessage[]; workspace?: string };
  };
  const raw = data.session?.messages ?? [];
  return {
    messages: runtimeMessagesToPanel(
      raw.filter((m) => m && (m.role === "user" || m.role === "assistant")),
    ),
    notFound: false,
    workspace: data.session?.workspace ?? null,
  };
}

async function fetchPanelWorkspacePath(sessionId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `/api/hermes/runtime/session?session_id=${encodeURIComponent(sessionId)}`,
      { cache: "no-store", credentials: "same-origin" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { session?: { workspace?: string } };
    return data.session?.workspace ?? null;
  } catch {
    return null;
  }
}

export function useHermesPanelChat(options: {
  context?: HermesPanelChatContext | null;
  presetSystemPrompt?: string;
  profile?: string;
  /** 传入则把 runtime 会话与此键绑定（如 `email:${messageId}`），关闭再打开同一明细可续聊 */
  persistenceKey?: string;
  /** 首轮发消息前写入 Hermes workspace（需与 `context.type === "email"` 且 payload.id 一致） */
  emailForWorkspaceInject?: EmailMessageResponse | null;
  onEmailWorkspaceInjected?: (result: EmailWorkspaceInjectResult) => void;
}) {
  const client = useMemo(() => createHermesClient(), []);
  const [messages, setMessages] = useState<HermesPanelMessage[]>([]);
  const [toolCalls, setToolCalls] = useState<RuntimeToolCall[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  /** 与 hermes-webui 会话绑定，供 `/api/hermes/runtime/list` 等 workspace 接口使用 */
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const persistenceKeyRef = useRef(options.persistenceKey);
  persistenceKeyRef.current = options.persistenceKey;

  useEffect(() => {
    const key = options.persistenceKey;
    let cancelled = false;

    if (!key) {
      sessionIdRef.current = undefined;
      setSessionId(null);
      setWorkspacePath(null);
      setMessages([]);
      setToolCalls([]);
      setError(null);
      setRestoring(false);
      return;
    }

    const stored = getPanelSessionBinding(key);
    sessionIdRef.current = stored;

    if (!stored) {
      setSessionId(null);
      setWorkspacePath(null);
      setMessages([]);
      setToolCalls([]);
      setRestoring(false);
      return;
    }

    setRestoring(true);
    void fetchRuntimeSession(stored).then(({ messages: loaded, notFound, workspace }) => {
      if (cancelled) return;
      if (notFound) {
        clearPanelSessionBinding(key);
        sessionIdRef.current = undefined;
        setSessionId(null);
        setWorkspacePath(null);
        setMessages([]);
        setToolCalls([]);
        setRestoring(false);
        return;
      }
      setSessionId(stored);
      setWorkspacePath(workspace);
      setMessages(loaded);
      setToolCalls([]);
      setRestoring(false);
    });

    return () => {
      cancelled = true;
    };
  }, [options.persistenceKey]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    setMessages((prev) =>
      prev.map((m) => (m.role === "assistant" && m.isStreaming ? { ...m, isStreaming: false } : m)),
    );
  }, []);

  const clear = useCallback(() => {
    const key = persistenceKeyRef.current;
    cancel();
    if (key) clearPanelSessionBinding(key);
    sessionIdRef.current = undefined;
    setSessionId(null);
    setWorkspacePath(null);
    setMessages([]);
    setToolCalls([]);
    setError(null);
  }, [cancel]);

  const send = useCallback(
    (userText: string) => {
      const trimmed = userText.trim();
      if (!trimmed || busy || restoring) return;

      const priorMessages = messages.filter((m) => !m.isStreaming);
      const isFirstUserMessage = priorMessages.length === 0;

      const ctxPrefix = buildContextPrefix(options.context ?? null);
      const systemLead = options.presetSystemPrompt?.trim()
        ? `${options.presetSystemPrompt.trim()}\n\n`
        : "";
      const payloadMessage = isFirstUserMessage
        ? `${systemLead}${ctxPrefix}[用户]\n${trimmed}`
        : trimmed;

      abortRef.current?.abort();

      setError(null);
      setBusy(true);
      setToolCalls([]);

      const userMsg: HermesPanelMessage = {
        role: "user",
        content: trimmed,
        timestamp: Date.now() / 1000,
      };
      const assistantMsg: HermesPanelMessage = {
        role: "assistant",
        content: "",
        timestamp: Date.now() / 1000,
        isStreaming: true,
      };

      const history = priorMessages.map((m) => ({ role: m.role, content: m.content }));

      const persistKey = persistenceKeyRef.current;

      const persistSessionId = (sid: string) => {
        sessionIdRef.current = sid;
        setSessionId(sid);
        if (persistKey) setPanelSessionBinding(persistKey, sid);
        void fetchPanelWorkspacePath(sid).then(setWorkspacePath);
      };

      const rollbackNewSession = () => {
        if (persistKey) clearPanelSessionBinding(persistKey);
        sessionIdRef.current = undefined;
        setSessionId(null);
        setWorkspacePath(null);
      };

      void (async () => {
        const ctx = options.context;
        const injectMail = options.emailForWorkspaceInject;
        const payloadId =
          ctx && typeof ctx.payload === "object" && ctx.payload !== null && "id" in ctx.payload
            ? String((ctx.payload as { id: string }).id)
            : undefined;
        const shouldInject =
          isFirstUserMessage &&
          !sessionIdRef.current &&
          ctx?.type === "email" &&
          injectMail &&
          payloadId !== undefined &&
          injectMail.id === payloadId;

        if (shouldInject) {
          try {
            const sidNow = await createHermesRuntimeSession();
            persistSessionId(sidNow);
            const plainBody =
              injectMail.text_body ??
              htmlToPlainText(injectMail.html_body ?? "") ??
              injectMail.snippet ??
              "";
            const inj = await injectEmailToWorkspace({
              sessionId: sidNow,
              email: injectMail,
              plainBody,
            });
            options.onEmailWorkspaceInjected?.(inj);
            if (!inj.ok) {
              rollbackNewSession();
              setError(inj.error ?? "邮件上下文写入 workspace 失败");
              setBusy(false);
              return;
            }
          } catch (e) {
            rollbackNewSession();
            setError(e instanceof Error ? e.message : String(e));
            setBusy(false);
            return;
          }
        }

        setMessages((prev) => [...prev, userMsg, assistantMsg]);

        const ac = client.send(
          {
            message: payloadMessage,
            sessionId: sessionIdRef.current,
            profile: options.profile,
            history: history.length ? history : undefined,
          },
          {
            onSessionEstablished: (sid) => {
              persistSessionId(sid);
            },
            onChunk: (text) => {
              setMessages((prev) => {
                const next = [...prev];
                for (let i = next.length - 1; i >= 0; i--) {
                  const cur = next[i];
                  if (cur?.role === "assistant" && cur.isStreaming) {
                    next[i] = {
                      ...cur,
                      content: cur.content + text,
                    };
                    break;
                  }
                }
                return next;
              });
            },
            onToolProgress: (toolName, preview) => {
              const tc: RuntimeToolCall = {
                name: toolName,
                preview: preview ?? "",
                args: {},
                snippet: "",
                done: false,
                tid: `panel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              };
              setToolCalls((prev) => [...prev, tc]);
            },
            onUsage: () => {
              /* 面板可选展示用量，暂忽略 */
            },
            onDone: (result) => {
              const sid = result?.sessionId;
              if (sid) persistSessionId(sid);
              setBusy(false);
              abortRef.current = null;
              setMessages((prev) =>
                prev.map((m) =>
                  m.role === "assistant" && m.isStreaming ? { ...m, isStreaming: false } : m,
                ),
              );
            },
            onError: (msg) => {
              setError(msg);
              setBusy(false);
              abortRef.current = null;
              setMessages((prev) =>
                prev.map((m) =>
                  m.role === "assistant" && m.isStreaming
                    ? {
                        ...m,
                        content: m.content ? `${m.content}\n\n**错误：** ${msg}` : `**错误：** ${msg}`,
                        isStreaming: false,
                      }
                    : m,
                ),
              );
            },
          },
        );

        abortRef.current = ac;
      })();
    },
    [
      busy,
      restoring,
      client,
      messages,
      options.context,
      options.presetSystemPrompt,
      options.profile,
      options.emailForWorkspaceInject,
      options.onEmailWorkspaceInjected,
    ],
  );

  return {
    messages,
    toolCalls,
    busy,
    error,
    restoring,
    sessionId,
    workspacePath,
    send,
    cancel,
    clear,
  };
}
