import "@formatjs/intl-segmenter/polyfill.js";

import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import UniverPresetSheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US";
import { createUniver, LocaleType, mergeLocales } from "@univerjs/presets";

import type { SpreadsheetEngineAdapter, SpreadsheetEngineInstance, SpreadsheetEngineMountOptions } from "../SpreadsheetEngineAdapter";
import type { ApplySpreadsheetPatchResult, SheetRangeContext, SpreadsheetPatch } from "../../types/documentAiSpreadsheet.types";
import { applyValidatedSpreadsheetPatch } from "./SpreadsheetPatchApplier";
import type { CollectorPrimitiveCell, CollectorPrimitiveFormula } from "./SelectionContextCollector";
import { buildSheetRangeContext } from "./SelectionContextCollector";

type UniverAPI = ReturnType<typeof createUniver>["univerAPI"];

function primitiveFromUnknownCell(cell: unknown): CollectorPrimitiveCell {
  if (cell === null || cell === undefined) return null;
  if (typeof cell === "string" || typeof cell === "number" || typeof cell === "boolean") return cell;
  if (typeof cell === "object") {
    const rich = cell as { toPlainText?: () => string };
    if (typeof rich.toPlainText === "function") return rich.toPlainText();
  }
  return String(cell);
}

function mapValuesMatrix(rows: Iterable<Iterable<unknown>> | null | undefined): CollectorPrimitiveCell[][] {
  if (!rows) return [];
  const out: CollectorPrimitiveCell[][] = [];
  for (const row of rows) {
    out.push(Array.from(row, primitiveFromUnknownCell));
  }
  return out;
}

function mapFormulasMatrix(rows: Iterable<Iterable<string>> | null | undefined): CollectorPrimitiveFormula[][] | undefined {
  if (!rows) return undefined;
  return Array.from(rows, (row) => Array.from(row, (cell) => (cell === undefined || cell === "" ? null : cell)));
}

function collectSelectionContext(api: UniverAPI): SheetRangeContext | null {
  const workbook = api.getActiveWorkbook();
  if (!workbook) return null;

  const worksheet = workbook.getActiveSheet();
  const activeRange = worksheet.getSelection()?.getActiveRange() ?? null;
  if (!activeRange) return null;

  const startRow = activeRange.getRow();
  const startColumn = activeRange.getColumn();
  const endRow = activeRange.getLastRow();
  const endColumn = activeRange.getLastColumn();

  let a1Notation: string | undefined;
  try {
    a1Notation = activeRange.getA1Notation();
  } catch {
    a1Notation = undefined;
  }

  let valuesRaw: CollectorPrimitiveCell[][];
  try {
    valuesRaw = mapValuesMatrix(activeRange.getValues() as Iterable<Iterable<unknown>>);
  } catch {
    valuesRaw = [];
  }

  let formulasRaw: CollectorPrimitiveFormula[][] | undefined;
  try {
    formulasRaw = mapFormulasMatrix(activeRange.getFormulas() as Iterable<Iterable<string>>);
  } catch {
    formulasRaw = undefined;
  }

  return buildSheetRangeContext({
    workbookId: workbook.getId(),
    worksheetId: worksheet.getSheetId(),
    worksheetName: worksheet.getSheetName(),
    range: { startRow, endRow, startColumn, endColumn, a1Notation },
    valuesRaw,
    formulasRaw,
  });
}

export class UniverSpreadsheetAdapter implements SpreadsheetEngineAdapter {
  engine = "univer" as const;

  mount(options: SpreadsheetEngineMountOptions): SpreadsheetEngineInstance {
    const { container, initialSnapshot } = options;

    const { univerAPI } = createUniver({
      locale: LocaleType.EN_US,
      locales: {
        [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
      },
      presets: [
        UniverSheetsCorePreset({
          container,
        }),
      ],
    });

    const workbookData = initialSnapshot ?? {};
    univerAPI.createWorkbook(workbookData);

    let readonly = Boolean(options.readonly);
    options.onDirtyChange?.(false);

    const markDirty = () => options.onDirtyChange?.(true);

    container.addEventListener("keydown", markDirty);
    container.addEventListener("paste", markDirty);

    const disposals: Array<{ dispose: () => void }> = [];

    const notifySelectionChange = () => {
      queueMicrotask(() => {
        options.onSelectionContextChange?.(collectSelectionContext(univerAPI));
      });
    };

    if (options.onSelectionContextChange) {
      try {
        disposals.push(univerAPI.addEvent(univerAPI.Event.SelectionChanged, notifySelectionChange));
      } catch {
        notifySelectionChange();
      }
      notifySelectionChange();
    }

    const instance: SpreadsheetEngineInstance = {
      getSnapshot() {
        const activeWorkbook = univerAPI.getActiveWorkbook();
        return (activeWorkbook?.save?.() ?? {}) as Record<string, unknown>;
      },
      setReadonly(nextReadonly: boolean) {
        readonly = Boolean(nextReadonly);
      },
      collectSheetRangeContext() {
        return collectSelectionContext(univerAPI);
      },
      applySpreadsheetPatch(patch: SpreadsheetPatch): ApplySpreadsheetPatchResult {
        if (readonly) return { ok: false, error: "read_only" };
        return applyValidatedSpreadsheetPatch(patch, {
          activeWorkbookId: univerAPI.getActiveWorkbook()?.getId(),
          getWorksheetById: (id: string) => univerAPI.getActiveWorkbook()?.getSheetBySheetId(id) ?? null,
          getActiveWorksheet: () => univerAPI.getActiveWorkbook()?.getActiveSheet() ?? null,
          onMutated: () => options.onDirtyChange?.(true),
        });
      },
      dispose() {
        container.removeEventListener("keydown", markDirty);
        container.removeEventListener("paste", markDirty);
        for (const d of disposals) d.dispose();
        univerAPI.dispose();
      },
    };

    return instance;
  }
}
