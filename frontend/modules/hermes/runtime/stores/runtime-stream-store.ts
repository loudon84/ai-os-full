import { create } from "zustand";
import type { RuntimeMessage, RuntimeToolCall } from "../types";

export type InflightState = {
  streamId: string | null;
  messages: RuntimeMessage[];
  toolCalls: RuntimeToolCall[];
  uploaded?: string[];
};

type RuntimeStreamState = {
  inflight: Record<string, InflightState>;
  toolCalls: RuntimeToolCall[];

  markInflight: (sessionId: string, next: InflightState) => void;
  clearInflight: (sessionId: string) => void;

  addToolCall: (sessionId: string, toolCall: RuntimeToolCall) => void;
  completeToolCall: (sessionId: string, name: string, update: Partial<RuntimeToolCall>) => void;
  setToolCalls: (toolCalls: RuntimeToolCall[]) => void;
};

export const useRuntimeStreamStore = create<RuntimeStreamState>((set, get) => ({
  inflight: {},
  toolCalls: [],

  markInflight: (sessionId, next) =>
    set((s) => ({
      inflight: { ...s.inflight, [sessionId]: next },
      toolCalls: next.toolCalls ?? s.toolCalls,
    })),

  clearInflight: (sessionId) =>
    set((s) => {
      const next = { ...s.inflight };
      delete next[sessionId];
      return { inflight: next, toolCalls: s.toolCalls };
    }),

  addToolCall: (sessionId, toolCall) =>
    set((s) => {
      const inflight = s.inflight[sessionId] ?? { streamId: null, messages: [], toolCalls: [] };
      const nextInflight = {
        ...s.inflight,
        [sessionId]: { ...inflight, toolCalls: [...(inflight.toolCalls ?? []), toolCall] },
      };
      return { inflight: nextInflight, toolCalls: nextInflight[sessionId].toolCalls };
    }),

  completeToolCall: (sessionId, name, update) =>
    set((s) => {
      const inflight = s.inflight[sessionId];
      if (!inflight) return s;
      const toolCalls = [...(inflight.toolCalls ?? [])];
      for (let i = toolCalls.length - 1; i >= 0; i--) {
        const cur = toolCalls[i];
        if (!cur) continue;
        if (cur.done) continue;
        if (!name || cur.name === name) {
          toolCalls[i] = { ...cur, ...update, done: true };
          break;
        }
      }
      const nextInflight = { ...s.inflight, [sessionId]: { ...inflight, toolCalls } };
      return { inflight: nextInflight, toolCalls };
    }),

  setToolCalls: (toolCalls) => set({ toolCalls }),
}));

