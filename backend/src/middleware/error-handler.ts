import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { HttpError } from "../errors.js";
import { logger } from "./logger.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    const body: Record<string, unknown> = {
      code: err.code ?? `http_${err.status}`,
      message: err.message,
    };
    if (err.extra) {
      Object.assign(body, err.extra);
    }
    res.status(err.status).json(body);
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      code: "validation_error",
      message: "Validation failed",
      issues: err.issues,
    });
    return;
  }

  logger.error({ err, stack: err instanceof Error ? err.stack : undefined }, "unhandled error");
  res
    .status(500)
    .json({ code: "internal_error", message: err instanceof Error ? err.message : "Internal server error" });
};
