/**
 * HermesAgentSwitcher - UI for switching between
 * finance / risk / forecast agents within the Copilot panel.
 */
"use client";

import { useActiveHermesAgent } from "../../hooks/use-active-hermes-agent";
import { HERMES_AGENT_LIST } from "../../copilot/agent-router";
import { Button } from "@/components/ui/button";

export function HermesAgentSwitcher() {
  const { activeAgent, setActiveAgent } = useActiveHermesAgent();

  return (
    <div className="flex gap-1.5">
      {HERMES_AGENT_LIST.map((agent) => (
        <Button
          key={agent.id}
          variant={activeAgent === agent.id ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveAgent(agent.id)}
          className="text-xs"
        >
          {agent.label}
        </Button>
      ))}
    </div>
  );
}
