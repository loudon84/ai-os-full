import { createHmac, timingSafeEqual } from "node:crypto";

import { unauthorized } from "../../../errors.js";

export class WebhookSignatureService {
  computeSignature(payload: string, secret: string): string {
    return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  }

  verifySignature(payload: string, secret: string, signature: string): boolean {
    if (!signature || !secret) return false;

    const expected = this.computeSignature(payload, secret);
    const provided = signature.startsWith("sha256=")
      ? signature.slice("sha256=".length)
      : signature;

    if (expected.length !== provided.length) return false;

    try {
      return timingSafeEqual(
        Buffer.from(expected, "utf8"),
        Buffer.from(provided, "utf8"),
      );
    } catch {
      return false;
    }
  }

  assertValidSignature(payload: string, secret: string, signature: string): void {
    if (!this.verifySignature(payload, secret, signature)) {
      unauthorized("Invalid webhook signature");
    }
  }
}
