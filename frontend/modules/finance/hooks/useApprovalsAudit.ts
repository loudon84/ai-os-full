"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as financeApi from "../services/finance.api";
import type {
  ApprovalItem,
  ApprovalDetail,
  AuditEntry,
} from "../types/finance.types";

type ApprovalTab = "pending" | "done" | "all";

export function useApprovalsAudit() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ApprovalTab>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Approval queue
  const listQuery = useQuery<{ data: ApprovalItem[]; total: number }>({
    queryKey: ["finance", "approvals", "list", activeTab],
    queryFn: () => financeApi.getApprovals({ tab: activeTab }),
  });

  // Approval detail
  const detailQuery = useQuery<ApprovalDetail>({
    queryKey: ["finance", "approvals", "detail", selectedId],
    queryFn: () => financeApi.getApprovalDetail(selectedId!),
    enabled: selectedId !== null,
  });

  // Audit trail
  const auditQuery = useQuery<{ data: AuditEntry[] }>({
    queryKey: ["finance", "approvals", "audit"],
    queryFn: () => financeApi.getAuditTrail(),
    enabled: activeTab === "all",
  });

  // Approve/Reject mutation
  const actionMutation = useMutation({
    mutationFn: ({
      id,
      action,
      comment,
    }: {
      id: string;
      action: "approve" | "reject";
      comment?: string;
    }) => financeApi.submitApproval(id, action, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["finance", "approvals"],
      });
    },
  });

  const onApprove = useCallback(
    (id: string, comment?: string) => {
      actionMutation.mutate({ id, action: "approve", comment });
      setSelectedId(null);
    },
    [actionMutation]
  );

  const onReject = useCallback(
    (id: string, comment?: string) => {
      actionMutation.mutate({ id, action: "reject", comment });
      setSelectedId(null);
    },
    [actionMutation]
  );

  const onViewDetail = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  return {
    activeTab,
    setActiveTab,
    listQuery,
    detailQuery,
    auditQuery,
    selectedId,
    setSelectedId,
    actionMutation,
    onApprove,
    onReject,
    onViewDetail,
  };
}
