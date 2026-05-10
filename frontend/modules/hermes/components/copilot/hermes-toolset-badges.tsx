/**
 * HermesToolsetBadges - Displays the active agent's toolset tags as badges.
 */
"use client";

import { useAgentToolset } from "../../hooks/use-agent-toolset";
import { Badge } from "@/components/ui/badge";

export function HermesToolsetBadges() {
  const toolsets = useAgentToolset();

  return (
    <div className="flex flex-wrap gap-1.5">
      {toolsets.map((toolset) => (
        <Badge key={toolset} variant="secondary" className="text-xs">
          {toolset}
        </Badge>
      ))}
    </div>
  );
}
