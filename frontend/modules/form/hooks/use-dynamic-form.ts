"use client";

import { useMemo, useState } from "react";

import type { AiOsFormSpec } from "../types/form-spec";
import { validateFormData } from "../validators/validate-form-data";

export function useDynamicForm(spec: AiOsFormSpec) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const validation = useMemo(() => validateFormData(spec.schema, formData), [spec.schema, formData]);

  return {
    formData,
    setFormData,
    validation,
    reset: () => setFormData({}),
  };
}

