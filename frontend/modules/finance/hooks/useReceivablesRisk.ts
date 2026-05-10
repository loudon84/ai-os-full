"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import * as financeApi from "../services/finance.api";
import type {
  RiskLevel,
  CurrencyCode,
  ReceivableRiskItem,
  ReceivableKpi,
  ReceivableDetail,
} from "../types/finance.types";

type ReceivableFilters = {
  client: string;
  region: string;
  owner: string;
  riskLevel: RiskLevel | "";
  aging: string;
  currency: CurrencyCode | "";
};

const defaultFilters: ReceivableFilters = {
  client: "",
  region: "",
  owner: "",
  riskLevel: "",
  aging: "",
  currency: "",
};

export function useReceivablesRisk() {
  const [filters, setFilters] = useState<ReceivableFilters>(defaultFilters);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Risk list
  const listQuery = useQuery<{
    data: ReceivableRiskItem[];
    total: number;
    kpi: ReceivableKpi;
  }>({
    queryKey: ["finance", "receivables", "risk", filters],
    queryFn: () =>
      financeApi.getReceivablesRisk({
        client: filters.client || undefined,
        region: filters.region || undefined,
        owner: filters.owner || undefined,
        riskLevel: (filters.riskLevel as RiskLevel) || undefined,
        aging: filters.aging || undefined,
        currency: (filters.currency as CurrencyCode) || undefined,
      }),
  });

  // Client detail
  const detailQuery = useQuery<ReceivableDetail>({
    queryKey: ["finance", "receivables", "detail", selectedClient],
    queryFn: () => financeApi.getReceivableDetail(selectedClient!),
    enabled: selectedClient !== null,
  });

  const onFiltersChange = useCallback(
    (patch: Partial<ReceivableFilters>) => {
      setFilters((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  return {
    filters,
    onFiltersChange,
    listQuery,
    detailQuery,
    selectedClient,
    setSelectedClient,
  };
}
