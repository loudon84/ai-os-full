import { describe, expect, it } from "vitest";

import { renderTemplateBody } from "../src/services/hermes/prompt-template.service.js";

describe("PromptTemplateService", () => {
  it("renders template variables", () => {
    const rendered = renderTemplateBody("Hello {{user}} in {{workspace}}", {
      user: "Alice",
      workspace: "ws-1",
    });
    expect(rendered).toBe("Hello Alice in ws-1");
  });
});
