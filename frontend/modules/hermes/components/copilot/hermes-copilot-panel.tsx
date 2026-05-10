/**
 * HermesCopilotPanel - Main Copilot panel for Hermes Dashboard
 * Phase 4: Agent switcher, toolset badges, interrupt banner/form, stream status.
 */
"use client";

import { useState } from "react";
import { useHermesCopilot } from "../../hooks/use-hermes-copilot";
import { HermesAgentSwitcher } from "./hermes-agent-switcher";
import { HermesToolsetBadges } from "./hermes-toolset-badges";
import { InterruptBanner } from "./interrupt-banner";
import { InterruptFormCard } from "./interrupt-form-card";
import { HermesMessageRenderer } from "./hermes-message-renderer";
import { StreamStatusBar } from "./stream-status-bar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bot, Send, Loader2 } from "lucide-react";

export function HermesCopilotPanel() {
  const { messages, append, isLoading, activeAgent, activeSessionId, resumeWithPayload } =
    useHermesCopilot();
  const [input, setInput] = useState("");

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    append({ role: "user", content: trimmed });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full min-h-[560px] flex-col rounded-xl border">
      {/* Header: Agent Switcher + Toolset Badges + Status + Interrupt Banner */}
      <div className="border-b p-3 space-y-3">
        <HermesAgentSwitcher />
        <HermesToolsetBadges />
        <StreamStatusBar
          activeAgent={activeAgent}
          sessionId={activeSessionId}
          isLoading={isLoading}
        />
        <InterruptBanner />
      </div>

      {/* Message list */}
      <ScrollArea className="flex-1 p-4">
        {/* Interrupt form for missing fields */}
        <InterruptFormCard onResume={resumeWithPayload} />

        {!messages || messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Bot className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Ask the {activeAgent} agent about your workspace.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m: Record<string, unknown>, idx: number) => (
              <HermesMessageRenderer
                key={(m.id as string) ?? idx}
                message={{
                  id: m.id as string,
                  role: m.role as string,
                  content: m.content as string,
                  toolName: m.toolName as string | undefined,
                  data: m.data,
                }}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Chat input */}
      <div className="border-t p-3 flex gap-2">
        <input
          className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask ${activeAgent} agent...`}
          disabled={isLoading}
        />
        <Button
          size="icon"
          disabled={isLoading || !input.trim()}
          onClick={handleSend}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
