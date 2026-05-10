import { describe, expect, it } from "vitest";

import { validateSpreadsheetPatch } from "../adapters/univer/SpreadsheetPatchValidator";

describe("validateSpreadsheetPatch", () => {
  const basePatch = () => ({
    patchId: "p1",
    interactionId: "i1",
    workbookId: "wb1",
    worksheetId: "sh1",
    reason: "test",
    riskLevel: "low" as const,
    range: {
      startRow: 0,
      startColumn: 0,
      rowCount: 2,
      columnCount: 2,
    },
  });

  it("accepts set_cell_values with aligned grid", () => {
    const res = validateSpreadsheetPatch({
      ...basePatch(),
      op: "set_cell_values",
      values: [
        [1, "a"],
        [true, null],
      ],
    });
    expect(res.ok).toBe(true);
  });

  it("rejects row count mismatches", () => {
    const res = validateSpreadsheetPatch({
      ...basePatch(),
      op: "set_cell_values",
      values: [[1, 2]],
    });
    expect(res.ok).toBe(false);
  });

  it("rejects insert_rows op until backend supports", () => {
    const res = validateSpreadsheetPatch({
      patchId: "p1",
      interactionId: "i1",
      workbookId: "wb1",
      reason: "r",
      riskLevel: "low",
      op: "insert_rows",
      worksheetId: "sh1",
    });
    expect(res.ok).toBe(false);
  });

  it("flags affected cells exceeding MVP caps", () => {
    const res = validateSpreadsheetPatch({
      ...basePatch(),
      op: "set_cell_values",
      range: { startRow: 0, startColumn: 0, rowCount: 1000, columnCount: 1000 },
      values: Array.from({ length: 1000 }, () => Array.from({ length: 1000 }, (_, i) => i)),
    });
    expect(res.ok).toBe(false);
  });
});
