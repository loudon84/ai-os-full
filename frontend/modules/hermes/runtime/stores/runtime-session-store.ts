import { create } from "zustand";
import type { RuntimeMessage, RuntimeSession } from "../types";

/** 与 hermes-webui 的 `hermes-webui-session` 类似：刷新后恢复上次打开的会话 */
export const RUNTIME_LAST_SESSION_STORAGE_KEY = "hermes-portal-runtime-last-session";

function readStoredLastSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(RUNTIME_LAST_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredLastSessionId(sessionId: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (sessionId) localStorage.setItem(RUNTIME_LAST_SESSION_STORAGE_KEY, sessionId);
    else localStorage.removeItem(RUNTIME_LAST_SESSION_STORAGE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

function sessionSortTime(s: RuntimeSession): number {
  const raw = s.updated_at ?? s.created_at;
  if (raw == null || raw === "") return 0;
  if (typeof raw === "number") {
    return raw < 1e12 ? raw * 1000 : raw;
  }
  const asNum = Number(raw);
  if (!Number.isNaN(asNum) && asNum > 0) {
    return asNum < 1e12 ? asNum * 1000 : asNum;
  }
  const ms = Date.parse(String(raw));
  return Number.isNaN(ms) ? 0 : ms;
}

function pickResumeSessionId(sessions: RuntimeSession[]): string | null {
  if (!sessions.length) return null;
  const stored = readStoredLastSessionId();
  if (stored && sessions.some((x) => x.session_id === stored)) return stored;
  const sorted = [...sessions].sort((a, b) => sessionSortTime(b) - sessionSortTime(a));
  return sorted[0]?.session_id ?? null;
}

type RuntimeSessionState = {
  sessions: RuntimeSession[];
  currentSession: RuntimeSession | null;
  messages: RuntimeMessage[];
  busy: boolean;
  activeStreamId: string | null;
  lastUsage?: Record<string, unknown>;

  loadSessions: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  /** 拉取会话列表并恢复上次对话（或最近更新的会话） */
  bootstrapRuntimeConversation: () => Promise<void>;
  createSession: () => Promise<RuntimeSession>;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, title: string) => Promise<void>;

  setCurrentSession: (session: RuntimeSession | null) => void;
  setMessages: (messages: RuntimeMessage[]) => void;
  appendMessage: (message: RuntimeMessage) => void;
  setBusy: (busy: boolean) => void;
  setActiveStreamId: (streamId: string | null) => void;
  setLastUsage: (usage: Record<string, unknown> | undefined) => void;
};

async function apiJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...options, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export const useRuntimeSessionStore = create<RuntimeSessionState>((set, get) => ({
  sessions: [],
  currentSession: null,
  messages: [],
  busy: false,
  activeStreamId: null,
  lastUsage: undefined,

  loadSessions: async () => {
    const data = await apiJson<unknown>("/api/hermes/runtime/sessions");
    const sessions = Array.isArray(data)
      ? (data as RuntimeSession[])
      : (data as { sessions?: RuntimeSession[] })?.sessions ?? [];
    set({ sessions });
  },

  loadSession: async (sessionId: string) => {
    const data = await apiJson<{
      session: RuntimeSession & { messages?: RuntimeMessage[]; last_usage?: Record<string, unknown> };
    }>(`/api/hermes/runtime/session?session_id=${encodeURIComponent(sessionId)}`);
    const sess = data.session;
    const lastUsage = sess.last_usage ?? get().lastUsage;
    const msgs = (sess.messages ?? []).filter((m) => m && m.role);
    set({
      currentSession: sess,
      messages: msgs,
      lastUsage,
    });
    writeStoredLastSessionId(sessionId);
  },

  bootstrapRuntimeConversation: async () => {
    await get().loadSessions();
    const sid = pickResumeSessionId(get().sessions);
    if (sid) await get().loadSession(sid);
  },

  createSession: async () => {
    const data = await apiJson<{ session: RuntimeSession }>(
      "/api/hermes/runtime/session/new",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );
    const next = data.session;
    set((s) => ({ currentSession: next, sessions: [next, ...s.sessions], messages: [] }));
    writeStoredLastSessionId(next.session_id);
    return next;
  },

  deleteSession: async (sessionId: string) => {
    await apiJson("/api/hermes/runtime/session/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const stored = readStoredLastSessionId();
    if (stored === sessionId) writeStoredLastSessionId(null);
    set((s) => {
      const wasCurrent = s.currentSession?.session_id === sessionId;
      return {
        sessions: s.sessions.filter((x) => x.session_id !== sessionId),
        currentSession: wasCurrent ? null : s.currentSession,
        messages: wasCurrent ? [] : s.messages,
        lastUsage: wasCurrent ? undefined : s.lastUsage,
      };
    });
  },

  renameSession: async (sessionId: string, title: string) => {
    await apiJson("/api/hermes/runtime/session/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, title }),
    });
    set((s) => ({
      sessions: s.sessions.map((x) =>
        x.session_id === sessionId ? { ...x, title } : x
      ),
      currentSession:
        s.currentSession?.session_id === sessionId
          ? { ...s.currentSession, title }
          : s.currentSession,
    }));
  },

  setCurrentSession: (currentSession) => set({ currentSession }),
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) => set({ messages: [...get().messages, message] }),
  setBusy: (busy) => set({ busy }),
  setActiveStreamId: (activeStreamId) => set({ activeStreamId }),
  setLastUsage: (lastUsage) => set({ lastUsage }),
}));

