import type { PatchValidateResponse } from "../types/documentAi.types";
import type { SheetRangeContext, SpreadsheetPatch } from "../types/documentAiSpreadsheet.types";

export type PatchPreviewDiffRow = {
  cell: string;
  before: string;
  after: string;
};

export type SpreadsheetPatchPreviewModel = {
  op: SpreadsheetPatch["op"];
  rangeA1: string;
  affectedCells: number;
  riskLevel: PatchValidateResponse["risk_level"] | SpreadsheetPatch["riskLevel"];
  warnings: string[];
  rows: PatchPreviewDiffRow[];
};

/** 0-based column index → Excel letters (A, B, …, Z, AA, …). */
export function columnIndexToLetters(col0: number): string {
  let c = col0;
  let letters = "";
  while (c >= 0) {
    letters = String.fromCharCode((c % 26) + 65) + letters;
    c = Math.floor(c / 26) - 1;
  }
  return letters;
}

export function cellA1(row0: number, col0: number): string {
  return `${columnIndexToLetters(col0)}${row0 + 1}`;
}

/** Inclusive-corner A1 notation for anchor + size (0-based anchor). */
export function patchRangeToA1Notation(range: {
  startRow: number;
  startColumn: number;
  rowCount: number;
  columnCount: number;
}): string {
  const sr = range.startRow;
  const sc = range.startColumn;
  const er = sr + Math.max(0, range.rowCount) - 1;
  const ec = sc + Math.max(0, range.columnCount) - 1;
  if (range.rowCount <= 0 || range.columnCount <= 0) return "";
  const a = cellA1(sr, sc);
  const b = cellA1(er, ec);
  return a === b ? a : `${a}:${b}`;
}

function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  return String(val);
}

function beforeAt(
  patch: SpreadsheetPatch,
  ctx: SheetRangeContext | null,
  absoluteRow: number,
  absoluteCol: number
): string {
  if (!ctx) return "—";
  if (patch.worksheetId && ctx.worksheetId !== patch.worksheetId) return "—";
  const { startRow, endRow, startColumn, endColumn } = ctx.range;
  if (absoluteRow < startRow || absoluteRow > endRow || absoluteCol < startColumn || absoluteCol > endColumn)
    return "—";
  const r = absoluteRow - startRow;
  const c = absoluteCol - startColumn;

  if (patch.op === "set_cell_formulas") {
    const row = ctx.formulas?.[r];
    const cell = row?.[c];
    return cell !== undefined && cell !== null && cell !== "" ? String(cell) : formatCellValue(ctx.values[r]?.[c]);
  }
  return formatCellValue(ctx.values[r]?.[c]);
}

const MAX_PREVIEW_ROWS = 48;

/** Build Diff rows + merged warnings (@see docs/prd/document/agent_spec.md §10.4). */
export function buildSpreadsheetPatchPreviewModel(
  patch: SpreadsheetPatch,
  validation: PatchValidateResponse | null,
  selectionContext: SheetRangeContext | null
): SpreadsheetPatchPreviewModel {
  const { startRow, startColumn, rowCount, columnCount } = patch.range;
  const affectedCells = Math.max(0, rowCount) * Math.max(0, columnCount);
  const rangeA1 = patchRangeToA1Notation(patch.range);

  const warnings = [...(validation?.warnings ?? [])];
  const hash = patch.beforeSelectionHash;
  if (hash && selectionContext?.selectionHash && hash !== selectionContext.selectionHash) {
    warnings.push("selection_hash_mismatch:apply_only_if_you_accept_risk");
  }

  const riskLevel =
    validation?.risk_level ??
    patch.riskLevel ??
    (affectedCells <= 100 ? "low" : affectedCells <= 3000 ? "medium" : "high");

  const rows: PatchPreviewDiffRow[] = [];
  outer: for (let ri = 0; ri < rowCount; ri++) {
    for (let ci = 0; ci < columnCount; ci++) {
      if (rows.length >= MAX_PREVIEW_ROWS) {
        warnings.push(`preview_truncated_to_${MAX_PREVIEW_ROWS}_cells`);
        break outer;
      }
      const ar = startRow + ri;
      const ac = startColumn + ci;
      const cell = cellA1(ar, ac);
      let after = "";
      if (patch.op === "set_cell_values") {
        after = formatCellValue(patch.values[ri]?.[ci]);
      } else {
        after = String(patch.formulas[ri]?.[ci] ?? "");
      }
      rows.push({
        cell,
        before: beforeAt(patch, selectionContext, ar, ac),
        after,
      });
    }
  }

  return {
    op: patch.op,
    rangeA1,
    affectedCells,
    riskLevel,
    warnings,
    rows,
  };
}
