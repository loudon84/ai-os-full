import pino from "pino";
import pinoHttp from "pino-http";

export const logger = pino({
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino/file", options: { destination: 1 } }
      : undefined,
});

export const httpLogger = pinoHttp({ logger });
