import type {
  GatewayHealthDetailedDto,
  GatewayHealthDto,
  GatewayModelsResponseDto,
} from "../types/gateway.types";

async function fetchHermesBff<T>(path: string): Promise<T> {
  const res = await fetch(`/api/hermes${path}`, {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: `Request failed: ${path}` }));
    throw new Error(error?.message ?? `Request failed: ${path}`);
  }

  return res.json() as Promise<T>;
}

export function getGatewayHealth(): Promise<GatewayHealthDto> {
  return fetchHermesBff<GatewayHealthDto>("/health");
}

export function getGatewayHealthDetailed(): Promise<GatewayHealthDetailedDto> {
  return fetchHermesBff<GatewayHealthDetailedDto>("/health-detailed");
}

export function getGatewayModels(): Promise<GatewayModelsResponseDto> {
  return fetchHermesBff<GatewayModelsResponseDto>("/models");
}

