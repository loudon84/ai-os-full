import { describe, expect, it } from "vitest";

import { resolveMcpToolEnabled } from "../src/services/service-center/mcp/mcp-tool.service.js";

describe("resolveMcpToolEnabled", () => {
  it("defaults high risk tools to disabled", () => {
    expect(resolveMcpToolEnabled("high")).toBe(false);
    expect(resolveMcpToolEnabled("critical")).toBe(false);
  });

  it("defaults low risk tools to enabled", () => {
    expect(resolveMcpToolEnabled("low")).toBe(true);
    expect(resolveMcpToolEnabled("medium")).toBe(true);
  });

  it("respects explicit enabled override", () => {
    expect(resolveMcpToolEnabled("high", true)).toBe(true);
    expect(resolveMcpToolEnabled("low", false)).toBe(false);
  });
});
