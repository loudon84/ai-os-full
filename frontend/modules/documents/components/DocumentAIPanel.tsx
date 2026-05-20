"use client";

import { useMemo } from "react";

import { HermesChatPanel, type HermesChatPresetAction } from "@/modules/hermes/components/panel/HermesChatPanel";
import type { HermesPanelChatContext } from "@/modules/hermes/hooks/use-hermes-panel-chat";
import { scopeKeyDocument } from "@/modules/hermes/stores/hermes-panel-session-binding";

import type { DocumentMeta } from "../types/document.types";
import { injectDocumentToWorkspace } from "../services/workspace-document-inject";

function presetActionsForType(documentType: DocumentMeta["document_type"]): HermesChatPresetAction[] {
  if (documentType === "spreadsheet") {
    return [
      { label: "分析数据", prompt: "请分析此表格数据的结构和关键指标" },
      { label: "公式建议", prompt: "请根据当前文档上下文建议适用的公式" },
      { label: "数据清洗", prompt: "请检查数据质量并给出清洗建议" },
    ];
  }
  return [
    { label: "摘要", prompt: "请总结这份文档的要点" },
    { label: "改写润色", prompt: "请改写润色这份文档" },
    { label: "提取要点", prompt: "请提取文档中的关键要点和待办事项" },
  ];
}

export function DocumentAIPanel(props: {
  document: DocumentMeta;
  snapshot?: Record<string, unknown> | null;
  onApplyResult?: (markdown: string) => void;
  className?: string;
}) {
  const { document: doc, snapshot, onApplyResult, className } = props;

  const context = useMemo<HermesPanelChatContext>(
    () => ({
      type: "document",
      payload: {
        id: doc.id,
        title: doc.title,
        document_type: doc.document_type,
        engine: doc.engine,
        version: doc.current_version_no,
      },
      summary: `${doc.title}（${doc.document_type}）`,
    }),
    [doc],
  );

  const presetActions = useMemo(() => presetActionsForType(doc.document_type), [doc.document_type]);

  const workspaceInjector = useMemo(
    () => (sessionId: string) =>
      injectDocumentToWorkspace({
        sessionId,
        document: doc,
        snapshot: snapshot ?? null,
      }),
    [doc, snapshot],
  );

  return (
    <HermesChatPanel
      className={className}
      sessionPersistenceKey={scopeKeyDocument(doc.id)}
      context={context}
      presetSystemPrompt="你是文档工作区助手。请用简体中文回答，可使用 Markdown。"
      presetActions={presetActions}
      workspaceInjector={workspaceInjector}
      onApplyResult={onApplyResult}
    />
  );
}
