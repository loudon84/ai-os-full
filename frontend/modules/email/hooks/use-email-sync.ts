"use client";

import { useCallback, useState } from "react";

import { fetchEmailSyncStatus, triggerEmailSync } from "../services/email-api";

interface UseEmailSyncOptions {
  /** 未绑定邮箱时为 false，禁止同步 */
  enabled?: boolean;
  onAfterSync?: () => void | Promise<void>;
}

export function useEmailSync(options: UseEmailSyncOptions = {}) {
  const { enabled = true, onAfterSync } = options;
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const syncNow = useCallback(async () => {
    if (!enabled) {
      setLastError("请先绑定邮箱账号");
      return { ok: false as const };
    }
    setIsSyncing(true);
    setLastError(null);
    try {
      const result = await triggerEmailSync();
      if (!result.success) {
        setLastError(result.error.message);
        return { ok: false as const, error: result.error.message };
      }
      await fetchEmailSyncStatus().catch(() => null);
      await onAfterSync?.();
      return { ok: true as const };
    } finally {
      setIsSyncing(false);
    }
  }, [enabled, onAfterSync]);

  return { isSyncing, lastError, setLastError, syncNow };
}
