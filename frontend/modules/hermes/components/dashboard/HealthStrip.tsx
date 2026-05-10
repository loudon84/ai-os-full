"use client";

import { useHermesHealth } from "../../hooks/useHermesHealth";
import { HealthStatusBadge } from "../shared/HealthStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function HealthStrip() {
  const { health, isUnreachable, query } = useHermesHealth();

  if (query.isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2">
        <span className="text-sm text-muted-foreground">Checking gateway...</span>
      </div>
    );
  }

  if (isUnreachable) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2">
        <div className="flex items-center gap-2">
          <HealthStatusBadge status="offline" />
          <span className="text-sm text-red-600">Gateway Unreachable</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => query.refetch()}
          className="h-7 text-xs"
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-4 py-2">
      <HealthStatusBadge status={health?.status ?? "offline"} />
      <Badge variant="secondary" className="text-xs">
        v{health?.gateway.version ?? "unknown"}
      </Badge>
      <Badge variant="secondary" className="text-xs">
        {health?.gateway.latencyMs ?? 0}ms
      </Badge>
      {health?.model && (
        <Badge variant="secondary" className="text-xs">
          {health.model.provider}/{health.model.model}
        </Badge>
      )}
    </div>
  );
}
