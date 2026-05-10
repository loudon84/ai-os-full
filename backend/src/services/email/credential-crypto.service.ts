import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const HEX_KEY_RE = /^[0-9a-f]{64}$/i;

export interface EncryptedCredential {
  encrypted: string;
  iv: string;
  authTag: string;
}

export class CredentialCryptoService {
  private readonly key: Buffer;

  constructor(encryptionKey: string) {
    if (!HEX_KEY_RE.test(encryptionKey)) {
      throw new Error(
        "EMAIL_CREDENTIAL_ENCRYPTION_KEY must be a 64-character hex string",
      );
    }
    this.key = Buffer.from(encryptionKey, "hex");
  }

  encrypt(plaintext: string): EncryptedCredential {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    return {
      encrypted: encrypted.toString("hex"),
      iv: iv.toString("hex"),
      authTag: cipher.getAuthTag().toString("hex"),
    };
  }

  decrypt(credential: EncryptedCredential): string {
    const decipher = createDecipheriv(
      ALGORITHM,
      this.key,
      Buffer.from(credential.iv, "hex"),
      { authTagLength: AUTH_TAG_LENGTH },
    );
    decipher.setAuthTag(Buffer.from(credential.authTag, "hex"));
    return (
      decipher.update(credential.encrypted, "hex", "utf8") +
      decipher.final("utf8")
    );
  }
}
