/**
 * useToolUi - Hook for accessing the tool UI store
 * to read and update tool call records.
 */
"use client";

import { useHermesToolUiStore } from "../stores/hermes-tool-ui-store";

export function useToolUi() {
  const records = useHermesToolUiStore((s) => s.records);
  const upsertRecord = useHermesToolUiStore((s) => s.upsertRecord);
  const clearRecords = useHermesToolUiStore((s) => s.clearRecords);

  return {
    records,
    upsertRecord,
    clearRecords,
  };
}
