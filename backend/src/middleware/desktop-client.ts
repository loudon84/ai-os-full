import type { Request } from "express";

import { badRequest } from "../errors.js";

export const DESKTOP_CLIENT_HEADER = "x-desktop-client-id";

export function resolveDesktopClientId(
  req: Pick<Request, "headers" | "query" | "body">,
): string | undefined {
  const header = req.headers[DESKTOP_CLIENT_HEADER];
  if (typeof header === "string" && header.length > 0) return header;

  const queryId = req.query.client_id;
  if (typeof queryId === "string" && queryId.length > 0) return queryId;

  const body = req.body as Record<string, unknown> | undefined;
  const bodyId = body?.desktop_client_id ?? body?.client_id;
  if (typeof bodyId === "string" && bodyId.length > 0) return bodyId;

  return undefined;
}

export function requireDesktopClientId(
  req: Pick<Request, "headers" | "query" | "body">,
): string {
  const clientId = resolveDesktopClientId(req);
  if (!clientId) {
    badRequest("X-Desktop-Client-Id header is required");
  }
  return clientId;
}
