import { describe, expect, it } from "vitest";

import { sha256Hex } from "../src/services/documents/checksum.js";

describe("sha256Hex", () => {
  it("returns the canonical SHA-256 hex of 'abc'", () => {
    expect(sha256Hex(Buffer.from("abc", "utf8"))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("accepts string input", () => {
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});
