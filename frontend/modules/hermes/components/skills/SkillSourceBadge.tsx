"use client";

import { Badge } from "@/components/ui/badge";
import type { SkillSource } from "../../types/hermes.types";

type SkillSourceBadgeProps = {
  source: SkillSource;
};

const config: Record<SkillSource, { label: string; className: string }> = {
  builtin: { label: "Builtin", className: "bg-blue-500/15 text-blue-600 border-blue-500/25" },
  workspace: { label: "Workspace", className: "bg-purple-500/15 text-purple-600 border-purple-500/25" },
  user: { label: "User", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/25" },
};

export function SkillSourceBadge({ source }: SkillSourceBadgeProps) {
  const { label, className } = config[source];
  return <Badge variant="outline" className={className}>{label}</Badge>;
}
