import { beforeEach, describe, expect, it, vi } from "vitest";

import { applyValidatedSpreadsheetPatch } from "../adapters/univer/SpreadsheetPatchApplier";
import type { SpreadsheetPatch } from "../types/documentAiSpreadsheet.types";

describe("applyValidatedSpreadsheetPatch", () => {
  function makePatch(overrides: Partial<SpreadsheetPatch> & Pick<SpreadsheetPatch, "op">): SpreadsheetPatch {
    return {
      patchId: "p1",
      interactionId: "i1",
      workbookId: "wb1",
      worksheetId: "sh1",
      reason: "unit",
      riskLevel: "low",
      range: { startRow: 0, startColumn: 0, rowCount: 1, columnCount: 1 },
      ...overrides,
    } as SpreadsheetPatch;
  }

  let setValuesCalls: unknown[] = [];
  let setFormulasCalls: unknown[] = [];

  let worksheet: {
    getRange: ReturnType<typeof vi.fn>;
  };

  const ctxBase = () => ({
    activeWorkbookId: "wb1",
    getWorksheetById: (_id: string) => worksheet,
    getActiveWorksheet: () => worksheet,
    onMutated: vi.fn(),
  });

  beforeEach(() => {
    setValuesCalls = [];
    setFormulasCalls = [];
    worksheet = {
      getRange: vi.fn(() => ({
        setValues(vals: unknown) {
          setValuesCalls.push(vals);
        },
        setFormulas(vals: unknown) {
          setFormulasCalls.push(vals);
        },
      })),
    };
  });

  it("applies workbook id guard", () => {
    const res = applyValidatedSpreadsheetPatch(makePatch({ op: "set_cell_values", values: [["x"]] }), {
      activeWorkbookId: "wrong",
      getWorksheetById: () => worksheet as never,
      getActiveWorksheet: () => worksheet as never,
    });
    expect(res.ok).toBe(false);
  });

  it("writes values on success", () => {
    const res = applyValidatedSpreadsheetPatch(
      makePatch({
        op: "set_cell_values",
        values: [["x"]],
      }),
      ctxBase()
    );
    expect(res.ok).toBe(true);
    expect(setValuesCalls).toHaveLength(1);
  });

  it("writes formulas on success", () => {
    const res = applyValidatedSpreadsheetPatch(
      makePatch({
        op: "set_cell_formulas",
        formulas: [["=1+1"]],
      }),
      ctxBase()
    );
    expect(res.ok).toBe(true);
    expect(setFormulasCalls).toHaveLength(1);
  });
});
