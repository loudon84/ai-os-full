import { describe, expect, it } from "vitest";

import { WebhookSignatureService } from "../src/services/service-center/connectors/webhook-signature.service.js";

describe("WebhookSignatureService", () => {
  const service = new WebhookSignatureService();
  const secret = "test-webhook-secret-key";

  it("verifies valid HMAC signature", () => {
    const payload = JSON.stringify({ title: "Review PR", task_type: "code_review" });
    const signature = service.computeSignature(payload, secret);
    expect(service.verifySignature(payload, secret, signature)).toBe(true);
    expect(service.verifySignature(payload, secret, `sha256=${signature}`)).toBe(
      true,
    );
  });

  it("rejects invalid signature", () => {
    const payload = JSON.stringify({ title: "Review PR", task_type: "code_review" });
    expect(service.verifySignature(payload, secret, "invalid")).toBe(false);
    expect(service.verifySignature(payload, "wrong-secret", service.computeSignature(payload, secret))).toBe(
      false,
    );
  });

  it("requires raw body bytes for canonical webhook payloads", () => {
    const rawBody = '{"title":"Review PR","task_type":"code_review"}';
    const reStringified = '{"title": "Review PR", "task_type": "code_review"}';
    const signature = service.computeSignature(rawBody, secret);

    expect(rawBody).not.toBe(reStringified);
    expect(service.verifySignature(rawBody, secret, signature)).toBe(true);
    expect(service.verifySignature(reStringified, secret, signature)).toBe(false);
  });
});
