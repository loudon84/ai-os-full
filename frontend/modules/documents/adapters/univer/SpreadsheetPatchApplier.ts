import type { ApplySpreadsheetPatchResult, SpreadsheetPatch } from "../../types/documentAiSpreadsheet.types";
import { validateSpreadsheetPatch } from "./SpreadsheetPatchValidator";

/**
 * Applies a spreadsheet patch via Univer façade callbacks (no `@univerjs/*` imports here).
 */
export function applyValidatedSpreadsheetPatch(
  patch: SpreadsheetPatch,
  ctx: {
    activeWorkbookId: string | null | undefined;
    getWorksheetById: (id: string) => WorksheetApplyPort | null;
    getActiveWorksheet: () => WorksheetApplyPort | null;
    onMutated?: () => void;
  }
): ApplySpreadsheetPatchResult {
  const checked = validateSpreadsheetPatch(patch);
  if (!checked.ok) return { ok: false, error: checked.errors.join(",") };

  const p = checked.patch;

  if (typeof ctx.activeWorkbookId !== "string" || !ctx.activeWorkbookId || ctx.activeWorkbookId !== p.workbookId) {
    return { ok: false, error: "workbook_mismatch" };
  }

  let ws = p.worksheetId ? ctx.getWorksheetById(p.worksheetId) : ctx.getActiveWorksheet();
  if (p.worksheetId && !ws) return { ok: false, error: "worksheet_not_found" };

  if (!ws) ws = ctx.getActiveWorksheet();
  if (!ws) return { ok: false, error: "active_worksheet_missing" };

  const { startRow, startColumn, rowCount, columnCount } = p.range;
  const rng = ws.getRange(startRow, startColumn, rowCount, columnCount);

  try {
    if (p.op === "set_cell_values") rng.setValues(p.values as never);
    else if (p.op === "set_cell_formulas") rng.setFormulas(p.formulas);
    else return { ok: false, error: `unsupported_op:${String((p as SpreadsheetPatch).op)}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `apply_failed:${msg}` };
  }

  ctx.onMutated?.();
  const affectedCells = Math.max(0, rowCount) * Math.max(0, columnCount);
  return { ok: true, affectedCells };
}

/** Minimal façade surface wired from `UniverSpreadsheetAdapter.ts`. */
export type WorksheetApplyPort = {
  getRange(row: number, column: number, numRows?: number, numCols?: number): RangeApplyPort;
};

export type RangeApplyPort = {
  setValues(values: unknown): unknown;
  setFormulas(formulas: string[][]): unknown;
};
