"use client";

import { useEffect, useRef } from "react";
import { useRuntimeApprovalStore } from "../stores/runtime-approval-store";
import type { RuntimeApproval } from "../types";

async function apiJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...options, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export function useRuntimeApprovalPolling(activeSessionId: string, enabled: boolean) {
  const showApproval = useRuntimeApprovalStore((s) => s.showApproval);
  const hideApproval = useRuntimeApprovalStore((s) => s.hideApproval);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !activeSessionId) return;

    const tick = async () => {
      try {
        const data = await apiJson<{ pending?: RuntimeApproval; pending_count?: number }>(
          `/api/hermes/runtime/approval/pending?session_id=${encodeURIComponent(activeSessionId)}`
        );
        if (data.pending) showApproval({ ...data.pending, _session_id: activeSessionId }, activeSessionId);
        else hideApproval();
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
  }, [activeSessionId, enabled, hideApproval, showApproval]);
}

export function useRuntimeApprovalActions() {
  const hideApproval = useRuntimeApprovalStore((s) => s.hideApproval);

  const respond = async (sessionId: string, choice: "once" | "session" | "always" | "deny", approvalId?: string | null) => {
    hideApproval();
    await apiJson("/api/hermes/runtime/approval/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, choice, approval_id: approvalId ?? null }),
    });
  };

  return { respond };
}

