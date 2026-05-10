"use client";

import { useQuery } from "@tanstack/react-query";
import { getGatewayHealthDetailed } from "../services/hermes-gateway.api";

export function useGatewayHealthDetailed() {
  return useQuery({
    queryKey: ["hermes-gateway", "health-detailed"],
    queryFn: () => getGatewayHealthDetailed(),
    staleTime: 10_000,
    refetchInterval: 10_000,
    retry: 1,
  });
}

