"use client";

import { useQuery } from "@tanstack/react-query";
import * as hermesApi from "../services/hermes.api";
import type { HermesActivityPoint } from "../types/hermes.types";

export function useHermesActivity(days = 14) {
  const query = useQuery({
    queryKey: ["hermes", "activity", days],
    queryFn: () => hermesApi.getActivity(days),
    staleTime: 60_000,
    retry: 1,
  });

  const activity: HermesActivityPoint[] = query.data ?? [];

  return { activity, query };
}
