"use client";

import { useEffect, useRef } from "react";
import { useRuntimeApprovalStore } from "../stores/runtime-approval-store";
import type { RuntimeClarify } from "../types";

async function apiJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...options, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export function useRuntimeClarifyPolling(activeSessionId: string, enabled: boolean) {
  const showClarify = useRuntimeApprovalStore((s) => s.showClarify);
  const hideClarify = useRuntimeApprovalStore((s) => s.hideClarify);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !activeSessionId) return;

    const tick = async () => {
      try {
        const data = await apiJson<{ pending?: RuntimeClarify }>(
          `/api/hermes/runtime/clarify/pending?session_id=${encodeURIComponent(activeSessionId)}`
        );
        if (data.pending) showClarify({ ...data.pending, _session_id: activeSessionId }, activeSessionId);
        else hideClarify();
      } catch {
        // ignore transient polling errors
      }
    };

    tick();
    timerRef.current = window.setInterval(tick, 1500);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [activeSessionId, enabled, hideClarify, showClarify]);
}

export function useRuntimeClarifyActions() {
  const hideClarify = useRuntimeApprovalStore((s) => s.hideClarify);

  const respond = async (sessionId: string, response: string) => {
    hideClarify();
    await apiJson("/api/hermes/runtime/clarify/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, response }),
    });
  };

  return { respond };
}

