import type { ErrorObject, JSONSchemaType } from "ajv";

import type { FormDataValidationResult } from "../types/form-runtime";
import { createAjv } from "./create-ajv";

function formatAjvErrors(errors: ErrorObject[] | null | undefined): FormDataValidationResult["errors"] {
  if (!errors?.length) return [];

  return errors.map((err) => ({
    path: err.instancePath || "/",
    message: err.message ?? "无效",
    keyword: err.keyword
  }));
}

export function validateFormData(
  schema: Record<string, unknown>,
  formData: Record<string, unknown>
): FormDataValidationResult {
  const ajv = createAjv();
  const validate = ajv.compile(schema as JSONSchemaType<unknown>);

  const valid = validate(formData);

  if (!valid) {
    return {
      valid: false,
      errors: formatAjvErrors(validate.errors)
    };
  }

  return { valid: true, errors: [] };
}

