"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import * as financeApi from "../services/finance.api";
import type {
  FinancePageState,
  WorkbenchKpi,
  AnalysisTask,
} from "../types/finance.types";

type WorkbenchTab = "overview" | "detail" | "risk" | "ai-explain" | "report";

export function useFinanceWorkbench() {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>("overview");
  const [task, setTask] = useState<AnalysisTask | null>(null);
  const [pageState, setPageState] = useState<FinancePageState>("loading");

  // KPI data
  const kpiQuery = useQuery({
    queryKey: ["finance", "workbench", "kpi"],
    queryFn: () => financeApi.getWorkbenchKpi(),
  });

  // Update page state based on query result
  useEffect(() => {
    if (kpiQuery.isSuccess) {
      setPageState("success");
    } else if (kpiQuery.isError) {
      setPageState("no-data");
    }
  }, [kpiQuery.isSuccess, kpiQuery.isError]);

  const kpi = kpiQuery.data ?? null;

  // Start analysis
  const startAnalysis = useCallback(async (query: string) => {
    setPageState("running");
    try {
      const result = await financeApi.startAnalysis({ query });
      const taskData = await financeApi.getTask(result.taskId);
      setTask(taskData);
      setPageState("success");
    } catch {
      setPageState("error");
    }
  }, []);

  // Stop task
  const stopTask = useCallback(async () => {
    if (!task) return;
    try {
      await financeApi.stopTask(task.taskId);
      setTask((prev) =>
        prev ? { ...prev, status: "stopped" } : null
      );
      setPageState("success");
    } catch {
      setPageState("error");
    }
  }, [task]);

  return {
    kpi,
    kpiQuery,
    task,
    startAnalysis,
    stopTask,
    activeTab,
    setActiveTab,
    pageState,
  };
}
