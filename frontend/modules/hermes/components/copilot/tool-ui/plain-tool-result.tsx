/**
 * PlainToolResult - Fallback plain text tool result display
 * @deprecated Use `GenericJsonCard` from `modules/hermes/tool-ui/cards/` instead.
 */
"use client";

export function PlainToolResult({ data }: { data: unknown }) {
  return (
    <div className="rounded-md border p-3 text-sm whitespace-pre-wrap">
      {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
    </div>
  );
}
