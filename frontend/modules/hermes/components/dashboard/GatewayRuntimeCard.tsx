"use client";

import { useGatewayHealthDetailed } from "../../hooks/use-gateway-health-detailed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatNumber(value: unknown) {
  if (typeof value === "number") return String(value);
  return "-";
}

export function GatewayRuntimeCard() {
  const query = useGatewayHealthDetailed();
  const data = query.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Runtime Status</CardTitle>
        <div className="text-xs text-muted-foreground">
          来自 Hermes Gateway `/health/detailed`
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading ? (
          <div className="text-sm text-muted-foreground">加载中...</div>
        ) : query.isError ? (
          <div className="text-sm text-red-600">{String(query.error)}</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Active Sessions</div>
              <div className="mt-1 text-lg font-semibold">
                {formatNumber(data?.active_sessions)}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Running Agents</div>
              <div className="mt-1 text-lg font-semibold">
                {formatNumber(data?.running_agents)}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">CPU %</div>
              <div className="mt-2">
                <Badge variant="secondary">
                  {formatNumber(data?.resource_usage?.cpu_percent)}
                </Badge>
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Memory</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {formatNumber(data?.resource_usage?.memory_mb)} MB
                </Badge>
                <Badge variant="secondary">
                  {formatNumber(data?.resource_usage?.memory_percent)} %
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

