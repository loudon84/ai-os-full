import { describe, expect, it } from "vitest";

import preOrderIntakeSpec from "../schemas/examples/pre-order-intake.form.json";
import cashDailyReportSpec from "../schemas/examples/cash-daily-report.form.json";
import { validateFormSpec } from "../validators/validate-form-spec";

describe("form - validateFormSpec", () => {
  it("validates pre-order-intake example", () => {
    const result = validateFormSpec(preOrderIntakeSpec);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validates cash-daily-report example", () => {
    const result = validateFormSpec(cashDailyReportSpec);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects when required fields are missing", () => {
    const { kind: _kind, ...rest } = preOrderIntakeSpec as any;
    const result = validateFormSpec(rest);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects when schema field count exceeds runtime.maxFields", () => {
    const spec = {
      ...cashDailyReportSpec,
      runtime: { ...(cashDailyReportSpec as any).runtime, maxFields: 1 }
    };
    const result = validateFormSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === "maxFields")).toBe(true);
  });

  it("rejects when schema depth exceeds runtime.maxDepth", () => {
    const deepSchema = {
      type: "object",
      properties: {
        a: {
          type: "object",
          properties: {
            b: {
              type: "object",
              properties: {
                c: {
                  type: "object",
                  properties: {
                    d: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    };

    const spec = {
      ...cashDailyReportSpec,
      schema: deepSchema,
      runtime: { ...(cashDailyReportSpec as any).runtime, maxDepth: 2 }
    };

    const result = validateFormSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === "maxDepth")).toBe(true);
  });
});

