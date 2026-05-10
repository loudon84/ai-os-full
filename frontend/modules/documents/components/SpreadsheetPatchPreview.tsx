"use client";

import type { SpreadsheetPatchPreviewModel } from "../lib/spreadsheetPatchPreview";

export function SpreadsheetPatchPreview(props: { model: SpreadsheetPatchPreviewModel }) {
  const { model } = props;
  return (
    <div className="space-y-2 rounded-md border border-primary/25 bg-muted/30 p-2 text-xs">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium text-foreground">
        <span>{model.op}</span>
        <span className="text-muted-foreground">范围</span>
        <span className="font-mono">{model.rangeA1 || "—"}</span>
        <span className="text-muted-foreground">影响单元格</span>
        <span>{model.affectedCells}</span>
        <span className="text-muted-foreground">风险</span>
        <span
          className={
            model.riskLevel === "high"
              ? "text-destructive"
              : model.riskLevel === "medium"
                ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400"
          }
        >
          {model.riskLevel}
        </span>
      </div>

      {model.warnings.length > 0 && (
        <ul className="list-inside list-disc text-[11px] text-amber-800 dark:text-amber-200">
          {model.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      <div className="overflow-x-auto rounded border bg-background">
        <table className="w-full min-w-[260px] border-collapse text-[11px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-2 py-1 text-left font-medium text-muted-foreground">单元格</th>
              <th className="px-2 py-1 text-left font-medium text-muted-foreground">修改前</th>
              <th className="px-2 py-1 text-left font-medium text-muted-foreground">修改后</th>
            </tr>
          </thead>
          <tbody>
            {model.rows.map((r) => (
              <tr key={r.cell} className="border-b border-border/60">
                <td className="px-2 py-0.5 font-mono">{r.cell}</td>
                <td className="max-w-[120px] truncate px-2 py-0.5 text-muted-foreground" title={r.before}>
                  {r.before || "（空）"}
                </td>
                <td className="max-w-[120px] truncate px-2 py-0.5 font-mono text-foreground" title={r.after}>
                  {r.after || "（空）"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
