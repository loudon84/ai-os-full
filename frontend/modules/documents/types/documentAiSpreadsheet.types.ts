/**
 * MVP types aligned with docs/prd/document/agent_spec.md §6–7.
 * Frontend patch support matches Facade MVP (set_cell_values / set_cell_formulas only).
 */

export type SpreadsheetRiskLevel = "low" | "medium" | "high";

export type SpreadsheetPatchBase = {
  patchId: string;
  interactionId: string;
  workbookId: string;
  worksheetId?: string;
  op:
    | "set_cell_values"
    | "set_cell_formulas"
    | "insert_rows"
    | "insert_columns"
    | "delete_rows"
    | "create_sheet"
    | "rename_sheet";
  reason: string;
  riskLevel: SpreadsheetRiskLevel;
  beforeSelectionHash?: string;
};

export type PatchRangeRect = {
  startRow: number;
  startColumn: number;
  rowCount: number;
  columnCount: number;
};

export type SetCellValuesPatch = SpreadsheetPatchBase & {
  op: "set_cell_values";
  range: PatchRangeRect;
  values: Array<Array<string | number | boolean | null>>;
};

export type SetCellFormulasPatch = SpreadsheetPatchBase & {
  op: "set_cell_formulas";
  range: PatchRangeRect;
  formulas: Array<Array<string>>;
};

/** Full union per spec; engine + Facade MVP only applies the two set_* ops above. */
export type SpreadsheetPatch = SetCellValuesPatch | SetCellFormulasPatch;

export type SheetRangeRect = {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
  a1Notation?: string;
};

export type SheetSampleLimit = {
  maxRows: number;
  maxColumns: number;
  truncated: boolean;
};

export type SheetRangeContext = {
  workbookId: string;
  worksheetId: string;
  worksheetName: string;
  range: SheetRangeRect;
  headers?: string[];
  values: Array<Array<string | number | boolean | null>>;
  formulas?: Array<Array<string | null>>;
  numberFormats?: Array<Array<string | null>>;
  sampleLimit: SheetSampleLimit;
  selectionHash: string;
};

export type ApplySpreadsheetPatchOk = { ok: true; affectedCells: number };
export type ApplySpreadsheetPatchErr = { ok: false; error: string };

export type ApplySpreadsheetPatchResult = ApplySpreadsheetPatchOk | ApplySpreadsheetPatchErr;
