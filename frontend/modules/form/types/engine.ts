import type React from "react";

import type { AiOsFormSpec } from "./form-spec";

export interface FormEngineRenderInput {
  spec: AiOsFormSpec;
  formData?: Record<string, unknown>;
  readonly?: boolean;
  debug?: boolean;
  onChange?: (data: Record<string, unknown>) => void;
  onSubmit?: (data: Record<string, unknown>) => Promise<void> | void;
  onError?: (errors: unknown[]) => void;
}

export interface FormEngine {
  name: "rjsf" | "formily";
  render(input: FormEngineRenderInput): React.ReactNode;
  validate?(spec: AiOsFormSpec, formData: Record<string, unknown>): Promise<{
    valid: boolean;
    errors: unknown[];
  }>;
}

