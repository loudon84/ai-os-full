import type { HermesGatewayInstance } from "@portal/db";
import type { Db } from "@portal/db";

import type { AppConfig } from "../../config.js";
import { HermesGatewayClient } from "./hermes-gateway-client.js";
import { HermesRepository } from "./hermes.repository.js";

export interface GatewayRouteResult {
  gateway: HermesGatewayInstance;
  baseUrl: string;
  authToken: string | null;
}

export class HermesGatewayRouter {
  private readonly repo = new HermesRepository();

  constructor(
    private readonly config: AppConfig,
    private readonly client = new HermesGatewayClient(config),
  ) {}

  async selectGateway(
    db: Db,
    input: {
      workspaceId: string;
      runType?: string;
    },
  ): Promise<GatewayRouteResult | null> {
    const dbGateways = await this.repo.listHealthyGateways(db, input.workspaceId);
    const candidates = dbGateways.length > 0 ? dbGateways : await this.repo.listGateways(db, input.workspaceId);

    const workspaceBound = candidates.filter((g) => g.workspaceId === input.workspaceId && g.status !== "disabled");
    const healthyWorkspace = workspaceBound.filter((g) => g.status === "healthy");
    if (healthyWorkspace.length > 0) {
      return this.toRoute(healthyWorkspace[0]!);
    }

    const globalHealthy = candidates.filter((g) => !g.workspaceId && g.status === "healthy");
    if (globalHealthy.length > 0) {
      return this.toRoute(globalHealthy[0]!);
    }

    if (this.config.hermesGatewayBaseUrl) {
      return {
        gateway: {
          id: "config-default",
          workspaceId: null,
          name: "config-default",
          gatewayType: "local",
          baseUrl: this.config.hermesGatewayBaseUrl,
          authMode: this.config.hermesGatewayAuthToken ? "bearer" : "none",
          authToken: this.config.hermesGatewayAuthToken ?? null,
          status: "healthy",
          modelCapabilities: {},
          toolCapabilities: {},
          lastHealthAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        baseUrl: this.config.hermesGatewayBaseUrl,
        authToken: this.config.hermesGatewayAuthToken ?? null,
      };
    }

    const standby = candidates.find((g) => g.status !== "disabled" && g.status !== "unhealthy");
    return standby ? this.toRoute(standby) : null;
  }

  async probeAndUpdateGateway(db: Db, gatewayId: string): Promise<HermesGatewayInstance | null> {
    const gateway = await this.repo.getGateway(db, gatewayId);
    if (!gateway) return null;

    const result = await this.client.healthCheck(gateway.baseUrl, gateway.authToken);
    return this.repo.updateGateway(db, gatewayId, {
      status: result.healthy ? "healthy" : "unhealthy",
      lastHealthAt: new Date(),
    });
  }

  private toRoute(gateway: HermesGatewayInstance): GatewayRouteResult {
    return {
      gateway,
      baseUrl: gateway.baseUrl,
      authToken: gateway.authToken,
    };
  }
}
