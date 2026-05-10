"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRuntimeApprovalStore } from "../stores/runtime-approval-store";
import { useRuntimeSessionStore } from "../stores/runtime-session-store";
import { useRuntimeStreamStore } from "../stores/runtime-stream-store";
import type { RuntimeApproval, RuntimeClarify, RuntimeMessage, RuntimeToolCall, RuntimeUsage } from "../types";

type SendInput = {
  text: string;
  files?: File[];
};

type StartResponse = {
  stream_id: string;
  effective_model?: string;
};

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function useRuntimeSse() {
  const currentSession = useRuntimeSessionStore((s) => s.currentSession);
  const messages = useRuntimeSessionStore((s) => s.messages);
  const setMessages = useRuntimeSessionStore((s) => s.setMessages);
  const appendMessage = useRuntimeSessionStore((s) => s.appendMessage);
  const setBusy = useRuntimeSessionStore((s) => s.setBusy);
  const setActiveStreamId = useRuntimeSessionStore((s) => s.setActiveStreamId);
  const setLastUsage = useRuntimeSessionStore((s) => s.setLastUsage);
  const loadSession = useRuntimeSessionStore((s) => s.loadSession);

  const markInflight = useRuntimeStreamStore((s) => s.markInflight);
  const clearInflight = useRuntimeStreamStore((s) => s.clearInflight);
  const addToolCall = useRuntimeStreamStore((s) => s.addToolCall);
  const completeToolCall = useRuntimeStreamStore((s) => s.completeToolCall);
  const setToolCalls = useRuntimeStreamStore((s) => s.setToolCalls);

  const showApproval = useRuntimeApprovalStore((s) => s.showApproval);
  const showClarify = useRuntimeApprovalStore((s) => s.showClarify);
  const hideApproval = useRuntimeApprovalStore((s) => s.hideApproval);
  const hideClarify = useRuntimeApprovalStore((s) => s.hideClarify);

  const sourceRef = useRef<EventSource | null>(null);
  const streamingSessionIdRef = useRef<string | null>(null);
  const streamIdRef = useRef<string | null>(null);

  const assistantTextRef = useRef<string>("");
  const reasoningTextRef = useRef<string>("");
  const renderPendingRef = useRef<boolean>(false);

  const closeSource = useCallback(() => {
    try {
      sourceRef.current?.close();
    } catch {}
    sourceRef.current = null;
  }, []);

  const scheduleRender = useCallback(() => {
    if (renderPendingRef.current) return;
    renderPendingRef.current = true;
    requestAnimationFrame(() => {
      renderPendingRef.current = false;
      const sid = streamingSessionIdRef.current;
      if (!sid) return;
      const prev = useRuntimeSessionStore.getState().messages;
      const next = [...prev];
      let lastIdx = -1;
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i]?.role === "assistant") {
          lastIdx = i;
          break;
        }
      }
      if (lastIdx === -1) {
        next.push({
          role: "assistant",
          content: assistantTextRef.current,
          reasoning: reasoningTextRef.current || undefined,
          _ts: Date.now() / 1000,
        });
        setMessages(next);
        return;
      }
      const cur = next[lastIdx] as RuntimeMessage;
      next[lastIdx] = {
        ...cur,
        content: assistantTextRef.current,
        reasoning: reasoningTextRef.current || cur.reasoning,
        _ts: cur._ts ?? Date.now() / 1000,
      };
      setMessages(next);
    });
  }, [setMessages]);

  const attachSse = useCallback(
    (sessionId: string, streamId: string) => {
      streamingSessionIdRef.current = sessionId;
      streamIdRef.current = streamId;

      const url = new URL(
        `/api/hermes/runtime/chat/stream?stream_id=${encodeURIComponent(streamId)}`,
        window.location.origin
      );

      const source = new EventSource(url.toString(), { withCredentials: true });
      sourceRef.current = source;

      const terminalize = async () => {
        closeSource();
        clearInflight(sessionId);
        setActiveStreamId(null);
        setBusy(false);
        hideApproval();
        hideClarify();
        // Refresh final messages from backend if possible
        try {
          await loadSession(sessionId);
        } catch {}
      };

      source.addEventListener("token", (e) => {
        const payload = safeJsonParse<{ text?: string }>((e as MessageEvent).data);
        if (!payload?.text) return;
        assistantTextRef.current += payload.text;
        scheduleRender();
      });

      source.addEventListener("reasoning", (e) => {
        const payload = safeJsonParse<{ text?: string }>((e as MessageEvent).data);
        if (!payload?.text) return;
        reasoningTextRef.current += payload.text;
        scheduleRender();
      });

      source.addEventListener("tool", (e) => {
        const payload = safeJsonParse<Record<string, unknown>>((e as MessageEvent).data) ?? {};
        const name = String(payload.name ?? "");
        if (!name) return;
        const tc: RuntimeToolCall = {
          name,
          preview: String(payload.preview ?? ""),
          args: (payload.args as Record<string, string>) ?? {},
          snippet: "",
          done: false,
          tid: (payload.tid as string) ?? `live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        };
        addToolCall(sessionId, tc);
      });

      source.addEventListener("tool_complete", (e) => {
        const payload = safeJsonParse<Record<string, unknown>>((e as MessageEvent).data) ?? {};
        const name = String(payload.name ?? "");
        completeToolCall(sessionId, name, {
          preview: String(payload.preview ?? ""),
          args: (payload.args as Record<string, string>) ?? {},
          is_error: Boolean(payload.is_error),
          duration: typeof payload.duration === "number" ? payload.duration : undefined,
        });
      });

      source.addEventListener("approval", (e) => {
        const payload = safeJsonParse<RuntimeApproval>((e as MessageEvent).data);
        if (!payload) return;
        showApproval(payload, sessionId);
      });

      source.addEventListener("clarify", (e) => {
        const payload = safeJsonParse<RuntimeClarify>((e as MessageEvent).data);
        if (!payload) return;
        showClarify(payload, sessionId);
      });

      source.addEventListener("done", async (e) => {
        const payload = safeJsonParse<{ session?: { messages?: RuntimeMessage[]; tool_calls?: RuntimeToolCall[] }; usage?: RuntimeUsage }>(
          (e as MessageEvent).data
        );
        if (payload?.usage) {
          setLastUsage(payload.usage as unknown as Record<string, unknown>);
        }
        if (payload?.session?.tool_calls) {
          setToolCalls(payload.session.tool_calls.map((x) => ({ ...x, done: true })));
        }
        if (payload?.session?.messages) {
          setMessages(payload.session.messages);
        }
        await terminalize();
      });

      source.addEventListener("apperror", async (e) => {
        const payload = safeJsonParse<{ message?: string; hint?: string }>((e as MessageEvent).data) ?? {};
        appendMessage({
          role: "assistant",
          content: `**Error:** ${payload.message ?? "Unknown error"}${payload.hint ? `\n\n*${payload.hint}*` : ""}`,
          _ts: Date.now() / 1000,
          _error: true,
        });
        await terminalize();
      });

      source.addEventListener("cancel", async () => {
        appendMessage({ role: "assistant", content: "*Task cancelled.*", _ts: Date.now() / 1000 });
        await terminalize();
      });

      source.addEventListener("stream_end", () => {
        closeSource();
      });

      source.addEventListener("error", async () => {
        // Basic fallback: try to restore the settled session state
        await terminalize();
      });
    },
    [
      addToolCall,
      appendMessage,
      clearInflight,
      closeSource,
      completeToolCall,
      hideApproval,
      hideClarify,
      loadSession,
      scheduleRender,
      setActiveStreamId,
      setBusy,
      setLastUsage,
      setMessages,
      setToolCalls,
      showApproval,
      showClarify,
    ]
  );

  const uploadFiles = useCallback(
    async (sessionId: string, files: File[]): Promise<string[]> => {
      if (!files.length) return [];
      const uploaded: string[] = [];
      for (const f of files) {
        const fd = new FormData();
        fd.append("session_id", sessionId);
        fd.append("file", f, f.name);
        try {
          const res = await fetch("/api/hermes/runtime/upload", {
            method: "POST",
            body: fd,
          });
          if (!res.ok) throw new Error(await res.text().catch(() => "upload failed"));
          const data = (await res.json()) as { filename?: string; error?: string };
          if (data.error) throw new Error(data.error);
          if (data.filename) uploaded.push(data.filename);
        } catch {
          // silently skip failed uploads for now
        }
      }
      return uploaded;
    },
    []
  );

  const send = useCallback(
    async (input: SendInput) => {
      let sid = currentSession?.session_id;
      const text = input.text.trim();
      const files = input.files ?? [];
      if (!text && files.length === 0) return;

      if (!sid) {
        const created = await useRuntimeSessionStore.getState().createSession();
        sid = created.session_id;
        await useRuntimeSessionStore.getState().loadSession(sid);
      }

      assistantTextRef.current = "";
      reasoningTextRef.current = "";
      setToolCalls([]);
      setBusy(true);

      const uploaded = await uploadFiles(sid, files);

      let msgText = text;
      if (uploaded.length && !msgText) {
        msgText = `I've uploaded ${uploaded.length} file(s): ${uploaded.join(", ")}`;
      } else if (uploaded.length) {
        msgText = `${text}\n\n[Attached files: ${uploaded.join(", ")}]`;
      }
      if (!msgText) {
        setBusy(false);
        return;
      }

      const displayText = text || (uploaded.length ? `Uploaded: ${uploaded.join(", ")}` : "");
      const userMsg: RuntimeMessage = {
        role: "user",
        content: displayText,
        attachments: uploaded.length ? uploaded : undefined,
        _ts: Date.now() / 1000,
      };
      appendMessage(userMsg);
      setActiveStreamId(null);
      markInflight(sid, {
        streamId: null,
        messages: [...useRuntimeSessionStore.getState().messages, userMsg],
        toolCalls: [],
        uploaded,
      });

      const sessionNow = useRuntimeSessionStore.getState().currentSession;
      const res = await fetch("/api/hermes/runtime/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sid,
          message: msgText,
          model: sessionNow?.model,
          workspace: sessionNow?.workspace,
          attachments: uploaded.length ? uploaded : undefined,
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setBusy(false);
        throw new Error(`chat/start failed: ${res.status} ${t}`);
      }
      const data = (await res.json()) as StartResponse;
      const streamId = data.stream_id;
      setActiveStreamId(streamId);
      markInflight(sid, {
        streamId,
        messages: [...useRuntimeSessionStore.getState().messages, userMsg],
        toolCalls: [],
        uploaded,
      });
      attachSse(sid, streamId);
    },
    [
      attachSse,
      appendMessage,
      currentSession,
      markInflight,
      setActiveStreamId,
      setBusy,
      setToolCalls,
      uploadFiles,
    ]
  );

  const cancel = useCallback(async () => {
    const streamId = streamIdRef.current;
    if (!streamId) return;
    await fetch(`/api/hermes/runtime/chat/cancel?stream_id=${encodeURIComponent(streamId)}`, {
      method: "GET",
      cache: "no-store",
    }).catch(() => {});
    closeSource();
    streamIdRef.current = null;
    streamingSessionIdRef.current = null;
    setActiveStreamId(null);
    setBusy(false);
  }, [closeSource, setActiveStreamId, setBusy]);

  useEffect(() => {
    return () => {
      closeSource();
    };
  }, [closeSource]);

  return {
    send,
    cancel,
  };
}

