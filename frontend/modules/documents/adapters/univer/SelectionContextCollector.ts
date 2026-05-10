import type { SheetRangeContext, SheetRangeRect, SheetSampleLimit } from "../../types/documentAiSpreadsheet.types";

/** agent_spec §6.2 MVP */
export const MVP_CONTEXT_MAX_ROWS = 100;
export const MVP_CONTEXT_MAX_COLUMNS = 30;
export const MVP_CONTEXT_MAX_CELLS = 3000;
export const MVP_CONTEXT_MAX_CHARS = 60_000;

export type CollectorPrimitiveCell = string | number | boolean | null;
export type CollectorPrimitiveFormula = string | null | undefined;

export type BuildSheetRangeContextInput = {
  workbookId: string;
  worksheetId: string;
  worksheetName: string;
  /** Full-sheet selection rect in zero-based indices from the engine selection. */
  range: Omit<SheetRangeRect, "a1Notation"> & { a1Notation?: string };
  valuesRaw: CollectorPrimitiveCell[][];
  formulasRaw?: CollectorPrimitiveFormula[][] | null;
};

function djb2ish(parts: readonly string[]): string {
  let h = 5381 >>> 0;
  const s = parts.join("\u001f");
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(33, h) ^ s.charCodeAt(i)) >>> 0;
  }
  return `s${h.toString(16).padStart(8, "0")}`;
}

function gridCharLength(values: CollectorPrimitiveCell[][], formulas?: Array<Array<string | null>>): number {
  const valPart = JSON.stringify(values);
  const fPart = formulas ? JSON.stringify(formulas) : "";
  return valPart.length + fPart.length;
}

/**
 * Clamp row/column count to MVP limits without changing anchor (start indices).
 */
export function computeTruncationWindow(rect: Omit<SheetRangeRect, "a1Notation">): SheetSampleLimit & { rowSpan: number; colSpan: number } {
  const fullRows = Math.max(0, rect.endRow - rect.startRow + 1);
  const fullCols = Math.max(0, rect.endColumn - rect.startColumn + 1);
  let rowSpan = Math.min(fullRows, MVP_CONTEXT_MAX_ROWS);
  let colSpan = Math.min(fullCols, MVP_CONTEXT_MAX_COLUMNS);
  while (rowSpan * colSpan > MVP_CONTEXT_MAX_CELLS && (rowSpan > 1 || colSpan > 1)) {
    if (rowSpan >= colSpan && rowSpan > 1) {
      rowSpan -= 1;
    } else if (colSpan > 1) {
      colSpan -= 1;
    } else {
      break;
    }
  }

  rowSpan = Math.max(1, rowSpan);
  colSpan = Math.max(1, colSpan);

  while (rowSpan * colSpan > MVP_CONTEXT_MAX_CELLS && rowSpan > 1) {
    rowSpan -= 1;
  }
  while (rowSpan * colSpan > MVP_CONTEXT_MAX_CELLS && colSpan > 1) {
    colSpan -= 1;
  }

  const truncated = rowSpan !== fullRows || colSpan !== fullCols;
  return {
    rowSpan,
    colSpan,
    truncated,
    maxRows: MVP_CONTEXT_MAX_ROWS,
    maxColumns: MVP_CONTEXT_MAX_COLUMNS,
  };
}

function sliceGrid<T>(
  grid: readonly (readonly T[])[] | undefined | null,
  rowSpan: number,
  colSpan: number,
  empty: T
): Array<Array<T>> {
  const out: Array<Array<T>> = [];
  if (!grid) return out;

  const copyRow = Math.min(rowSpan, grid.length);
  for (let r = 0; r < copyRow; r++) {
    const row = grid[r]!;
    const copyCol = Math.min(colSpan, row.length);
    const next: T[] = [];
    for (let c = 0; c < copyCol; c++) {
      next[c] = (row[c] ?? empty) as T;
    }
    for (let c = copyCol; c < colSpan; c++) next[c] = empty;
    out.push(next);
  }
  // pad short rows vertically
  for (let r = copyRow; r < rowSpan; r++) {
    out.push(Array.from({ length: colSpan }, () => empty));
  }
  return out;
}

function coerceCell(val: CollectorPrimitiveFormula): string | number | boolean | null {
  if (val === undefined || val === null) return null;
  if (typeof val === "number" || typeof val === "boolean") return val;
  return String(val);
}

function coerceFormulaCell(val: CollectorPrimitiveFormula): string | null {
  if (val === undefined || val === null || val === "") return null;
  return String(val);
}

/**
 * Shrink truncated sample further so JSON payload stays under MVP char ceiling.
 */
function enforceCharBudget(
  values: Array<Array<string | number | boolean | null>>,
  formulas: Array<Array<string | null>> | undefined,
  rowSpan: number,
  colSpan: number
): {
  rowSpanOut: number;
  colSpanOut: number;
  valuesOut: Array<Array<string | number | boolean | null>>;
  formulasOut: Array<Array<string | null>> | undefined;
  charTruncated: boolean;
} {
  let rr = Math.max(1, rowSpan);
  let cc = Math.max(1, colSpan);
  let charTruncated = false;

  while (gridCharLength(values, formulas) > MVP_CONTEXT_MAX_CHARS && rr > 1) {
    rr -= 1;
    values = sliceGrid(values, rr, cc, null);
    formulas = formulas ? sliceGrid(formulas, rr, cc, null) : formulas;
    charTruncated = true;
  }
  while (gridCharLength(values, formulas) > MVP_CONTEXT_MAX_CHARS && cc > 1) {
    cc -= 1;
    values = sliceGrid(values, rr, cc, null);
    formulas = formulas ? sliceGrid(formulas, rr, cc, null) : formulas;
    charTruncated = true;
  }

  const sampleLimitOverlap = rr < rowSpan || cc < colSpan;
  return {
    rowSpanOut: rr,
    colSpanOut: cc,
    valuesOut: values,
    formulasOut: formulas,
    charTruncated: charTruncated || sampleLimitOverlap,
  };
}

/**
 * Produce the payload sent toward Facade/agent from primitive matrices (no Univer imports).
 */
export function buildSheetRangeContext(input: BuildSheetRangeContextInput): SheetRangeContext | null {
  const { workbookId, worksheetId, worksheetName } = input;
  if (!workbookId || !worksheetId) return null;

  const rangeBase = {
    startRow: input.range.startRow,
    endRow: input.range.endRow,
    startColumn: input.range.startColumn,
    endColumn: input.range.endColumn,
    a1Notation: input.range.a1Notation,
  };

  let { rowSpan, colSpan, truncated, maxRows, maxColumns } = computeTruncationWindow(rangeBase);

  let valuesRaw = sliceGrid(input.valuesRaw, rowSpan, colSpan, null as CollectorPrimitiveCell).map((row) => row.map((c) => coerceCell(c)));

  let formulasRaw = input.formulasRaw?.length
    ? sliceGrid(
        input.formulasRaw.map((row) => row ?? []),
        rowSpan,
        colSpan,
        null as CollectorPrimitiveFormula
      ).map((row) => row.map((c) => coerceFormulaCell(c)))
    : undefined;

  const clipped = enforceCharBudget(valuesRaw, formulasRaw, rowSpan, colSpan);

  rowSpan = clipped.rowSpanOut;
  colSpan = clipped.colSpanOut;

  truncated = truncated || clipped.charTruncated;

  const sampledRange: SheetRangeRect = {
    ...rangeBase,
    endRow: rangeBase.startRow + rowSpan - 1,
    endColumn: rangeBase.startColumn + colSpan - 1,
  };

  const selectionHash = djb2ish([
    workbookId,
    worksheetId,
    String(sampledRange.startRow),
    String(sampledRange.endRow),
    String(sampledRange.startColumn),
    String(sampledRange.endColumn),
    JSON.stringify(clipped.valuesOut),
    JSON.stringify(clipped.formulasOut ?? []),
  ]);

  const sampleLimit: SheetSampleLimit = {
    maxRows,
    maxColumns,
    truncated,
  };

  return {
    workbookId,
    worksheetId,
    worksheetName,
    range: sampledRange,
    values: clipped.valuesOut,
    formulas: clipped.formulasOut,
    sampleLimit,
    selectionHash,
  };
}
