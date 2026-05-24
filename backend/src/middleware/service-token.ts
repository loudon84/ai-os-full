import type { RequestHandler } from "express";

import type { AppConfig } from "../config.js";
import { forbidden, unauthorized } from "../errors.js";

export const SERVICE_TOKEN_HEADER = "x-service-token";

export function serviceTokenMiddleware(config: AppConfig): RequestHandler {
  return (req, _res, next) => {
    const token = req.header(SERVICE_TOKEN_HEADER);
    const expected = config.desktopSyncTokenSecret;
    if (!expected) {
      return next(forbidden("Service token not configured"));
    }
    if (!token || token !== expected) {
      return next(unauthorized("Invalid service token"));
    }
    next();
  };
}
