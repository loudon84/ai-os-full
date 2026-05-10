import type { ErrorObject } from "ajv";

import type { AiOsFormSpec } from "../types/form-spec";
import type { FormSpecValidationResult } from "../types/form-runtime";
import { getSharedAjv } from "./create-ajv";

import formSpecSchema from "../schemas/ai-os-form-spec.schema.json";

function formatAjvErrors(errors: ErrorObject[] | null | undefined): FormSpecValidationResult["errors"] {
  if (!errors?.length) return [];

  return errors.map((err) => ({
    path: err.instancePath || "/",
    message: err.message ?? "无效",
    keyword: err.keyword
  }));
}

function getJsonSchemaMaxDepth(node: unknown, depth = 0): number {
  if (!node || typeof node !== "object") return depth;

  const obj = node as Record<string, unknown>;

  let max = depth;

  const properties = obj.properties;
  if (properties && typeof properties === "object") {
    for (const value of Object.values(properties as Record<string, unknown>)) {
      max = Math.max(max, getJsonSchemaMaxDepth(value, depth + 1));
    }
  }

  const items = obj.items;
  if (items) {
    if (Array.isArray(items)) {
      for (const item of items) {
        max = Math.max(max, getJsonSchemaMaxDepth(item, depth + 1));
      }
    } else {
      max = Math.max(max, getJsonSchemaMaxDepth(items, depth + 1));
    }
  }

  const allOf = obj.allOf;
  if (Array.isArray(allOf)) {
    for (const item of allOf) {
      max = Math.max(max, getJsonSchemaMaxDepth(item, depth + 1));
    }
  }

  const anyOf = obj.anyOf;
  if (Array.isArray(anyOf)) {
    for (const item of anyOf) {
      max = Math.max(max, getJsonSchemaMaxDepth(item, depth + 1));
    }
  }

  const oneOf = obj.oneOf;
  if (Array.isArray(oneOf)) {
    for (const item of oneOf) {
      max = Math.max(max, getJsonSchemaMaxDepth(item, depth + 1));
    }
  }

  return max;
}

function countJsonSchemaFields(node: unknown): number {
  if (!node || typeof node !== "object") return 0;

  const obj = node as Record<string, unknown>;
  const properties = obj.properties;
  if (!properties || typeof properties !== "object") return 0;

  const entries = Object.entries(properties as Record<string, unknown>);
  let count = entries.length;

  for (const [, value] of entries) {
    count += countJsonSchemaFields(value);
  }

  return count;
}

export function validateFormSpec(spec: unknown): FormSpecValidationResult {
  const ajv = getSharedAjv();
  const validate = ajv.compile<AiOsFormSpec>(formSpecSchema);

  const valid = validate(spec);
  const errors = formatAjvErrors(validate.errors);

  if (!valid) {
    return { valid: false, errors };
  }

  const typed = spec as AiOsFormSpec;
  const maxFieldsLimit = typed.runtime?.maxFields ?? 100;
  const maxDepthLimit = typed.runtime?.maxDepth ?? 8;

  const fieldCount = countJsonSchemaFields(typed.schema);
  if (fieldCount > maxFieldsLimit) {
    return {
      valid: false,
      errors: [
        ...errors,
        {
          path: "/schema",
          keyword: "maxFields",
          message: `字段数量超限：${fieldCount} > ${maxFieldsLimit}`
        }
      ]
    };
  }

  const depth = getJsonSchemaMaxDepth(typed.schema, 0);
  if (depth > maxDepthLimit) {
    return {
      valid: false,
      errors: [
        ...errors,
        {
          path: "/schema",
          keyword: "maxDepth",
          message: `Schema 深度超限：${depth} > ${maxDepthLimit}`
        }
      ]
    };
  }

  return { valid: true, errors: [] };
}

