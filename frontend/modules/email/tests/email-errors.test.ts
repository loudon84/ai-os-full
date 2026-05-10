import { describe, expect, it } from "vitest";

import { normalizeEmailApiError } from "../lib/email-errors";

describe("normalizeEmailApiError", () => {
  it("maps axios-style 422 body", () => {
    const err = {
      response: {
        status: 422,
        data: { message: "Invalid payload", code: "validation_error" },
      },
    };
    const out = normalizeEmailApiError(err);
    expect(out.status).toBe(422);
    expect(out.message).toBe("Invalid payload");
    expect(out.code).toBe("validation_error");
  });

  it("maps 401 to friendly copy", () => {
    const err = { response: { status: 401, data: { message: "x" } } };
    const out = normalizeEmailApiError(err);
    expect(out.message).toBe("未登录或会话已过期");
  });
});
