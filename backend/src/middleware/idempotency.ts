import type { RequestHandler } from "express";

import { conflict } from "../errors.js";

const seenKeys = new Map<string, number>();
const TTL_MS = 5 * 60 * 1000;

function pruneExpired(now: number) {
  for (const [key, expiresAt] of seenKeys) {
    if (expiresAt <= now) seenKeys.delete(key);
  }
}

export function idempotencyMiddleware(): RequestHandler {
  return (req, _res, next) => {
    const key = req.header("idempotency-key");
    if (!key) return next();

    const now = Date.now();
    pruneExpired(now);
    const cacheKey = `${req.method}:${req.path}:${key}`;
    const existing = seenKeys.get(cacheKey);
    if (existing && existing > now) {
      return next(conflict("Duplicate idempotency key", "IDEMPOTENCY_CONFLICT"));
    }
    seenKeys.set(cacheKey, now + TTL_MS);
    next();
  };
}
