/**
 * Hermes Tool UI Store
 * Zustand store for tracking tool call results for structured UI rendering.
 */
import { create } from "zustand";

type ToolUiRecord = {
  callId: string;
  toolName: string;
  status: "started" | "finished" | "error";
  result?: unknown;
  latencyMs?: number;
};

type ToolUiState = {
  records: Record<string, ToolUiRecord>;
  upsertRecord: (record: ToolUiRecord) => void;
  clearRecords: () => void;
};

export const useHermesToolUiStore = create<ToolUiState>((set) => ({
  records: {},
  upsertRecord: (record) =>
    set((state) => ({
      records: {
        ...state.records,
        [record.callId]: record,
      },
    })),
  clearRecords: () => set({ records: {} }),
}));
