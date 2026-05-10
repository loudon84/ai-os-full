"use client";

import { useHermesModels } from "../../hooks/useHermesModels";
import { useHermesMetrics } from "../../hooks/useHermesMetrics";
import { HealthStatusBadge } from "../shared/HealthStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

export function ModelPanel() {
  const { models, query: modelsQuery } = useHermesModels();
  const { metrics, query: metricsQuery } = useHermesMetrics();

  const isLoading = modelsQuery.isLoading || metricsQuery.isLoading;

  if (isLoading) {
    return <Skeleton className="h-[200px]" />;
  }

  const activeModelName = metrics?.activeModel;
  const active = activeModelName
    ? models.find((m) => m.model === activeModelName)
    : models.find((m) => m.isDefault) ?? models[0];

  if (!active) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Active Model</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No model information available</p>
        </CardContent>
      </Card>
    );
  }

  const isUnhealthy = active.health !== "healthy";

  return (
    <Card className={isUnhealthy ? "border-red-500/50" : undefined}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Active Model</CardTitle>
          <HealthStatusBadge status={active.health} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="font-medium">{active.model}</div>
        <div className="text-sm text-muted-foreground">{active.provider}</div>
        {active.endpoint && (
          <div className="truncate text-xs text-muted-foreground">{active.endpoint}</div>
        )}
        <div className="flex flex-wrap gap-1 pt-1">
          {active.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
          <Badge variant="outline" className="text-xs">
            Tools {active.supportsTools ? <Check className="ml-0.5 inline h-3 w-3" /> : <X className="ml-0.5 inline h-3 w-3" />}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Vision {active.supportsVision ? <Check className="ml-0.5 inline h-3 w-3" /> : <X className="ml-0.5 inline h-3 w-3" />}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
