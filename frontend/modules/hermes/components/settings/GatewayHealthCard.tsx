"use client";

import { useHermesHealth } from "../../hooks/useHermesHealth";
import { HealthStatusBadge } from "../shared/HealthStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X } from "lucide-react";

export function GatewayHealthCard() {
  const { health, query } = useHermesHealth();

  if (query.isLoading) {
    return <Skeleton className="h-[260px]" />;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Gateway Health</CardTitle>
          {health && <HealthStatusBadge status={health.status} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gateway */}
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground uppercase">Gateway</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <span className="text-muted-foreground">Reachable</span>
            <span className="col-span-2">{health?.gateway.reachable ? <Check className="inline h-4 w-4 text-emerald-500" /> : <X className="inline h-4 w-4 text-red-500" />}</span>
            <span className="text-muted-foreground">Latency</span>
            <span className="col-span-2">{health?.gateway.latencyMs ?? 0}ms</span>
            <span className="text-muted-foreground">Version</span>
            <span className="col-span-2">{health?.gateway.version ?? "unknown"}</span>
          </div>
        </div>

        {/* Model */}
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground uppercase">Model</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <span className="text-muted-foreground">Reachable</span>
            <span className="col-span-2">{health?.model.reachable ? <Check className="inline h-4 w-4 text-emerald-500" /> : <X className="inline h-4 w-4 text-red-500" />}</span>
            <span className="text-muted-foreground">Provider</span>
            <span className="col-span-2">{health?.model.provider ?? "—"}</span>
            <span className="text-muted-foreground">Model</span>
            <span className="col-span-2">{health?.model.model ?? "—"}</span>
          </div>
        </div>

        {/* Memory */}
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground uppercase">Memory</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <span className="text-muted-foreground">Enabled</span>
            <span className="col-span-2">{health?.memory.enabled ? <Check className="inline h-4 w-4 text-emerald-500" /> : <X className="inline h-4 w-4 text-red-500" />}</span>
            <span className="text-muted-foreground">Provider</span>
            <span className="col-span-2">{health?.memory.provider ?? "—"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
