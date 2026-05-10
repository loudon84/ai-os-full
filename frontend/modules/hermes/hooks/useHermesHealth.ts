"use client";

import { useQuery } from "@tanstack/react-query";
import * as hermesApi from "../services/hermes.api";
import type { HermesHealth } from "../types/hermes.types";

export function useHermesHealth() {
  const query = useQuery({
    queryKey: ["hermes", "health"],
    queryFn: () => hermesApi.getHealth(),
    staleTime: 60_000,
    retry: 1,
    refetchInterval: 30_000,
  });

  const health: HermesHealth | null = query.data ?? null;
  const isUnreachable = health ? !health.gateway.reachable : true;

  return { health, isUnreachable, query };
}
