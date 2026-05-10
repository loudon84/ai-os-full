"use client";

import { GatewayHealthCard } from "../components/dashboard/GatewayHealthCard";
import { GatewayModelsCard } from "../components/dashboard/GatewayModelsCard";
import { GatewayRuntimeCard } from "../components/dashboard/GatewayRuntimeCard";
import { HermesModuleShell } from "../components/layout/HermesModuleShell";
import { HermesErrorState } from "../components/shared/HermesErrorState";
import { useGatewayHealth } from "../hooks/use-gateway-health";

export default function HermesDashboardPage() {
  const healthQuery = useGatewayHealth();

  return (
    <HermesModuleShell
      title="Hermes Dashboard"
      description="只读监控页：展示 Hermes Gateway 的健康状态与运行态信息"
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <GatewayHealthCard />
        </div>
        <div className="xl:col-span-4">
          <GatewayRuntimeCard />
        </div>
        <div className="xl:col-span-4">
          <GatewayModelsCard />
        </div>
      </div>

      {healthQuery.isError && (
        <HermesErrorState
          message="无法连接 Hermes Gateway，页面数据不可用。"
          onRetry={() => healthQuery.refetch()}
        />
      )}
    </HermesModuleShell>
  );
}
