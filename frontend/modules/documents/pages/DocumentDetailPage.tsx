"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import type { SheetRangeContext } from "../types/documentAi.types";
import type { SnapshotSaveRequest } from "../types/document.types";
import type { AiSaveLineage } from "../lib/snapshotSaveRequest";
import { withAiSaveLineage } from "../lib/snapshotSaveRequest";
import { DocumentAIPanel } from "../components/DocumentAIPanel";
import { SpreadsheetAIPanel } from "../components/SpreadsheetAIPanel";
import { readWorkbookIdFromSnapshot } from "../adapters/univer/WorkbookSnapshotAdapter";
import { BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DocumentModuleShell } from "../components/layout/DocumentModuleShell";
import { UniverSheetEditor } from "../components/UniverSheetEditor";
import type { SpreadsheetEngineInstance } from "../adapters/SpreadsheetEngineAdapter";
import { DocumentApiError, documentApi } from "../services/document.api";
import { useDocumentDetail } from "../hooks/useDocumentDetail";
import { useDocumentSnapshot } from "../hooks/useDocumentSnapshot";

export type { AiSaveLineage } from "../lib/snapshotSaveRequest";

export default function DocumentDetailPage(props: { documentId: string; variant?: "detail" | "workbook" }) {
  const params = useParams<{ lang?: string }>();
  const lang = typeof params?.lang === "string" ? params.lang : "";
  const docHref = (documentId: string) => (lang ? `/${lang}/documents/${documentId}` : `/documents/${documentId}`);
  const workbookHref = (documentId: string) =>
    lang ? `/${lang}/documents/${documentId}/workbook` : `/documents/${documentId}/workbook`;

  const variant = props.variant ?? "detail";
  const detailQuery = useDocumentDetail(props.documentId);
  const snapshotQuery = useDocumentSnapshot(props.documentId);
  const engineRef = useRef<SpreadsheetEngineInstance | null>(null);
  const [selectionCtx, setSelectionCtx] = useState<SheetRangeContext | null>(null);
  const sessionId = useMemo(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `sess_${Date.now()}`;
  }, []);
  const workbookIdGuess = useMemo(
    () => readWorkbookIdFromSnapshot(snapshotQuery.data?.snapshot as Record<string, unknown> | undefined),
    [snapshotQuery.data]
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<{ currentVersionNo: number; baseVersionNo: number } | null>(null);
  const [aiSaveLineage, setAiSaveLineage] = useState<AiSaveLineage | null>(null);
  const canSave = useMemo(() => {
    const role = detailQuery.data?.current_user_permission;
    return dirty && role !== "view" && !saving;
  }, [dirty, detailQuery.data?.current_user_permission, saving]);

  if (detailQuery.isLoading || snapshotQuery.isLoading) {
    return (
      <DocumentModuleShell title="加载中..." breadcrumb={<BreadcrumbItem>文档</BreadcrumbItem>}>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </DocumentModuleShell>
    );
  }

  if (detailQuery.isError || snapshotQuery.isError || !detailQuery.data) {
    return (
      <DocumentModuleShell title="文档" breadcrumb={<BreadcrumbItem>错误</BreadcrumbItem>}>
        <div className="space-y-2">
          <div className="text-sm text-destructive">文档加载失败</div>
          <Button variant="outline" size="sm" onClick={() => { detailQuery.refetch(); snapshotQuery.refetch(); }}>
            重试
          </Button>
        </div>
      </DocumentModuleShell>
    );
  }

  const doc = detailQuery.data;

  return (
    <DocumentModuleShell
      title={variant === "workbook" ? `${doc.title} · AI 工作台` : doc.title}
      breadcrumb={
        variant === "workbook" ? (
          <>
            <BreadcrumbItem href={docHref(doc.id)}>{doc.title}</BreadcrumbItem>
            <BreadcrumbItem>AI 工作台</BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>{doc.title}</BreadcrumbItem>
        )
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>
            版本 v{doc.current_version_no}
            {dirty ? " · 未保存" : ""}
            {aiSaveLineage?.created_from === "ai_patch_apply" ? " · 含未保存的 AI 变更追溯" : ""}
          </span>
          {variant === "detail" ? (
            <Link className="text-primary hover:underline" href={workbookHref(doc.id)}>
              打开 AI 工作台
            </Link>
          ) : (
            <Link className="text-primary hover:underline" href={docHref(doc.id)}>
              标准编辑
            </Link>
          )}
        </div>
        <Button
          size="sm"
          disabled={!canSave}
          onClick={async () => {
            const snapshot = engineRef.current?.getSnapshot();
            if (!snapshot) return;
            setSaving(true);
            setConflict(null);
            try {
              const payload: SnapshotSaveRequest = withAiSaveLineage(
                {
                  base_version_no: doc.current_version_no,
                  save_mode: "manual",
                  engine_version: "0.x",
                  schema_version: 1,
                  snapshot,
                },
                aiSaveLineage
              );
              await documentApi.saveSnapshot(doc.id, payload);
              setAiSaveLineage(null);
              setDirty(false);
              await detailQuery.refetch();
              await snapshotQuery.refetch();
            } catch (e) {
              if (e instanceof DocumentApiError && e.status === 409) {
                const detail: any = e.detail;
                setConflict({
                  currentVersionNo: Number(detail?.current_version_no ?? doc.current_version_no),
                  baseVersionNo: Number(detail?.base_version_no ?? doc.current_version_no),
                });
                return;
              }
              throw e;
            } finally {
              setSaving(false);
            }
          }}
        >
          保存
        </Button>
      </div>

      {conflict && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <div className="font-medium text-destructive">版本冲突</div>
          <div className="mt-1 text-muted-foreground">
            当前版本已变更（当前 v{conflict.currentVersionNo}，你基于 v{conflict.baseVersionNo} 保存）。请刷新文档后重试。
          </div>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setConflict(null);
                setDirty(false);
                await detailQuery.refetch();
                await snapshotQuery.refetch();
              }}
            >
              刷新文档
            </Button>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-220px)] gap-3">
        <div className="min-w-0 flex-1">
          <UniverSheetEditor
            readonly={doc.current_user_permission === "view"}
            initialSnapshot={snapshotQuery.data?.snapshot as Record<string, unknown> | undefined}
            onReady={(inst) => {
              engineRef.current = inst;
            }}
            onDirtyChange={(next) => setDirty(next)}
            onSelectionContextChange={setSelectionCtx}
          />
        </div>
        <div className="hidden min-h-0 w-[320px] shrink-0 flex-col lg:flex xl:w-[340px]">
          {doc.document_type === "spreadsheet" ? (
            <Tabs defaultValue="hermes-ai" className="flex min-h-0 flex-1 flex-col gap-2">
              <TabsList className="grid h-9 w-full shrink-0 grid-cols-2">
                <TabsTrigger value="hermes-ai" className="text-xs">
                  AI 助手
                </TabsTrigger>
                <TabsTrigger value="datasheet-ai" className="text-xs">
                  数据操作
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="hermes-ai"
                forceMount
                className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
              >
                <DocumentAIPanel
                  className="min-h-0 flex-1"
                  document={doc}
                  snapshot={snapshotQuery.data?.snapshot as Record<string, unknown> | undefined}
                  onApplyResult={(md) => {
                    void navigator.clipboard.writeText(md);
                    toast.success("已复制到剪贴板");
                  }}
                />
              </TabsContent>
              <TabsContent
                value="datasheet-ai"
                forceMount
                className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto data-[state=inactive]:hidden"
              >
                <SpreadsheetAIPanel
                  documentId={doc.id}
                  versionId={String(doc.current_version_no)}
                  workbookId={workbookIdGuess}
                  sessionId={sessionId}
                  engineRef={engineRef}
                  selectionContext={selectionCtx}
                  onAiSessionReset={() => setAiSaveLineage(null)}
                  onApprovedPatchApply={({ interactionId, patchId }) =>
                    setAiSaveLineage({
                      created_from: "ai_patch_apply",
                      related_interaction_id: interactionId,
                      related_patch_id: patchId,
                    })
                  }
                />
              </TabsContent>
            </Tabs>
          ) : (
            <DocumentAIPanel
              className="min-h-0 flex-1"
              document={doc}
              snapshot={snapshotQuery.data?.snapshot as Record<string, unknown> | undefined}
              onApplyResult={(md) => {
                void navigator.clipboard.writeText(md);
                toast.success("已复制到剪贴板");
              }}
            />
          )}
        </div>
      </div>
    </DocumentModuleShell>
  );
}

