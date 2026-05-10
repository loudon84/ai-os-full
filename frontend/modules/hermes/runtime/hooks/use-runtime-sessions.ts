"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RuntimeMessage, RuntimeSession } from "../types";

async function apiJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...options, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export function useRuntimeSessions() {
  const qc = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ["hermes", "runtime", "sessions"],
    queryFn: async () => apiJson<RuntimeSession[]>("/api/hermes/runtime/sessions"),
  });

  const createSession = useMutation({
    mutationFn: async () =>
      apiJson<{ session: RuntimeSession }>("/api/hermes/runtime/session/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["hermes", "runtime", "sessions"] });
    },
  });

  const renameSession = useMutation({
    mutationFn: async (input: { sessionId: string; title: string }) =>
      apiJson("/api/hermes/runtime/session/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: input.sessionId, title: input.title }),
      }),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: ["hermes", "runtime", "sessions"] });
      await qc.invalidateQueries({ queryKey: ["hermes", "runtime", "session", vars.sessionId] });
    },
  });

  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) =>
      apiJson("/api/hermes/runtime/session/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      }),
    onSuccess: async (_data, sessionId) => {
      await qc.invalidateQueries({ queryKey: ["hermes", "runtime", "sessions"] });
      await qc.removeQueries({ queryKey: ["hermes", "runtime", "session", sessionId] });
    },
  });

  return {
    sessionsQuery,
    createSession,
    renameSession,
    deleteSession,
  };
}

export function useRuntimeSession(sessionId: string) {
  return useQuery({
    queryKey: ["hermes", "runtime", "session", sessionId],
    enabled: !!sessionId,
    queryFn: async () =>
      apiJson<{ session: RuntimeSession & { messages?: RuntimeMessage[] } }>(
        `/api/hermes/runtime/session?session_id=${encodeURIComponent(sessionId)}`
      ),
  });
}

