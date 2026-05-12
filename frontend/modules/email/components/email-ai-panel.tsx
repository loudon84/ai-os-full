"use client";

import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { EmailMessageResponse } from "@portal/shared";

import { EmailAiActionButton } from "./email-ai-action-button";
import { EmailAiResultCard } from "./email-ai-result-card";
import type { EmailAgentResultPayload } from "../hooks/use-email-agent-actions";

const PRESET_AGENTS = [
  { id: "finance", label: "财务 Agent" },
  { id: "risk", label: "风险 Agent" },
  { id: "forecast", label: "预测 Agent" },
  { id: "default", label: "通用 Agent" },
] as const;

export function EmailAIPanel(props: {
  selectedMail: EmailMessageResponse | null;
  accountEmail: string | null;
  result: EmailAgentResultPayload | null;
  onClearResult: () => void;
  onApplyToCompose?: (markdown: string) => void;
  runSummarizeEmail: () => Promise<string>;
  runDraftReply: () => Promise<string>;
  runTranslateEmail: (lang: string) => Promise<string>;
  runExtractTasks: () => Promise<string>;
  runExtractData: () => Promise<string>;
  runCustomAgent: (agentId: string, goal: string) => Promise<string>;
}) {
  const {
    selectedMail,
    accountEmail,
    result,
    onClearResult,
    onApplyToCompose,
    runSummarizeEmail,
    runDraftReply,
    runTranslateEmail,
    runExtractTasks,
    runExtractData,
    runCustomAgent,
  } = props;

  const [busy, setBusy] = useState<string | null>(null);
  const [translateLang, setTranslateLang] = useState("English");
  const [customGoal, setCustomGoal] = useState("请基于本邮件给出行动建议。");

  const wrap = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const ctxLine = selectedMail
    ? `${selectedMail.subject ?? "（无主题）"} · ${selectedMail.from?.address ?? ""}`
    : "未选择邮件";

  return (
    <Card className="flex h-full min-h-0 flex-col border-l border-default-200 shadow-none">
      <CardHeader className="flex-shrink-0 border-b border-default-100 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          邮件 AI
        </CardTitle>
        <p className="text-xs text-muted-foreground line-clamp-2" title={ctxLine}>
          {ctxLine}
        </p>
        {accountEmail && (
          <p className="text-[11px] text-muted-foreground">当前账号：{accountEmail}</p>
        )}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <div className="flex flex-wrap gap-1.5">
          <EmailAiActionButton
            label="摘要"
            loading={busy === "sum"}
            disabled={!selectedMail}
            onClick={() => wrap("sum", runSummarizeEmail)}
          />
          <EmailAiActionButton
            label="回复草稿"
            loading={busy === "reply"}
            disabled={!selectedMail}
            onClick={() => wrap("reply", runDraftReply)}
          />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">翻译为</Label>
            <Input
              className="h-8 w-[120px] text-xs"
              value={translateLang}
              onChange={(e) => setTranslateLang(e.target.value)}
              placeholder="English"
            />
          </div>
          <EmailAiActionButton
            label="翻译"
            loading={busy === "tr"}
            disabled={!selectedMail}
            className="mb-0.5"
            onClick={() => wrap("tr", () => runTranslateEmail(translateLang.trim() || "English"))}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <EmailAiActionButton
            label="提取待办"
            loading={busy === "task"}
            disabled={!selectedMail}
            onClick={() => wrap("task", runExtractTasks)}
          />
          <EmailAiActionButton
            label="提取数据"
            loading={busy === "data"}
            disabled={!selectedMail}
            onClick={() => wrap("data", runExtractData)}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs font-medium text-default-700">
            <Bot className="h-3.5 w-3.5" />
            更多 Agent
          </div>
          <Input
            className="text-xs"
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            placeholder="描述你想让 Agent 完成的任务…"
          />
          <div className="flex flex-wrap gap-1">
            {PRESET_AGENTS.map((a) => (
              <Button
                key={a.id}
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={!selectedMail || busy !== null}
                onClick={() => wrap(`agent-${a.id}`, () => runCustomAgent(a.id, customGoal.trim()))}
              >
                {a.label}
              </Button>
            ))}
          </div>
        </div>

        {result && (
          <EmailAiResultCard
            title={result.title}
            markdown={result.markdown}
            loading={false}
            onRetry={undefined}
            onApplyToEditor={onApplyToCompose}
            onClose={onClearResult}
            className="mt-1 flex-shrink-0"
          />
        )}
      </CardContent>
    </Card>
  );
}
