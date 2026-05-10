"use client";

import { useQuery } from "@tanstack/react-query";
import * as hermesApi from "../services/hermes.api";
import type { HermesMetrics } from "../types/hermes.types";

export function useHermesMetrics() {
  const query = useQuery({
    queryKey: ["hermes", "metrics"],
    queryFn: () => hermesApi.getMetrics(),
    staleTime: 60_000,
    retry: 1,
    refetchInterval: 30_000,
  });

  const metrics: HermesMetrics | null = query.data ?? null;

  return { metrics, query };
}
