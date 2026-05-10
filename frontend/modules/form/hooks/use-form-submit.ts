"use client";

import { useCallback, useState } from "react";

import type { AiOsFormSpec } from "../types/form-spec";
import type { AiOsFormSubmitResponse } from "../types/form-submit";
import { submitForm } from "../services/form-submit-client";

export function useFormSubmit(spec: AiOsFormSpec) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AiOsFormSubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (formData: Record<string, unknown>) => {
      setSubmitting(true);
      setError(null);
      try {
        const res = await submitForm(spec, formData);
        setResult(res);
        return res;
      } catch (e) {
        const message = e instanceof Error ? e.message : "提交失败";
        setError(message);
        const res: AiOsFormSubmitResponse = { ok: false, message };
        setResult(res);
        return res;
      } finally {
        setSubmitting(false);
      }
    },
    [spec]
  );

  return { submitting, result, error, submit };
}

