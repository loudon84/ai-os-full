// Hermes Gateway DTOs (official, OpenAI-compatible where applicable)

export type GatewayHealthDto = {
  status: string;
};

export type GatewayHealthDetailedDto = {
  status?: string;
  active_sessions?: number;
  running_agents?: number;
  resource_usage?: {
    cpu_percent?: number;
    memory_mb?: number;
    memory_percent?: number;
  };
  [key: string]: unknown;
};

export type GatewayModelDto = {
  id: string;
  object?: string;
  owned_by?: string;
};

export type GatewayModelsResponseDto = {
  object?: string;
  data: GatewayModelDto[];
};

