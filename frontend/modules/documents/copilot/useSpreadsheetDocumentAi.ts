"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import type { MutableRefObject } from "react";
import { useCallback, useMemo, useState } from "react";

import type { SpreadsheetEngineInstance } from "../adapters/SpreadsheetEngineAdapter";
import { validateSpreadsheetPatch } from "../adapters/univer/SpreadsheetPatchValidator";
import { documentAiApi, resolveDocumentAiStreamUrl } from "../services/documentAi.api";
import type { ApplySpreadsheetPatchResult, SpreadsheetPatch } from "../types/documentAiSpreadsheet.types";
import type {
  CreateDocumentAiInteractionResponse,
  PatchValidateResponse,
  SheetRangeContext,
} from "../types/documentAi.types";

export type StagedSpreadsheetPatch = {
  patch: SpreadsheetPatch;
  facadeValidation: PatchValidateResponse;
};

export type UseSpreadsheetDocumentAiArgs = {
  documentId: string;
  versionId: string;
  workbookId?: string;
  sessionId: string;
  selectionContext: SheetRangeContext | null;
  engineRef: MutableRefObject<SpreadsheetEngineInstance | null>;
  actorUserId?: string;
  actor?: Record<string, unknown>;
  org_scope?: Record<string, unknown>;
  /** 用户批准后本地 apply 成功时回调，供下一笔保存写入版本追溯字段 */
  onApprovedPatchApply?: (p: { interactionId: string; patchId: string }) => void;
  /** 新分析任务开始时回调（清空上一笔待保存的 AI 追溯） */
  onAiSessionReset?: () => void;
};

export function useSpreadsheetDocumentAi(args: UseSpreadsheetDocumentAiArgs) {
  const actorUserId = args.actorUserId ?? "anonymous";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInteraction, setLastInteraction] = useState<CreateDocumentAiInteractionResponse | null>(null);
  const [lastStreamAbs, setLastStreamAbs] = useState<string | null>(null);
  const [stagedPatch, setStagedPatch] = useState<StagedSpreadsheetPatch | null>(null);

  const readableValue = useMemo(
    () => ({
      documentId: args.documentId,
      versionId: args.versionId,
      selection: args.selectionContext,
      stagedPatchId: stagedPatch?.patch.patchId ?? null,
    }),
    [args.documentId, args.versionId, args.selectionContext, stagedPatch?.patch.patchId]
  );

  useCopilotReadable(
    {
      description: "Datasheet AI context: document id, snapshot version id, selection, optional staged patch id.",
      value: readableValue,
    },
    [readableValue]
  );

  const resolveContext = useCallback((): SheetRangeContext | null => {
    return args.selectionContext ?? args.engineRef.current?.collectSheetRangeContext() ?? null;
  }, [args.engineRef, args.selectionContext]);

  const loadProposedPatch = useCallback(
    async (patchId: string, interactionId: string, opts?: { skipBusy?: boolean }) => {
      const manageBusy = opts?.skipBusy !== true;
      if (manageBusy) setBusy(true);
      setError(null);
      try {
        const wire = await documentAiApi.getPatch(patchId);
        const parsed = wire.patch_json as unknown;
        const local = validateSpreadsheetPatch(parsed);
        if (!local.ok) {
          setError(local.errors.join(","));
          setStagedPatch(null);
          return undefined;
        }
        const v = await documentAiApi.validatePatch({
          interaction_id: interactionId,
          patch: local.patch,
        });
        setStagedPatch({ patch: local.patch, facadeValidation: v });
        return v;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setStagedPatch(null);
        return undefined;
      } finally {
        if (manageBusy) setBusy(false);
      }
    },
    []
  );

  const submitAnalyze = useCallback(
    async (prompt: string) => {
      setError(null);
      setStagedPatch(null);
      args.onAiSessionReset?.();
      const ctx = resolveContext();
      if (!ctx) {
        setError("no_selection_context");
        return undefined;
      }
      const workbookId = ctx.workbookId ?? args.workbookId;
      if (!workbookId) {
        setError("missing_workbook_id");
        return undefined;
      }

      setBusy(true);
      try {
        const body = {
          document_id: args.documentId,
          workbook_id: workbookId,
          version_id: args.versionId,
          session_id: args.sessionId,
          mode: "analyze_selection",
          prompt,
          sheet_context: ctx,
          actor: args.actor,
          org_scope: args.org_scope,
        };
        const res = await documentAiApi.createInteraction(body);
        setLastInteraction(res);
        setLastStreamAbs(resolveDocumentAiStreamUrl(res.stream_url));

        const pid = res.proposed_patch_id ?? null;
        const iid = res.interaction_id;
        if (pid && iid && typeof pid === "string") {
          await loadProposedPatch(pid, iid, { skipBusy: true });
        }

        return res;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [
      args.actor,
      args.documentId,
      args.org_scope,
      args.sessionId,
      args.versionId,
      args.workbookId,
      args.onAiSessionReset,
      loadProposedPatch,
      resolveContext,
    ]
  );

  const validatePatchJson = useCallback(
    async (patchJson: string, opts?: { stage?: boolean }) => {
      setError(null);
      let parsed: unknown;
      try {
        parsed = JSON.parse(patchJson) as unknown;
      } catch {
        setError("invalid_patch_json");
        return undefined;
      }
      const local = validateSpreadsheetPatch(parsed);
      if (!local.ok) {
        setError(local.errors.join(","));
        return undefined;
      }
      if (!lastInteraction?.interaction_id) {
        setError("missing_interaction");
        return undefined;
      }
      setBusy(true);
      try {
        const v = await documentAiApi.validatePatch({
          interaction_id: lastInteraction.interaction_id,
          patch: local.patch,
        });
        if (opts?.stage && v.valid) {
          setStagedPatch({ patch: local.patch, facadeValidation: v });
        }
        return v;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [lastInteraction?.interaction_id]
  );

  const approveStagedPatch = useCallback(async (): Promise<ApplySpreadsheetPatchResult | false> => {
    setError(null);
    if (!stagedPatch) {
      setError("no_staged_patch");
      return false;
    }
    const engine = args.engineRef.current;
    if (!engine) {
      setError("engine_missing");
      return false;
    }
    setBusy(true);
    try {
      const applied = engine.applySpreadsheetPatch(stagedPatch.patch);
      if (!applied.ok) {
        setError(applied.error);
        return applied;
      }
      try {
        await documentAiApi.submitPatchDecision(stagedPatch.patch.patchId, {
          decision: "approved",
          actor_user_id: actorUserId,
          client_applied: true,
          applied_at_client_version: args.versionId,
          result: {
            affectedCells: applied.affectedCells,
            new_selection_hash: resolveContext()?.selectionHash,
          },
        });
      } catch {
        /* local apply succeeded */
      }
      const interactionId = lastInteraction?.interaction_id ?? stagedPatch.patch.interactionId;
      args.onApprovedPatchApply?.({ interactionId, patchId: stagedPatch.patch.patchId });
      setStagedPatch(null);
      return applied;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return false;
    } finally {
      setBusy(false);
    }
  }, [
    actorUserId,
    args.engineRef,
    args.onApprovedPatchApply,
    args.versionId,
    lastInteraction?.interaction_id,
    resolveContext,
    stagedPatch,
  ]);

  const rejectStagedPatch = useCallback(async () => {
    setError(null);
    if (!stagedPatch) {
      setError("no_staged_patch");
      return false;
    }
    setBusy(true);
    try {
      await documentAiApi.submitPatchDecision(stagedPatch.patch.patchId, {
        decision: "rejected",
        actor_user_id: actorUserId,
        client_applied: false,
        applied_at_client_version: args.versionId,
        result: { reason: "user_rejected_preview" },
      });
      setStagedPatch(null);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return false;
    } finally {
      setBusy(false);
    }
  }, [actorUserId, args.versionId, stagedPatch]);

  const applyPatchJson = useCallback(
    async (patchJson: string): Promise<ApplySpreadsheetPatchResult | undefined> => {
      setError(null);
      let parsed: unknown;
      try {
        parsed = JSON.parse(patchJson) as unknown;
      } catch {
        setError("invalid_patch_json");
        return undefined;
      }
      const local = validateSpreadsheetPatch(parsed);
      if (!local.ok) {
        setError(local.errors.join(","));
        return undefined;
      }
      const engine = args.engineRef.current;
      if (!engine) {
        setError("engine_missing");
        return undefined;
      }
      const applied = engine.applySpreadsheetPatch(local.patch);
      if (!applied.ok) {
        setError(applied.error);
        return applied;
      }
      try {
        await documentAiApi.submitPatchDecision(local.patch.patchId, {
          decision: "approved",
          actor_user_id: actorUserId,
          client_applied: true,
          applied_at_client_version: args.versionId,
          result: { affectedCells: applied.affectedCells },
        });
      } catch {
        /* best-effort */
      }
      const interactionId = lastInteraction?.interaction_id ?? local.patch.interactionId;
      args.onApprovedPatchApply?.({ interactionId, patchId: local.patch.patchId });
      return applied;
    },
    [actorUserId, args.engineRef, args.onApprovedPatchApply, args.versionId, lastInteraction?.interaction_id]
  );

  useCopilotAction({
    name: "analyzeSelection",
    description: "Create a datasheet AI interaction using the active selection (Facade REST `/document-ai/interactions`).",
    parameters: [
      {
        name: "prompt",
        type: "string",
        description: "Instructions for analyzing the spreadsheet selection.",
        required: true,
      },
    ],
    handler: async ({ prompt }: { prompt: string }) => {
      const res = await submitAnalyze(prompt);
      if (!res) return "analyzeSelection_failed";
      const stream = resolveDocumentAiStreamUrl(res.stream_url);
      return `Submitted interaction ${res.interaction_id}. Stream: ${stream}`;
    },
  });

  useCopilotAction({
    name: "validateDatasheetPatch",
    description:
      "POST a datasheet patch JSON ({ patchId, op, range... }) against Facade `/document-ai/patches/validate` after an interaction exists.",
    parameters: [
      {
        name: "patchJson",
        type: "string",
        description: "JSON object for SpreadsheetPatch (MVP ops).",
        required: true,
      },
    ],
    handler: async ({ patchJson }: { patchJson: string }) => {
      const res = await validatePatchJson(patchJson);
      if (!res) return "validateDatasheetPatch_failed";
      return `valid=${String(res.valid)} risk=${res.risk_level} cells=${String(res.affected_cells)}`;
    },
  });

  useCopilotAction({
    name: "applyDatasheetPatch",
    description:
      "Validate and apply a JSON SpreadsheetPatch to the local Univer engine, then log an approved decision against Facade.",
    parameters: [
      {
        name: "patchJson",
        type: "string",
        description: "JSON object for SpreadsheetPatch (after user reviewed preview — MVP dev hook).",
        required: true,
      },
    ],
    handler: async ({ patchJson }: { patchJson: string }) => {
      const res = await applyPatchJson(patchJson);
      if (!res) return "applyDatasheetPatch_failed";
      if (!res.ok) return `failed:${res.error}`;
      return `applied cells=${String(res.affectedCells)}`;
    },
  });

  return {
    sessionId: args.sessionId,
    busy,
    error,
    lastInteraction,
    lastStreamAbs,
    stagedPatch,
    resolveContext,
    submitAnalyze,
    validatePatchJson,
    approveStagedPatch,
    rejectStagedPatch,
    loadProposedPatch,
    applyPatchJson,
    clearError: () => setError(null),
    clearStaged: () => setStagedPatch(null),
  };
}
