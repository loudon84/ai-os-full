"use client";

import { useMemo } from "react";

import { validateFormSpec } from "../validators/validate-form-spec";

export function useFormSpecValidation(spec: unknown) {
  return useMemo(() => validateFormSpec(spec), [spec]);
}

