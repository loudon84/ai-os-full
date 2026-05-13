import { NextRequest, NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

let defaultLocale = "en";
let locales = ["zh", "en"];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const AI_BASE = process.env.NEXT_PUBLIC_AI_URL ?? "http://localhost:8001/api/v1";

const LOCAL_API_PREFIXES = [
  "/ai/copilot",
  "/ai/hermes",
  "/api/auth",
  "/api/chat",
  /** Next Route Handler：邮件一次性补全（非 Express `/api/v1/email/*`） */
  "/api/email/ai-completion",
  /** Next Hermes BFF（Gateway 代理、runtime 反代 hermes-webui） */
  "/api/hermes",
  "/ai/finance",
  "/api/forms",  
  "/api/boards",
  "/api/calendars",
  "/api/comments",
  "/api/projects",
  "/api/tasks",
  "/api/user",
];

function isLocalApi(pathname: string): boolean {
  return LOCAL_API_PREFIXES.some((p) => pathname.startsWith(p));
}

function getLocale(request: Request) {
  const acceptedLanguage = request.headers.get("accept-language") ?? undefined;
  let headers = { "accept-language": acceptedLanguage };
  let languages = new Negotiator({ headers }).languages();

  return match(languages, locales, defaultLocale);
}

async function proxyTo(request: NextRequest, targetBase: string): Promise<Response> {
  const { pathname, searchParams } = request.nextUrl;
  const prefix = pathname.startsWith("/ai") ? "/ai" : "/api";
  const upstreamPath = pathname.slice(prefix.length) || "/";
  const upstreamUrl = new URL(`${targetBase}${upstreamPath}`);
  searchParams.forEach((value, key) => upstreamUrl.searchParams.set(key, value));

  const headers: Record<string, string> = {};
  const contentType = request.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;
  const auth = request.headers.get("authorization");
  if (auth) headers["authorization"] = auth;
  const cookie = request.headers.get("cookie");
  if (cookie) headers["cookie"] = cookie;

  if (!auth) {
    const tokenCookie = cookie?.match(/tj_auth_token=([^;]+)/)?.[1]
      ?? cookie?.match(/next-auth\.session-token=([^;]+)/)?.[1];
    if (tokenCookie) {
      try {
        const payload = JSON.parse(atob(tokenCookie.split(".")[1]));
        if (payload.workspaceId) {
          headers["x-workspace-id"] = payload.workspaceId;
        }
        if (payload.sub) {
          headers["x-user-id"] = payload.sub;
        }
      } catch {}
    }
  }

  const tenantId = request.headers.get("x-tenant-id") || (auth ? undefined : process.env.DEFAULT_TENANT_ID);
  const workspaceId = request.headers.get("x-workspace-id") || (auth ? undefined : process.env.DEFAULT_WORKSPACE_ID);
  const userId = request.headers.get("x-user-id") || (auth ? undefined : process.env.DEFAULT_USER_ID);
  if (tenantId) headers["x-tenant-id"] = tenantId;
  if (workspaceId) headers["x-workspace-id"] = workspaceId;
  if (userId) headers["x-user-id"] = userId;

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const res = await fetch(upstreamUrl.toString(), init);
  const resHeaders = new Headers();
  const resCt = res.headers.get("content-type");
  if (resCt) resHeaders.set("content-type", resCt);
  return new Response(res.body, { status: res.status, headers: resHeaders });
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isLocalApi(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return proxyTo(request, API_BASE);
  }

  if (pathname.startsWith("/ai/")) {
    return proxyTo(request, AI_BASE);
  }

  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    return NextResponse.redirect(
      new URL(`/${locale}/${pathname}`, request.url)
    );
  }
}

export const config = {
  matcher: [
    "/((?!assets|docs|.*\\..*|_next).*)",
  ],
};
