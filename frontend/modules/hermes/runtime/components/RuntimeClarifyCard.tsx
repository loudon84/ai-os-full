"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRuntimeApprovalStore } from "../stores/runtime-approval-store";
import { useRuntimeClarifyActions } from "../hooks/use-runtime-clarify";

export function RuntimeClarifyCard() {
  const clarify = useRuntimeApprovalStore((s) => s.clarify);
  const sessionId = useRuntimeApprovalStore((s) => s.clarifySessionId);
  const { respond } = useRuntimeClarifyActions();
  const [value, setValue] = useState("");

  const question = clarify?.question ?? clarify?.description ?? "";
  const choices = useMemo(() => {
    const c1 = Array.isArray(clarify?.choices_offered) ? clarify?.choices_offered : [];
    const c2 = Array.isArray(clarify?.choices) ? clarify?.choices : [];
    return (c1?.length ? c1 : c2) ?? [];
  }, [clarify]);

  if (!clarify || !sessionId) return null;

  return (
    <Card className="border-primary/30 p-3">
      <div className="text-sm font-medium">需要澄清</div>
      <div className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">{question}</div>

      {choices.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {choices.map((c) => (
            <Button key={c} variant="secondary" onClick={() => respond(sessionId, c)}>
              {c}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="输入你的回答…"
        />
        <Button
          onClick={() => {
            const v = value.trim();
            if (!v) return;
            respond(sessionId, v);
            setValue("");
          }}
        >
          发送
        </Button>
      </div>
    </Card>
  );
}

