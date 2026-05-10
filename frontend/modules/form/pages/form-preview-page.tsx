"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import preOrderIntakeSpec from "../schemas/examples/pre-order-intake.form.json";
import cashDailyReportSpec from "../schemas/examples/cash-daily-report.form.json";
import type { AiOsFormSpec } from "../types/form-spec";
import { DynamicFormSandbox } from "../renderer/dynamic-form-sandbox";
import { useFormSubmit } from "../hooks/use-form-submit";

function loadExample(formId: string | null) {
  if (!formId) return preOrderIntakeSpec as any;
  if (formId === preOrderIntakeSpec.formId) return preOrderIntakeSpec as any;
  if (formId === cashDailyReportSpec.formId) return cashDailyReportSpec as any;
  return preOrderIntakeSpec as any;
}

export default function FormPreviewPage() {
  const params = useSearchParams();
  const formId = params.get("formId");

  const spec = useMemo(() => loadExample(formId) as AiOsFormSpec, [formId]);
  const submitHook = useFormSubmit(spec);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Form Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DynamicFormSandbox
          spec={spec}
          onSubmit={async (data) => {
            await submitHook.submit(data);
          }}
        />

        {submitHook.result ? (
          <pre className="rounded bg-muted p-3 text-xs overflow-auto">{JSON.stringify(submitHook.result, null, 2)}</pre>
        ) : null}
      </CardContent>
    </Card>
  );
}

