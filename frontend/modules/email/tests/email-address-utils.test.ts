import { describe, expect, it } from "vitest";

import { formatAttachmentSize, parseAddressList } from "../lib/email-address-utils";

describe("parseAddressList", () => {
  it("splits comma and semicolon", () => {
    expect(parseAddressList("a@b.com; c@d.com, e@f.com")).toEqual([
      { address: "a@b.com" },
      { address: "c@d.com" },
      { address: "e@f.com" },
    ]);
  });

  it("trims whitespace", () => {
    expect(parseAddressList("  x@y.com  ")).toEqual([{ address: "x@y.com" }]);
  });
});

describe("formatAttachmentSize", () => {
  it("formats bytes", () => {
    expect(formatAttachmentSize(512)).toBe("512 B");
    expect(formatAttachmentSize(2048)).toBe("2.0 KB");
  });

  it("handles null", () => {
    expect(formatAttachmentSize(null)).toBe("—");
  });
});
