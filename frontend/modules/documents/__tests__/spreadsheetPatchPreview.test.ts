import { describe, expect, it } from "vitest";

import {
  buildSpreadsheetPatchPreviewModel,
  cellA1,
  columnIndexToLetters,
  patchRangeToA1Notation,
} from "../lib/spreadsheetPatchPreview";

describe("spreadsheetPatchPreview", () => {
  it("columnIndexToLetters maps A and Z", () => {
    expect(columnIndexToLetters(0)).toBe("A");
    expect(columnIndexToLetters(25)).toBe("Z");
  });

  it("columnIndexToLetters maps AA column", () => {
    expect(columnIndexToLetters(26)).toBe("AA");
  });

  it("patchRangeToA1Notation single cell vs range", () => {
    expect(patchRangeToA1Notation({ startRow: 1, startColumn: 9, rowCount: 1, columnCount: 1 })).toBe("J2");
    expect(patchRangeToA1Notation({ startRow: 0, startColumn: 0, rowCount: 2, columnCount: 2 })).toBe("A1:B2");
  });

  it("cellA1", () => {
    expect(cellA1(9, 1)).toBe("B10");
  });

  it("buildSpreadsheetPatchPreviewModel builds rows", () => {
    const model = buildSpreadsheetPatchPreviewModel(
      {
        patchId: "p1",
        interactionId: "i1",
        workbookId: "wb",
        worksheetId: "s1",
        op: "set_cell_values",
        reason: "",
        riskLevel: "low",
        range: { startRow: 0, startColumn: 0, rowCount: 1, columnCount: 2 },
        values: [["a", null]],
      },
      { valid: true, patch_id: "p1", risk_level: "low", affected_cells: 2, warnings: [] },
      {
        workbookId: "wb",
        worksheetId: "s1",
        worksheetName: "Sheet1",
        range: { startRow: 0, endRow: 0, startColumn: 0, endColumn: 1 },
        values: [["old_a", "old_b"]],
        sampleLimit: { maxRows: 100, maxColumns: 30, truncated: false },
        selectionHash: "same",
      }
    );

    expect(model.rows).toHaveLength(2);
    expect(model.rows[0]!.cell).toBe("A1");
    expect(model.rows[0]!.before).toBe("old_a");
    expect(model.rows[0]!.after).toBe("a");
  });
});
