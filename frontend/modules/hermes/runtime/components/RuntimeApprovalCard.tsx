"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRuntimeApprovalStore } from "../stores/runtime-approval-store";
import { useRuntimeApprovalActions } from "../hooks/use-runtime-approval";

export function RuntimeApprovalCard() {
  const approval = useRuntimeApprovalStore((s) => s.approval);
  const sessionId = useRuntimeApprovalStore((s) => s.approvalSessionId);
  const { respond } = useRuntimeApprovalActions();

  if (!approval || !sessionId) return null;

  const keys = approval.pattern_keys ?? (approval.pattern_key ? [approval.pattern_key] : []);

  return (
    <Card className="border-destructive/40 p-3">
      <div className="text-sm font-medium">需要审批</div>
      <div className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
        {approval.description ?? ""}
        {keys.length ? ` [${keys.join(", ")}]` : ""}
      </div>
      <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-muted p-2 text-xs">
        {approval.command}
      </pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => respond(sessionId, "once", approval.approval_id)}
        >
          仅本次
        </Button>
        <Button
          variant="secondary"
          onClick={() => respond(sessionId, "session", approval.approval_id)}
        >
          本会话
        </Button>
        <Button
          variant="secondary"
          onClick={() => respond(sessionId, "always", approval.approval_id)}
        >
          始终允许
        </Button>
        <Button
          variant="destructive"
          onClick={() => respond(sessionId, "deny", approval.approval_id)}
        >
          拒绝
        </Button>
      </div>
    </Card>
  );
}

