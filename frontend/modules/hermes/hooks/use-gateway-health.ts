"use client";

import { useQuery } from "@tanstack/react-query";
import { getGatewayHealth } from "../services/hermes-gateway.api";

export function useGatewayHealth() {
  return useQuery({
    queryKey: ["hermes-gateway", "health"],
    queryFn: () => getGatewayHealth(),
    staleTime: 15_000,
    refetchInterval: 15_000,
    retry: 1,
  });
}

