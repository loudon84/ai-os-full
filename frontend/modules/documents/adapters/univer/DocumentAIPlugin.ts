/**
 * Phase 2: datasheet AI orchestration touches Univer exclusively through {@link ./UniverSpreadsheetAdapter}.
 * This module holds extension points shared with React/Copilot hooks (no `@univerjs/*` imports).
 */

import type { ApplySpreadsheetPatchResult, SheetRangeContext, SpreadsheetPatch } from "../../types/documentAiSpreadsheet.types";

export type DocumentAiEngineCapability = {
  collectSheetRangeContext: () => SheetRangeContext | null;
  applySpreadsheetPatch: (patch: SpreadsheetPatch) => ApplySpreadsheetPatchResult;
};
