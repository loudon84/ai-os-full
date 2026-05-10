"use client";

import { useGatewayHealth } from "../../hooks/use-gateway-health";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function GatewayHealthCard() {
  const query = useGatewayHealth();
  const queryClient = useQueryClient();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">Gateway Health</CardTitle>
          <div className="text-xs text-muted-foreground">
            来自 Hermes Gateway `/health`
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => {
            void queryClient.invalidateQueries({
              queryKey: ["hermes-gateway"],
            });
          }}
        >
          <RefreshCw className="mr-1 h-4 w-4" />
          刷新
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading ? (
          <div className="text-sm text-muted-foreground">检查中...</div>
        ) : query.isError ? (
          <div className="space-y-2">
            <div className="text-sm text-red-600">
              无法连接 Hermes Gateway：{String(query.error)}
            </div>
            <Badge variant="destructive">unreachable</Badge>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant={query.data?.status === "ok" ? "secondary" : "outline"}>
              {query.data?.status ?? "unknown"}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

