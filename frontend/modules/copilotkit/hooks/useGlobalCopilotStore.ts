"use client";

import { create } from "zustand";

type GlobalCopilotStore = {
  open: boolean;
  sessionId?: string;
  setOpen: (open: boolean) => void;
  setSessionId: (sessionId?: string) => void;
};

export const useGlobalCopilotStore = create<GlobalCopilotStore>((set) => ({
  open: false,
  sessionId: undefined,
  setOpen: (open) => set({ open }),
  setSessionId: (sessionId) => set({ sessionId }),
}));
