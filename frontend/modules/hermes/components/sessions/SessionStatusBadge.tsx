"use client";

import { Badge } from "@/components/ui/badge";
import type { SessionStatus } from "../../types/hermes.types";

type SessionStatusBadgeProps = {
  status: SessionStatus;
};

const config: Record<SessionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  idle: { label: "Idle", variant: "secondary" },
  running: { label: "Running", variant: "default" },
  error: { label: "Error", variant: "destructive" },
  done: { label: "Done", variant: "outline" },
};

export function SessionStatusBadge({ status }: SessionStatusBadgeProps) {
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
