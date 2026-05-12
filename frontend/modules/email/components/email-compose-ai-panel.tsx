"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { EmailAiResultCard } from "./email-ai-result-card";
import type { EmailAgentResultPayload } from "../hooks/use-email-agent-actions";

export function EmailComposeAIPanel(props: {
  runPolishCompose: (instruction: string) => Promise<string>;
  runTranslatePlainText: (lang: string) => Promise<string>;
  /** 将 AI 输出追加到编辑器（Markdown 转简单段落由父组件处理） */
  onAppendToEditor: (text: string) => void;
  result: EmailAgentResultPayload | null;
  onClearResult: () => void;
}) {
  const { runPolishCompose, runTranslatePlainText, onAppendToEditor, result, onClearResult } = props;
  const [instruction, setInstruction] = useState("更正式、更简洁");
  const [lang, setLang] = useState("English");
  const [busy, setBusy] = useState<string | null>(null);

  const wrap = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="flex h-full min-h-0 w-full max-w-[360px] flex-col border-default-200">
      <CardHeader className="border-b py-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wand2 className="h-4 w-4 text-primary" />
          撰写 AI
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <div className="space-y-1">
          <Label className="text-xs">润色 / 改写要求</Label>
          <Input
            className="text-xs"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="例如：语气更友好、缩短一半"
          />
        </div>
        <Button
          type="button"
          size="sm"
          disabled={busy !== null}
          onClick={() => wrap("polish", () => runPolishCompose(instruction.trim() || "润色全文"))}
        >
          {busy === "polish" ? "处理中…" : "应用到润色"}
        </Button>

        <div className="space-y-1">
          <Label className="text-xs">翻译正文为</Label>
          <div className="flex gap-2">
            <Input
              className="text-xs"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              placeholder="English"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => wrap("tr", () => runTranslatePlainText(lang.trim() || "English"))}
            >
              {busy === "tr" ? "…" : "翻译"}
            </Button>
          </div>
        </div>

        {result && (
          <EmailAiResultCard
            title={result.title}
            markdown={result.markdown}
            onApplyToEditor={onAppendToEditor}
            onClose={onClearResult}
          />
        )}
      </CardContent>
    </Card>
  );
}
