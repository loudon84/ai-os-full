"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export interface FormErrorPanelProps {
  title?: string;
  errors: Array<{ path: string; message: string; keyword?: string }>;
}

export function FormErrorPanel({ title = "表单规范校验失败", errors }: FormErrorPanelProps) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-1">
          {errors.map((e, idx) => (
            <div key={`${e.path}-${idx}`} className="text-sm">
              <span className="font-mono">{e.path}</span>
              <span className="mx-2 text-muted-foreground">—</span>
              <span>{e.message}</span>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}

