"use client";

import { useQuery } from "@tanstack/react-query";

export type RuntimeModel = {
  id?: string;
  model?: string;
  provider?: string;
  base_url?: string;
  display_name?: string;
  group?: string;
};

async function apiJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export function useRuntimeModels() {
  return useQuery({
    queryKey: ["hermes", "runtime", "models"],
    queryFn: async () => apiJson<unknown>("/api/hermes/runtime/models"),
  });
}

