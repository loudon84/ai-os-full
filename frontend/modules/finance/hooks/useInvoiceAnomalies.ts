"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as financeApi from "../services/finance.api";
import type {
  AnomalyType,
  AnomalyItem,
  AnomalyDetail,
  RuleStatus,
  AnomalyStatus,
} from "../types/finance.types";

export function useInvoiceAnomalies() {
  const queryClient = useQueryClient();
  const [activeType, setActiveType] = useState<AnomalyType | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Anomaly list
  const listQuery = useQuery<{
    data: AnomalyItem[];
    total: number;
    ruleStatus: RuleStatus;
  }>({
    queryKey: ["finance", "anomalies", "list", activeType],
    queryFn: () =>
      financeApi.getInvoiceAnomalies({
        type: activeType === "all" ? undefined : activeType,
      }),
  });

  // Anomaly detail
  const detailQuery = useQuery<AnomalyDetail>({
    queryKey: ["finance", "anomalies", "detail", selectedId],
    queryFn: () => financeApi.getAnomalyDetail(selectedId!),
    enabled: selectedId !== null,
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "confirmed" | "ignored" | "escalated";
    }) => financeApi.updateAnomalyStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["finance", "anomalies"],
      });
    },
  });

  const onStatusUpdate = useCallback(
    (id: string, status: string) => {
      statusMutation.mutate({
        id,
        status: status as "confirmed" | "ignored" | "escalated",
      });
    },
    [statusMutation]
  );

  const onViewDetail = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  return {
    activeType,
    setActiveType,
    listQuery,
    detailQuery,
    selectedId,
    setSelectedId,
    statusMutation,
    onStatusUpdate,
    onViewDetail,
  };
}
