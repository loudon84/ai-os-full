import { createHash } from "node:crypto";

export function sha256Hex(payload: Buffer | Uint8Array | string): string {
  return createHash("sha256").update(payload).digest("hex");
}
