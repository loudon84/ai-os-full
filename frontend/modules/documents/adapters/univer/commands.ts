/** Copilot/UI command ids for datasheet AI (@see docs/prd/document/agent_spec.md §5.4). */
export const SPREADSHEET_AI_COMMANDS = [
  "analyzeSelection",
  "generateFormula",
  "cleanSelection",
  "summarizeSheet",
  "createPatch",
  "applyPatch",
  "rejectPatch",
] as const;

export type SpreadsheetAICommandId = (typeof SPREADSHEET_AI_COMMANDS)[number];
