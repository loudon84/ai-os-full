/**
 * JsonResultCard - Generic JSON tool result display
 * @deprecated Use `GenericJsonCard` from `modules/hermes/tool-ui/cards/` instead.
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function JsonResultCard({ data }: { data: unknown }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Tool Result</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[200px]">
          <pre className="text-xs whitespace-pre-wrap break-all font-mono">
            {JSON.stringify(data, null, 2)}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
