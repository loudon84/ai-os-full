import { describe, expect, it } from "vitest";

import preOrderIntakeSpec from "../schemas/examples/pre-order-intake.form.json";
import { validateFormData } from "../validators/validate-form-data";

describe("form - validateFormData", () => {
  it("accepts valid form data", () => {
    const result = validateFormData(preOrderIntakeSpec.schema as any, {
      customerName: "ACME",
      materialCode: "M-001",
      quantity: 1,
      targetPrice: 12.34,
      paymentTerm: "月结30天"
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects when required field is missing", () => {
    const result = validateFormData(preOrderIntakeSpec.schema as any, {
      customerName: "ACME"
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects when minimum constraint fails", () => {
    const result = validateFormData(preOrderIntakeSpec.schema as any, {
      customerName: "ACME",
      materialCode: "M-001",
      quantity: 0,
      targetPrice: 12.34,
      paymentTerm: "月结30天"
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === "minimum")).toBe(true);
  });
});

