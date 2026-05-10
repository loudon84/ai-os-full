"use client";

import { useQuery } from "@tanstack/react-query";
import * as hermesApi from "../services/hermes.api";
import type { HermesModel } from "../types/hermes.types";

export function useHermesModels() {
  const query = useQuery({
    queryKey: ["hermes", "models"],
    queryFn: () => hermesApi.getModels(),
    staleTime: 60_000,
    retry: 1,
  });

  const models: HermesModel[] = query.data ?? [];
  const unhealthyModels: HermesModel[] = models.filter((m) => m.health !== "healthy");

  return { models, unhealthyModels, query };
}
