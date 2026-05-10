"use client";

import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";

import type { FormEngineRenderInput } from "../../types/engine";
import { transformAiOsSpecToRjsf } from "./rjsf-transform";
import { rjsfTemplates } from "./rjsf-templates";
import { rjsfWidgets } from "./rjsf-widgets";

export function RjsfEngine(input: FormEngineRenderInput) {
  const transformed = transformAiOsSpecToRjsf(input.spec);

  return (
    <Form
      schema={transformed.schema as RJSFSchema}
      uiSchema={transformed.uiSchema as UiSchema}
      formData={input.formData}
      validator={validator}
      widgets={rjsfWidgets as any}
      templates={rjsfTemplates as any}
      disabled={input.readonly}
      noHtml5Validate
      showErrorList={false}
      onChange={(event) => input.onChange?.((event.formData ?? {}) as Record<string, unknown>)}
      onSubmit={(event) => input.onSubmit?.((event.formData ?? {}) as Record<string, unknown>)}
      onError={(errors) => input.onError?.(errors)}
    >
      <></>
    </Form>
  );
}

