"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSchemaValidation } from "../../hooks/use-schema-validation";

export function PreviewSchemaPanel() {
  const { result } = useSchemaValidation();

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">Schema Validation</span>
        {result ? (
          <Badge
            variant="outline"
            className={`text-xs ${
              result.success
                ? "border-green-500 text-green-600"
                : "border-red-500 text-red-600"
            }`}
          >
            {result.success ? "Valid" : "Invalid"}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            No Schema
          </Badge>
        )}
      </div>
      <ScrollArea className="h-[200px] p-3">
        {result ? (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              {result.schemaName}
            </div>
            {result.success ? (
              <div className="text-sm text-green-600">
                Payload matches schema
              </div>
            ) : (
              <div className="space-y-1">
                {result.errors.map((err, i) => (
                  <div
                    key={i}
                    className="rounded-md bg-red-50 px-2 py-1 text-xs dark:bg-red-950"
                  >
                    <span className="font-mono text-red-600">{err.path}</span>
                    <span className="ml-1 text-red-500">{err.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No schema available for this tool
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
