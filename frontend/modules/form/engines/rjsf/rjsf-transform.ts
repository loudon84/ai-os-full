import type { AiOsFormSpec } from "../../types/form-spec";

export interface RjsfTransformedSpec {
  schema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function transformAiOsSpecToRjsf(spec: AiOsFormSpec): RjsfTransformedSpec {
  const schema = asObject(spec.schema);
  const baseUiSchema = asObject(spec.uiSchema);

  const uiSchema: Record<string, unknown> = { ...baseUiSchema };

  const readonlyFields = spec.permissions?.readonlyFields ?? [];
  const hiddenFields = spec.permissions?.hiddenFields ?? [];

  for (const field of readonlyFields) {
    const fieldUi = asObject(uiSchema[field]);
    uiSchema[field] = { ...fieldUi, "ui:readonly": true };
  }

  for (const field of hiddenFields) {
    const fieldUi = asObject(uiSchema[field]);
    uiSchema[field] = { ...fieldUi, "ui:widget": "hidden" };
  }

  return { schema, uiSchema };
}

