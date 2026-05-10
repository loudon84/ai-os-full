"use client";

import { useEffect, useState, useCallback } from "react";
import { useHermesPreviewStore } from "../stores/hermes-preview-store";
import type { PreviewMode } from "../stores/hermes-preview-store";
import { getScenariosByDomain } from "../dev/preview-registry";
import { PREVIEW_DOMAIN_GROUPS } from "../dev/preview-groups";

const MODE_CYCLE: PreviewMode[] = ["mock", "fixture", "live"];

/** Register keyboard shortcuts for the Dev Preview page */
export function usePreviewShortcuts(): {
  cheatsheetOpen: boolean;
  setCheatsheetOpen: (open: boolean) => void;
} {
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);

  const domain = useHermesPreviewStore((s) => s.domain);
  const scenarioKey = useHermesPreviewStore((s) => s.scenarioKey);
  const mode = useHermesPreviewStore((s) => s.mode);
  const setDomain = useHermesPreviewStore((s) => s.setDomain);
  const setScenarioKey = useHermesPreviewStore((s) => s.setScenarioKey);
  const setMode = useHermesPreviewStore((s) => s.setMode);
  const togglePanel = useHermesPreviewStore((s) => s.togglePanel);
  const reset = useHermesPreviewStore((s) => s.reset);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // ? key (no modifier) → open cheatsheet
      if (event.key === "?" && !event.altKey && !event.ctrlKey && !event.metaKey) {
        // Don't trigger if user is typing in an input/textarea
        const tag = (event.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        event.preventDefault();
        setCheatsheetOpen((prev) => !prev);
        return;
      }

      // All other shortcuts require Alt modifier
      if (!event.altKey) return;

      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // Alt+1/2/3 → switch domain
      if (event.key === "1" || event.key === "2" || event.key === "3") {
        event.preventDefault();
        const idx = parseInt(event.key) - 1;
        if (idx < PREVIEW_DOMAIN_GROUPS.length) {
          setDomain(PREVIEW_DOMAIN_GROUPS[idx].domain);
        }
        return;
      }

      // Alt+ArrowDown/ArrowUp → next/prev scenario
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const scenarios = getScenariosByDomain(domain);
        const currentIdx = scenarios.findIndex((s) => s.key === scenarioKey);
        if (currentIdx >= 0) {
          const nextIdx =
            event.key === "ArrowDown"
              ? Math.min(currentIdx + 1, scenarios.length - 1)
              : Math.max(currentIdx - 1, 0);
          setScenarioKey(scenarios[nextIdx].key);
        }
        return;
      }

      // Alt+M → cycle mode
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        const currentIdx = MODE_CYCLE.indexOf(mode);
        const nextIdx = (currentIdx + 1) % MODE_CYCLE.length;
        setMode(MODE_CYCLE[nextIdx]);
        return;
      }

      // Alt+J → toggle JSON panel
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        togglePanel("jsonPanel");
        return;
      }

      // Alt+C → toggle Context panel
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        togglePanel("contextPanel");
        return;
      }

      // Alt+S → toggle Schema panel
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        togglePanel("schemaPanel");
        return;
      }

      // Alt+R → reset
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        reset();
        return;
      }
    },
    [domain, scenarioKey, mode, setDomain, setScenarioKey, setMode, togglePanel, reset]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { cheatsheetOpen, setCheatsheetOpen };
}
