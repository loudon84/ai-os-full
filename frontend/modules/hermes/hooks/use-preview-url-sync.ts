"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useHermesPreviewStore } from "../stores/hermes-preview-store";
import type { PreviewMode } from "../stores/hermes-preview-store";
import { PREVIEW_DOMAIN_GROUPS } from "../dev/preview-groups";
import { PREVIEW_REGISTRY } from "../dev/preview-registry";

/** URL parameter key names */
export const PREVIEW_URL_PARAM_KEYS = {
  domain: "domain",
  scenario: "scenario",
  mode: "mode",
  jsonPanel: "json",
  contextPanel: "ctx",
  schemaPanel: "schema",
  perfPanel: "perf",
} as const;

const VALID_MODES: PreviewMode[] = ["mock", "fixture", "live"];
const VALID_DOMAINS = PREVIEW_DOMAIN_GROUPS.map((g) => g.domain);
const VALID_SCENARIO_KEYS = PREVIEW_REGISTRY.map((s) => s.key);

const DEBOUNCE_MS = 300;

/** Bidirectional sync between preview store state and URL query params */
export function usePreviewUrlSync(): void {
  const searchParams = useSearchParams();
  const store = useHermesPreviewStore();
  const initializedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize store from URL params (once on mount)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const domainParam = searchParams.get(PREVIEW_URL_PARAM_KEYS.domain);
    const scenarioParam = searchParams.get(PREVIEW_URL_PARAM_KEYS.scenario);
    const modeParam = searchParams.get(PREVIEW_URL_PARAM_KEYS.mode);
    const jsonParam = searchParams.get(PREVIEW_URL_PARAM_KEYS.jsonPanel);
    const ctxParam = searchParams.get(PREVIEW_URL_PARAM_KEYS.contextPanel);
    const schemaParam = searchParams.get(PREVIEW_URL_PARAM_KEYS.schemaPanel);
    const perfParam = searchParams.get(PREVIEW_URL_PARAM_KEYS.perfPanel);

    if (domainParam && VALID_DOMAINS.includes(domainParam as typeof VALID_DOMAINS[number])) {
      store.setDomain(domainParam as typeof VALID_DOMAINS[number]);
    }

    if (scenarioParam && VALID_SCENARIO_KEYS.includes(scenarioParam)) {
      store.setScenarioKey(scenarioParam);
    }

    if (modeParam && VALID_MODES.includes(modeParam as PreviewMode)) {
      store.setMode(modeParam as PreviewMode);
    }

    // Panel toggles: only apply if param is explicitly set
    if (jsonParam !== null) {
      const want = jsonParam === "1";
      if (store.panels.jsonPanel !== want) store.togglePanel("jsonPanel");
    }
    if (ctxParam !== null) {
      const want = ctxParam === "1";
      if (store.panels.contextPanel !== want) store.togglePanel("contextPanel");
    }
    if (schemaParam !== null) {
      const want = schemaParam === "1";
      if (store.panels.schemaPanel !== want) store.togglePanel("schemaPanel");
    }
    if (perfParam !== null) {
      const want = perfParam === "1";
      if (store.panels.perfPanel !== want) store.togglePanel("perfPanel");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync store state → URL (debounced, replaceState)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      params.set(PREVIEW_URL_PARAM_KEYS.domain, store.domain);
      params.set(PREVIEW_URL_PARAM_KEYS.scenario, store.scenarioKey);
      params.set(PREVIEW_URL_PARAM_KEYS.mode, store.mode);
      params.set(PREVIEW_URL_PARAM_KEYS.jsonPanel, store.panels.jsonPanel ? "1" : "0");
      params.set(PREVIEW_URL_PARAM_KEYS.contextPanel, store.panels.contextPanel ? "1" : "0");
      params.set(PREVIEW_URL_PARAM_KEYS.schemaPanel, store.panels.schemaPanel ? "1" : "0");
      params.set(PREVIEW_URL_PARAM_KEYS.perfPanel, store.panels.perfPanel ? "1" : "0");

      const qs = params.toString();
      const url = `${window.location.pathname}?${qs}`;
      window.history.replaceState(null, "", url);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [store.domain, store.scenarioKey, store.mode, store.panels]);
}
