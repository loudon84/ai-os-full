"use client";

import type { AiOsFormSpec } from "../types/form-spec";
import { JsonSchemaFormRenderer } from "./json-schema-form-renderer";

export interface DynamicFormSandboxProps {
  spec: AiOsFormSpec;
  readonly?: boolean;
  debug?: boolean;
  onSubmit?: (data: Record<string, unknown>) => Promise<void> | void;
  onChange?: (data: Record<string, unknown>) => void;
}

export function DynamicFormSandbox(props: DynamicFormSandboxProps) {
  return (
    <JsonSchemaFormRenderer
      spec={props.spec}
      readonly={props.readonly}
      debug={props.debug}
      onSubmit={props.onSubmit}
      onChange={props.onChange}
    />
  );
}

