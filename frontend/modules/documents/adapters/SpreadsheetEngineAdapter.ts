import type { SnapshotEnvelope } from "../types/document.types";
import type {
  ApplySpreadsheetPatchResult,
  SheetRangeContext,
  SpreadsheetPatch,
} from "../types/documentAiSpreadsheet.types";

export interface SpreadsheetEngineMountOptions {
  container: HTMLElement;
  readonly?: boolean;
  initialSnapshot?: SnapshotEnvelope["snapshot"];
  onDirtyChange?: (dirty: boolean) => void;
  /** Optional: receives truncated {@link SheetRangeContext} aligned with MVP limits. */
  onSelectionContextChange?: (ctx: SheetRangeContext | null) => void;
}

export interface SpreadsheetEngineInstance {
  getSnapshot(): SnapshotEnvelope["snapshot"];
  setReadonly(readonly: boolean): void;
  /** Current selection summarized for Facade payloads; returns null without a usable range. */
  collectSheetRangeContext(): SheetRangeContext | null;
  /** Apply MVP patch subset after local validation ({@link SpreadsheetPatch}). */
  applySpreadsheetPatch(patch: SpreadsheetPatch): ApplySpreadsheetPatchResult;
  dispose(): void;
}

export interface SpreadsheetEngineAdapter {
  engine: "univer";
  mount(options: SpreadsheetEngineMountOptions): SpreadsheetEngineInstance;
}

