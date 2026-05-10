"use client";

import { useMemo, useState } from "react";

import { FormSubmitBar } from "./form-submit-bar";
import { FormErrorPanel } from "./form-error-panel";
import type { AiOsFormSpec } from "../types/form-spec";
import type { FormEngine } from "../types/engine";
import { validateFormSpec } from "../validators/validate-form-spec";
import { RjsfEngine } from "../engines/rjsf/rjsf-engine";

export interface JsonSchemaFormRendererProps {
  spec: AiOsFormSpec;
  engine?: FormEngine;
  readonly?: boolean;
  debug?: boolean;
  onSubmit?: (data: Record<string, unknown>) => Promise<void> | void;
  onChange?: (data: Record<string, unknown>) => void;
}

export function JsonSchemaFormRenderer(props: JsonSchemaFormRendererProps) {
  const engine = props.engine ?? { name: "rjsf", render: (input) => <RjsfEngine {...input} /> };
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const validation = useMemo(() => validateFormSpec(props.spec), [props.spec]);

  if (!validation.valid) {
    return <FormErrorPanel errors={validation.errors} />;
  }

  const renderNode = engine.render({
    spec: props.spec,
    formData,
    readonly: props.readonly,
    debug: props.debug,
    onChange: (next) => {
      setFormData(next);
      props.onChange?.(next);
    },
    onSubmit: async (data) => {
      await props.onSubmit?.(data);
    },
    onError: () => {
      // RJSF 内部会展示 field errors；此处留给 Phase 5 debug panel 使用
    }
  });

  return (
    <div className="space-y-4">
      {renderNode}
      <FormSubmitBar
        actions={props.spec.actions}
        onSubmit={() => props.onSubmit?.(formData)}
        onReset={() => {
          setFormData({});
          props.onChange?.({});
        }}
      />
    </div>
  );
}

