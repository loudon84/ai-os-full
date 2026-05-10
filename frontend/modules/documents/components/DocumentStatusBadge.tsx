"use client";

import { Badge } from "@/components/ui/badge";

import type { DocumentStatus } from "../types/document.types";

const map: Record<DocumentStatus, { label: string; variant?: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "草稿", variant: "secondary" },
  active: { label: "活跃", variant: "default" },
  archived: { label: "已归档", variant: "outline" },
  deleted: { label: "已删除", variant: "destructive" },
};

export function DocumentStatusBadge(props: { status: DocumentStatus }) {
  const meta = map[props.status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

