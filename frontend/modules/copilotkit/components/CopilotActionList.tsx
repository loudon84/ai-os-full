"use client";

import type { CopilotActionDefinition } from "@/modules/copilotkit/lib/copilot-types";
import { Button } from "@/components/ui/button";

type CopilotActionListProps = {
  actions?: CopilotActionDefinition[];
  onInvoke?: (actionId: string) => void;
};

export function CopilotActionList({
  actions = [],
  onInvoke,
}: CopilotActionListProps) {
  if (actions.length === 0) return null;

  return (
    <div className="border-t p-4">
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        当前页面可用动作
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            color="secondary"
            size="sm"
            onClick={() => onInvoke?.(action.id)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
