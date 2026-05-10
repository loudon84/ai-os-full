"use client";

import type { MutableRefObject } from "react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

import type { SpreadsheetEngineInstance } from "../adapters/SpreadsheetEngineAdapter";
import { useSpreadsheetDocumentAi } from "../copilot/useSpreadsheetDocumentAi";
import { useDocumentAiSseTimeline } from "../hooks/useDocumentAiSseTimeline";
import { buildSpreadsheetPatchPreviewModel } from "../lib/spreadsheetPatchPreview";
import type { SheetRangeContext } from "../types/documentAi.types";
import { SpreadsheetPatchPreview } from "./SpreadsheetPatchPreview";

const P_IDLE = "idle";
const P_SELECTION_READY = "selection_ready";
const P_RUNNING = "running";
const P_PATCH_PROPOSED = "patch_proposed";

function panelPhaseLabel(hasSelection: boolean, busy: boolean, staged: boolean): string {
  if (busy && !staged) return P_RUNNING;
  if (staged) return P_PATCH_PROPOSED;
  if (hasSelection) return P_SELECTION_READY;
  return P_IDLE;
}

export function SpreadsheetAIPanel(props: {
  documentId: string;
  versionId: string;
  workbookId?: string;
  sessionId: string;
  engineRef: MutableRefObject<SpreadsheetEngineInstance | null>;
  selectionContext: SheetRangeContext | null;
  actorUserId?: string;
  onApprovedPatchApply?: (p: { interactionId: string; patchId: string }) => void;
  onAiSessionReset?: () => void;
}) {
  const [prompt, setPrompt] = useState("简要分析当前选区的数据结构与异常值。");
  const [patchJson, setPatchJson] = useState("");

  const ai = useSpreadsheetDocumentAi({
    documentId: props.documentId,
    versionId: props.versionId,
    workbookId: props.workbookId,
    sessionId: props.sessionId,
    engineRef: props.engineRef,
    selectionContext: props.selectionContext,
    actorUserId: props.actorUserId,
    onApprovedPatchApply: props.onApprovedPatchApply,
    onAiSessionReset: props.onAiSessionReset,
  });

  const sse = useDocumentAiSseTimeline(ai.lastStreamAbs);

  const previewModel = useMemo(() => {
    if (!ai.stagedPatch) return null;
    return buildSpreadsheetPatchPreviewModel(
      ai.stagedPatch.patch,
      ai.stagedPatch.facadeValidation,
      props.selectionContext
    );
  }, [ai.stagedPatch, props.selectionContext]);

  const summary = useMemo(() => {
    if (!props.selectionContext) return "当前没有可用选区（请在表格中选择单元格后再试）。";
    const h = props.selectionContext.selectionHash ?? "";
    return `选区 ${props.selectionContext.range.a1Notation ?? "未命名"} · hash ${h ? `${h.slice(0, 12)}…` : "—"}`;
  }, [props.selectionContext]);

  const phase = panelPhaseLabel(Boolean(props.selectionContext), ai.busy, Boolean(ai.stagedPatch));

  return (
    <div className="flex h-full flex-col gap-3 rounded-md border bg-card p-3 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-medium text-muted-foreground">Datasheet AI</div>
          <div className="mt-1 text-xs text-muted-foreground">{summary}</div>
        </div>
        <span className="shrink-0 rounded-full border bg-muted px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
          {phase}
        </span>
      </div>

      <div className="flex flex-wrap gap-1 text-[11px]">
        <Button type="button" variant="outline" size="xs" className="h-7 px-2" disabled>
          生成公式（Stub：提示中包含「公式」）
        </Button>
        <Button type="button" variant="outline" size="xs" className="h-7 px-2" disabled>
          清洗数据
        </Button>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="sheet-ai-prompt">
          提示词
        </label>
        <Textarea
          id="sheet-ai-prompt"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="text-xs"
        />
      </div>

      <Button size="sm" disabled={ai.busy} onClick={() => void ai.submitAnalyze(prompt)}>
        提交分析任务
      </Button>

      {ai.lastInteraction && (
        <div className="rounded border bg-muted/40 p-2 text-xs leading-relaxed">
          <div className="font-medium">最近一次 interaction</div>
          <div>id · {ai.lastInteraction.interaction_id}</div>
          <div>status · {ai.lastInteraction.status}</div>
          {ai.lastInteraction.proposed_patch_id ? (
            <div className="text-muted-foreground">proposed_patch · {ai.lastInteraction.proposed_patch_id}</div>
          ) : null}
          {ai.lastStreamAbs && (
            <div className="mt-1 truncate" title={ai.lastStreamAbs}>
              stream ·{" "}
              <a href={ai.lastStreamAbs} className="text-primary underline" target="_blank" rel="noreferrer">
                SSE
              </a>
            </div>
          )}
        </div>
      )}

      {previewModel && ai.stagedPatch && (
        <div className="space-y-2 border-t pt-2">
          <div className="text-xs font-medium text-foreground">Patch 预览</div>
          <SpreadsheetPatchPreview model={previewModel} />
          <div className="flex gap-2">
            <Button
              size="sm"
              color="primary"
              disabled={ai.busy || !ai.stagedPatch.facadeValidation.valid}
              onClick={() => void ai.approveStagedPatch()}
            >
              批准写入
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={ai.busy}
              onClick={() => void ai.rejectStagedPatch()}
            >
              拒绝
            </Button>
          </div>
          {!ai.stagedPatch.facadeValidation.valid ? (
            <div className="text-[11px] text-destructive">服务端校验未通过，无法批准写入。</div>
          ) : null}
        </div>
      )}

      {ai.lastStreamAbs && (
        <div className="space-y-1 border-t pt-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>执行时间线</span>
            <span className="font-mono text-[10px] uppercase">{sse.status}</span>
          </div>
          <ScrollArea className="h-32 rounded border bg-background/60">
            <div className="space-y-1 p-2 text-[11px] leading-snug">
              {sse.events.length === 0 && sse.status === "connecting" && (
                <div className="text-muted-foreground">连接事件流…</div>
              )}
              {sse.events.length === 0 && sse.status === "error" && (
                <div className="text-destructive">无法读取 SSE（确认 Facade/CORS）</div>
              )}
              {sse.events.length === 0 && sse.status === "done" && (
                <div className="text-muted-foreground">流已结束且无事件</div>
              )}
              {sse.events.map((ev, idx) => {
                const t = typeof ev.type === "string" ? ev.type : "event";
                const title = typeof ev.title === "string" ? ev.title : "";
                const summaryField = typeof ev.summary === "string" ? ev.summary : "";
                let body = summaryField.trim() || title.trim();
                if (!body && typeof ev.taskId === "string") body = String(ev.taskId);
                if (!body && typeof ev.patchId === "string") body = `patch ${ev.patchId}`;
                const stamp = typeof ev.ts === "string" ? ev.ts : String(idx);
                return (
                  <div key={`${stamp}-${t}-${idx}`}>
                    <span className="font-mono text-[10px] text-muted-foreground">{t}</span>
                    {body ? <span className="ml-1 text-foreground">{body}</span> : null}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      <details className="border-t pt-2 text-xs">
        <summary className="cursor-pointer select-none text-muted-foreground">高级 · 粘贴 Patch JSON（Validate / Stage）</summary>
        <div className="mt-2 space-y-2">
          <Textarea
            rows={4}
            value={patchJson}
            placeholder='{"patchId":"p1","interactionId":"...","workbookId":"...","op":"set_cell_values", ...}'
            onChange={(e) => setPatchJson(e.target.value)}
            className="font-mono text-[11px] leading-snug"
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={ai.busy} type="button" onClick={() => void ai.validatePatchJson(patchJson)}>
              仅 Validate
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={ai.busy}
              type="button"
              onClick={() => void ai.validatePatchJson(patchJson, { stage: true })}
            >
              Validate + 预览
            </Button>
            <Button variant="ghost" size="sm" disabled={ai.busy} type="button" onClick={() => ai.clearStaged()}>
              清除预览
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            不推荐跳过预览直接写入；若必须调试可继续使用 Copilot Action <code className="font-mono">applyDatasheetPatch</code>
            （不经由批准按钮）。
          </p>
        </div>
      </details>

      {ai.error && (
        <div className="rounded border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
          {ai.error}
        </div>
      )}
    </div>
  );
}
