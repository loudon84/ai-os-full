import {
  MVP_CONTEXT_MAX_CELLS,
  MVP_CONTEXT_MAX_ROWS,
  MVP_CONTEXT_MAX_COLUMNS,
} from "./SelectionContextCollector";
import type {
  SpreadsheetPatch,
  SetCellValuesPatch,
  SetCellFormulasPatch,
} from "../../types/documentAiSpreadsheet.types";

export type PatchValidationClientResult =
  | { ok: true; patch: SpreadsheetPatch }
  | { ok: false; errors: string[] };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function expectsOp<T extends SpreadsheetPatch["op"]>(
  patch: SpreadsheetPatch,
  op: T
): patch is Extract<SpreadsheetPatch, { op: T }> {
  return patch.op === op;
}

function validateBase(patch: unknown, errors: string[]): patch is SpreadsheetPatch {
  if (!isRecord(patch)) {
    errors.push("patch_not_object");
    return false;
  }
  for (const k of ["patchId", "interactionId", "workbookId", "reason", "riskLevel"]) {
    const v = patch[k];
    if (typeof v !== "string" || !v.trim()) errors.push(`invalid_${k}`);
  }
  const op = patch.op;
  const allowedOps = ["set_cell_values", "set_cell_formulas"];
  if (typeof op !== "string" || !allowedOps.includes(op)) errors.push(`unsupported_or_invalid_op:${String(op)}`);
  const rng = patch.range;
  if (!isRecord(rng)) errors.push("invalid_range");
  else {
    const { startRow, startColumn, rowCount, columnCount } = rng;
    const nums = { startRow, startColumn, rowCount, columnCount };
    for (const [key, val] of Object.entries(nums)) {
      if (typeof val !== "number" || !Number.isFinite(val) || val < 0 || Math.floor(val) !== val)
        errors.push(`invalid_range_${key}`);
    }
  }
  if (patch.worksheetId !== undefined && typeof patch.worksheetId !== "string") errors.push("invalid_worksheet_id");
  if (patch.beforeSelectionHash !== undefined && typeof patch.beforeSelectionHash !== "string") {
    errors.push("invalid_before_selection_hash");
  }

  const risk = patch.riskLevel;
  if (risk !== "low" && risk !== "medium" && risk !== "high") errors.push("invalid_risk_level");

  return errors.length === 0;
}

function validateValuesPayload(patch: SetCellValuesPatch, errors: string[]) {
  const { rowCount, columnCount } = patch.range;
  const expected = rowCount * columnCount;
  if (expected <= 0) {
    errors.push("invalid_range_area");
    return;
  }
  if (expected > MVP_CONTEXT_MAX_CELLS) errors.push("affected_cells_exceeds_mvp_limit");

  if (!Array.isArray(patch.values)) {
    errors.push("values_not_array");
    return;
  }
  if (patch.values.length !== rowCount) errors.push("values_row_count_mismatch");
  for (let r = 0; r < patch.values.length; r++) {
    const row = patch.values[r];
    if (!Array.isArray(row)) {
      errors.push(`values_row_${r}_not_array`);
      continue;
    }
    if (row.length !== columnCount) errors.push(`values_col_count_mismatch_row_${r}`);
    for (const cell of row) {
      const t = typeof cell;
      if (cell !== null && t !== "string" && t !== "number" && t !== "boolean") {
        errors.push(`invalid_cell_type_row_${r}`);
        break;
      }
    }
  }
}

function validateFormulasPayload(patch: SetCellFormulasPatch, errors: string[]) {
  const { rowCount, columnCount } = patch.range;
  const expected = rowCount * columnCount;
  if (expected <= 0) {
    errors.push("invalid_range_area");
    return;
  }
  if (expected > MVP_CONTEXT_MAX_CELLS) errors.push("affected_cells_exceeds_mvp_limit");
  if (rowCount > MVP_CONTEXT_MAX_ROWS || columnCount > MVP_CONTEXT_MAX_COLUMNS) {
    errors.push("patch_range_exceeds_mvp_rectangle");
  }
  if (!Array.isArray(patch.formulas)) {
    errors.push("formulas_not_array");
    return;
  }
  if (patch.formulas.length !== rowCount) errors.push("formulas_row_count_mismatch");
  for (let r = 0; r < patch.formulas.length; r++) {
    const row = patch.formulas[r];
    if (!Array.isArray(row)) {
      errors.push(`formulas_row_${r}_not_array`);
      continue;
    }
    if (row.length !== columnCount) errors.push(`formulas_col_count_mismatch_row_${r}`);
    for (const cell of row) {
      if (typeof cell !== "string") {
        errors.push(`invalid_formula_cell_row_${r}`);
        break;
      }
    }
  }
}

/** Client-side guard before applying or POSTing `/document-ai/patches/validate`. */
export function validateSpreadsheetPatch(patch: unknown): PatchValidationClientResult {
  const errors: string[] = [];
  if (!validateBase(patch as SpreadsheetPatch, errors)) return { ok: false, errors };
  const p = patch as SpreadsheetPatch;

  if (expectsOp(p, "set_cell_values")) validateValuesPayload(p, errors);
  else if (expectsOp(p, "set_cell_formulas")) validateFormulasPayload(p, errors);
  else errors.push(`unsupported_op:${String((p as SpreadsheetPatch).op)}`);

  if (errors.length) return { ok: false, errors };
  return { ok: true, patch: p };
}
