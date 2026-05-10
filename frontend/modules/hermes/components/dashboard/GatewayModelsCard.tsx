"use client";

import { useGatewayModels } from "../../hooks/use-gateway-models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GatewayModelsCard() {
  const query = useGatewayModels();
  const models = query.data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Models</CardTitle>
        <div className="text-xs text-muted-foreground">
          来自 Hermes Gateway `/v1/models`（OpenAI-compatible）
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading ? (
          <div className="text-sm text-muted-foreground">加载中...</div>
        ) : query.isError ? (
          <div className="text-sm text-red-600">{String(query.error)}</div>
        ) : models.length === 0 ? (
          <div className="text-sm text-muted-foreground">暂无模型</div>
        ) : (
          <div className="space-y-2">
            {models.map((m) => (
              <div key={m.id} className="rounded-md border p-3">
                <div className="text-sm font-medium">{m.id}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {m.owned_by ?? "-"}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

