"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import * as financeApi from "../services/finance.api";
import type {
  ReportItem,
  ReportDetail,
  EditorMode,
} from "../types/finance.types";

export function useReportCenter() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>("readonly");

  // Report list
  const listQuery = useQuery<{ data: ReportItem[]; total: number }>({
    queryKey: ["finance", "reports", "list"],
    queryFn: () => financeApi.getReports(),
  });

  // Report detail
  const detailQuery = useQuery<ReportDetail>({
    queryKey: ["finance", "reports", "detail", selectedId],
    queryFn: () => financeApi.getReportDetail(selectedId!),
    enabled: selectedId !== null,
  });

  const onSelectReport = useCallback((id: string) => {
    setSelectedId(id);
    setEditorMode("readonly");
  }, []);

  const onBackToList = useCallback(() => {
    setSelectedId(null);
    setEditorMode("readonly");
  }, []);

  return {
    selectedId,
    onSelectReport,
    onBackToList,
    listQuery,
    detailQuery,
    editorMode,
    setEditorMode,
  };
}
