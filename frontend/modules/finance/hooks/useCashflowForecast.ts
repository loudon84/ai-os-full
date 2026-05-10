"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as financeApi from "../services/finance.api";
import type {
  ForecastPeriod,
  ForecastScenario,
  CashflowForecastData,
} from "../types/finance.types";

export function useCashflowForecast() {
  const [period, setPeriod] = useState<ForecastPeriod>(30);
  const [scenario, setScenario] = useState<ForecastScenario>("baseline");

  const forecastQuery = useQuery<CashflowForecastData>({
    queryKey: ["finance", "cashflow", "forecast", period, scenario],
    queryFn: () => financeApi.getCashflowForecast({ period, scenario }),
  });

  return {
    period,
    setPeriod,
    scenario,
    setScenario,
    forecastQuery,
  };
}
