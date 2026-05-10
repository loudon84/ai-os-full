/**
 * useHermesInterrupt - Hook for accessing interrupt/resume state.
 */
"use client";

import { useHermesInterruptStore } from "../stores/hermes-interrupt-store";

export function useHermesInterrupt() {
  const interrupt = useHermesInterruptStore((s) => s.interrupt);
  const setInterrupt = useHermesInterruptStore((s) => s.setInterrupt);
  const clearInterrupt = useHermesInterruptStore((s) => s.clearInterrupt);

  return {
    interrupt,
    setInterrupt,
    clearInterrupt,
  };
}
