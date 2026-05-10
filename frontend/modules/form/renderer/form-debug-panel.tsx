"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface FormDebugPanelProps {
  specValid: boolean;
  specErrors?: unknown;
  formData: Record<string, unknown>;
  submitPayload?: unknown;
  submitResult?: unknown;
}

export function FormDebugPanel(props: FormDebugPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <div className="font-medium">Spec 校验</div>
          <pre className="mt-1 rounded bg-muted p-2 overflow-auto">
            {JSON.stringify({ valid: props.specValid, errors: props.specErrors }, null, 2)}
          </pre>
        </div>
        <div>
          <div className="font-medium">formData</div>
          <pre className="mt-1 rounded bg-muted p-2 overflow-auto">
            {JSON.stringify(props.formData, null, 2)}
          </pre>
        </div>
        <div>
          <div className="font-medium">submit payload</div>
          <pre className="mt-1 rounded bg-muted p-2 overflow-auto">
            {JSON.stringify(props.submitPayload ?? null, null, 2)}
          </pre>
        </div>
        <div>
          <div className="font-medium">submit result</div>
          <pre className="mt-1 rounded bg-muted p-2 overflow-auto">
            {JSON.stringify(props.submitResult ?? null, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

