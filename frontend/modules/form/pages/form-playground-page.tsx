"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import preOrderIntakeSpec from "../schemas/examples/pre-order-intake.form.json";
import cashDailyReportSpec from "../schemas/examples/cash-daily-report.form.json";
import type { AiOsFormSpec } from "../types/form-spec";
import { validateFormSpec } from "../validators/validate-form-spec";
import { DynamicFormSandbox } from "../renderer/dynamic-form-sandbox";
import { FormDebugPanel } from "../renderer/form-debug-panel";
import { useFormSubmit } from "../hooks/use-form-submit";

function stringifyJson(obj: unknown) {
  return JSON.stringify(obj, null, 2);
}

export default function FormPlaygroundPage() {
  const [activeExample, setActiveExample] = useState<"pre" | "cash">("pre");
  const [specText, setSpecText] = useState(() =>
    stringifyJson(activeExample === "pre" ? preOrderIntakeSpec : cashDailyReportSpec)
  );
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitPayload, setSubmitPayload] = useState<unknown>(null);

  const parsed = useMemo(() => {
    try {
      return { ok: true as const, spec: JSON.parse(specText) as AiOsFormSpec };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "JSON 解析失败" };
    }
  }, [specText]);

  const specValidation = useMemo(() => {
    if (!parsed.ok) return { valid: false, errors: [{ path: "/", message: parsed.error }] };
    return validateFormSpec(parsed.spec);
  }, [parsed]);

  const spec = parsed.ok ? parsed.spec : (preOrderIntakeSpec as any);
  const submitHook = useFormSubmit(spec as AiOsFormSpec);

  return (
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-12">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Form Playground</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeExample}
            onValueChange={(v) => {
              const next = (v as any) as "pre" | "cash";
              setActiveExample(next);
              const example = next === "pre" ? preOrderIntakeSpec : cashDailyReportSpec;
              setSpecText(stringifyJson(example));
              setFormData({});
              setSubmitPayload(null);
            }}
          >
            <TabsList>
              <TabsTrigger value="pre">pre-order-intake</TabsTrigger>
              <TabsTrigger value="cash">cash-daily-report</TabsTrigger>
            </TabsList>
            <TabsContent value="pre" />
            <TabsContent value="cash" />
          </Tabs>
        </CardContent>
      </Card>

      <Card className="col-span-12 lg:col-span-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Form Spec JSON</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={specText}
            onChange={(e) => setSpecText(e.target.value)}
            className="min-h-[560px] font-mono text-xs"
          />
        </CardContent>
      </Card>

      <Card className="col-span-12 lg:col-span-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {specValidation.valid ? (
            <DynamicFormSandbox
              spec={spec as AiOsFormSpec}
              debug
              onChange={(data) => setFormData(data)}
              onSubmit={async (data) => {
                const payload = {
                  formId: (spec as any).formId,
                  specVersion: (spec as any).version,
                  formData: data,
                  submitMode: (spec as any).submit?.mode,
                  taskType: (spec as any).submit?.taskType,
                  workflowId: (spec as any).submit?.workflowId,
                  sourceTaskId: (spec as any).metadata?.sourceTaskId,
                  traceId: (spec as any).metadata?.traceId,
                };
                setSubmitPayload(payload);
                await submitHook.submit(data);
              }}
            />
          ) : (
            <div className="text-sm text-destructive">
              Spec 不合法，无法渲染。请查看右侧 Debug errors。
            </div>
          )}

          <div className="mt-4 hidden">
            {/* placeholder to keep layout consistent */}
          </div>
        </CardContent>
      </Card>

      <div className="col-span-12 lg:col-span-3">
        <FormDebugPanel
          specValid={specValidation.valid}
          specErrors={specValidation.errors}
          formData={formData}
          submitPayload={submitPayload}
          submitResult={submitHook.result ?? (submitHook.error ? { ok: false, message: submitHook.error } : null)}
        />
      </div>
    </div>
  );
}

