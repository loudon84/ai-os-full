/**
 * Shared axios instance.
 *
 * Rationale:
 * - On the browser we always want relative URLs so the request hits
 *   whatever origin the page was served from. Hard-coding
 *   NEXT_PUBLIC_SITE_URL causes 404/500 whenever `next dev` auto-picks
 *   a different port than what the env file assumes.
 * - On the server (RSC / route handlers) axios needs an absolute URL.
 *   We resolve it from the current request's `host` header via
 *   `next/headers` so SSR always calls back into the same process,
 *   regardless of which port `next dev` ended up on.
 * - Explicit env (`NEXT_PUBLIC_SITE_URL`) is only used as a last
 *   resort for the server-side path when no request context exists
 *   (e.g. background jobs / cron).
 */
import axios from "axios";

import { tokenManager } from "@/modules/auth/lib/token-manager";

const isBrowser = typeof window !== "undefined";

function trimEnv(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v && v.length > 0 ? v : undefined;
}

async function resolveServerBaseURL(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const h = headers();
    const host = h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? "http";
      return `${proto}://${host}/api`;
    }
  } catch {
    // next/headers only works inside a request scope; fall through.
  }

  const fromEnv = trimEnv(process.env.NEXT_PUBLIC_SITE_URL);
  if (fromEnv) return `${fromEnv.replace(/\/+$/, "")}/api`;

  const port = trimEnv(process.env.PORT) ?? "3000";
  return `http://localhost:${port}/api`;
}

export const api = axios.create();

api.interceptors.request.use(async (config) => {
  if (!config.baseURL) {
    config.baseURL = isBrowser ? "/api" : await resolveServerBaseURL();
  }
  const token = tokenManager.getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
