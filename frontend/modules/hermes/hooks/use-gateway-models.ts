"use client";

import { useQuery } from "@tanstack/react-query";
import { getGatewayModels } from "../services/hermes-gateway.api";

export function useGatewayModels() {
  return useQuery({
    queryKey: ["hermes-gateway", "models"],
    queryFn: () => getGatewayModels(),
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}

