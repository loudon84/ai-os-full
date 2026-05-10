import { describe, expect, it } from "vitest";

import {
  buildSheetRangeContext,
  computeTruncationWindow,
  MVP_CONTEXT_MAX_CELLS,
  MVP_CONTEXT_MAX_CHARS,
  MVP_CONTEXT_MAX_COLUMNS,
  MVP_CONTEXT_MAX_ROWS,
} from "../adapters/univer/SelectionContextCollector";

describe("computeTruncationWindow", () => {
  it("clamps oversized rectangles to MVP row/column caps", () => {
    const r = computeTruncationWindow({
      startRow: 0,
      endRow: 500,
      startColumn: 0,
      endColumn: 100,
    });
    expect(r.rowSpan).toBeLessThanOrEqual(MVP_CONTEXT_MAX_ROWS);
    expect(r.colSpan).toBeLessThanOrEqual(MVP_CONTEXT_MAX_COLUMNS);
    expect(r.rowSpan * r.colSpan).toBeLessThanOrEqual(MVP_CONTEXT_MAX_CELLS);
  });
});

describe("buildSheetRangeContext", () => {
  it("returns null when ids missing", () => {
    expect(
      buildSheetRangeContext({
        workbookId: "",
        worksheetId: "s1",
        worksheetName: "Sheet1",
        range: { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
        valuesRaw: [[1]],
      })
    ).toBeNull();
  });

  it("truncates and flags sampleLimit when range is large", () => {
    const rows = 120;
    const cols = 10;
    const valuesRaw = Array.from({ length: rows }, () => Array.from({ length: cols }, (_, c) => c));
    const ctx = buildSheetRangeContext({
      workbookId: "wb1",
      worksheetId: "sh1",
      worksheetName: "Sheet1",
      range: { startRow: 0, endRow: rows - 1, startColumn: 0, endColumn: cols - 1 },
      valuesRaw,
    });
    expect(ctx).not.toBeNull();
    expect(ctx!.sampleLimit.truncated).toBe(true);
    expect(ctx!.values.length).toBeLessThanOrEqual(MVP_CONTEXT_MAX_ROWS);
    expect(ctx!.values[0]!.length).toBeLessThanOrEqual(MVP_CONTEXT_MAX_COLUMNS);
    expect(JSON.stringify(ctx).length).toBeLessThanOrEqual(MVP_CONTEXT_MAX_CHARS + 10_000);
  });
});
