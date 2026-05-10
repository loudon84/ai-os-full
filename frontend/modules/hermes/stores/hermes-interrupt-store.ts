/**
 * Hermes Interrupt Store
 * Zustand store for managing interrupt/resume state.
 */
import { create } from "zustand";
import type { HermesInterruptState } from "../types/interrupt";

type InterruptStore = {
  interrupt: HermesInterruptState;
  setInterrupt: (state: HermesInterruptState) => void;
  clearInterrupt: () => void;
};

export const useHermesInterruptStore = create<InterruptStore>((set) => ({
  interrupt: { status: "idle" },
  setInterrupt: (interrupt) => set({ interrupt }),
  clearInterrupt: () => set({ interrupt: { status: "idle" } }),
}));
