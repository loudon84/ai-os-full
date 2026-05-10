import { describe, expect, it } from "vitest";

import { CredentialCryptoService } from "../src/services/email/credential-crypto.service.js";
import { getProviderPreset } from "../src/services/email/provider-presets.js";

describe("CredentialCryptoService", () => {
  it("encrypts and decrypts mailbox credentials with AES-256-GCM", () => {
    const crypto = new CredentialCryptoService("a".repeat(64));

    const encrypted = crypto.encrypt("app-password");

    expect(encrypted.encrypted).not.toBe("app-password");
    expect(encrypted.iv).toHaveLength(24);
    expect(encrypted.authTag).toHaveLength(32);
    expect(crypto.decrypt(encrypted)).toBe("app-password");
  });

  it("rejects keys that are not 32-byte hex strings", () => {
    expect(() => new CredentialCryptoService("not-a-valid-key")).toThrow(
      /64-character hex/i,
    );
  });
});

describe("email provider presets", () => {
  it("returns Gmail IMAP, POP3, and SMTP defaults", () => {
    const preset = getProviderPreset("gmail");

    expect(preset.imap).toMatchObject({
      host: "imap.gmail.com",
      port: 993,
      secure: true,
    });
    expect(preset.pop3).toMatchObject({
      host: "pop.gmail.com",
      port: 995,
      secure: true,
    });
    expect(preset.smtp).toMatchObject({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireStartTls: true,
    });
  });
});
