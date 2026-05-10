import { describe, expect, it } from "vitest";

import { VersionConflictError } from "../src/services/documents/errors.js";

describe("VersionConflictError", () => {
  it("carries current_version_no and base_version_no in extra", () => {
    const err = new VersionConflictError(4, 3);
    expect(err.code).toBe("version_conflict");
    expect(err.status).toBe(409);
    expect(err.currentVersionNo).toBe(4);
    expect(err.baseVersionNo).toBe(3);
    expect(err.extra).toEqual({
      current_version_no: 4,
      base_version_no: 3,
    });
  });
});
