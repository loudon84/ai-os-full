import { NextRequest, NextResponse } from "next/server";
import { createSseHeaders } from "@/modules/hermes/copilot/sse";
import { getHermesWebuiConfig } from "@/modules/hermes/runtime/services/hermes-webui.bff";

function bffUpstreamUnreachableResponse(baseUrl: string, targetUrl: string, err: unknown): NextResponse {
  const message = err instanceof Error ? err.message : String(err);
  return NextResponse.json(
    {
      error: "hermes_runtime_bff_upstream_unreachable",
      message,
      baseUrl,
      targetUrl,
      hint:
        "Next 服务端转发到 hermes-webui（默认 :8787）。请在本机启动 webui，并在根目录 .env 或 frontend/.env.local 设置 HERMES_WEBUI_BASE_URL=http://localhost:8787（勿使用已废弃的旧局域网 IP）。",
    },
    { status: 502 },
  );
}

function mapRuntimePathToWebuiApi(pathParts: string[]): string {
  const key = pathParts.join("/");
  const mapped: Record<string, string> = {
    // sessions
    sessions: "/api/sessions",
    session: "/api/session",
    "session/new": "/api/session/new",
    "session/rename": "/api/session/rename",
    "session/delete": "/api/session/delete",

    // chat
    "chat/start": "/api/chat/start",
    "chat/stream": "/api/chat/stream",
    "chat/stream/status": "/api/chat/stream/status",
    "chat/cancel": "/api/chat/cancel",

    // approval / clarify
    "approval/pending": "/api/approval/pending",
    "approval/respond": "/api/approval/respond",
    "clarify/pending": "/api/clarify/pending",
    "clarify/respond": "/api/clarify/respond",

    // models
    models: "/api/models",

    // upload
    upload: "/api/upload",

    // workspace / filesystem
    list: "/api/list",
    file: "/api/file",
    "file/raw": "/api/file/raw",
    "file/save": "/api/file/save",
    "file/create": "/api/file/create",
    "file/create-dir": "/api/file/create-dir",
    "file/rename": "/api/file/rename",
    "file/delete": "/api/file/delete",
    workspaces: "/api/workspaces",
    "workspaces/add": "/api/workspaces/add",
    "workspaces/remove": "/api/workspaces/remove",
    "workspaces/rename": "/api/workspaces/rename",

    projects: "/api/projects",
  };

  if (mapped[key]) return mapped[key];
  return `/api/${key}`;
}

function pickPassthroughHeaders(req: NextRequest): HeadersInit {
  const headers: HeadersInit = {};
  const cookie = req.headers.get("cookie");
  const authorization = req.headers.get("authorization");
  const userAgent = req.headers.get("user-agent");
  if (cookie) headers.cookie = cookie;
  if (authorization) headers.authorization = authorization;
  if (userAgent) headers["user-agent"] = userAgent;
  return headers;
}

async function proxyJson(req: NextRequest, upstreamUrl: string): Promise<Response> {
  const passthroughHeaders = pickPassthroughHeaders(req);
  const method = req.method;

  let body: BodyInit | undefined;
  let contentType: string | null = null;
  if (method !== "GET" && method !== "HEAD") {
    contentType = req.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const json = await req.json().catch(() => undefined);
      body = json === undefined ? undefined : JSON.stringify(json);
    } else {
      body = await req.text().catch(() => undefined);
    }
  }

  const res = await fetch(upstreamUrl, {
    method,
    headers: {
      ...passthroughHeaders,
      ...(contentType ? { "Content-Type": contentType } : {}),
    },
    body,
    cache: "no-store",
  });

  const text = await res.text();
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
  if (isJson) {
    try {
      return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
      return NextResponse.json({ error: text }, { status: res.status });
    }
  }
  return new Response(text, { status: res.status });
}

async function proxyUpload(req: NextRequest, upstreamUrl: string): Promise<Response> {
  const passthroughHeaders = pickPassthroughHeaders(req);
  const formData = await req.formData();

  const res = await fetch(upstreamUrl, {
    method: "POST",
    headers: {
      ...passthroughHeaders,
      // DO NOT set Content-Type; fetch will set multipart boundary automatically
    },
    body: formData,
    cache: "no-store",
  });

  const text = await res.text();
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
  if (isJson) {
    try {
      return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
      return NextResponse.json({ error: text }, { status: res.status });
    }
  }
  return new Response(text, { status: res.status });
}

async function proxySse(req: NextRequest, upstreamUrl: string): Promise<Response> {
  const passthroughHeaders = pickPassthroughHeaders(req);
  const upstream = await fetch(upstreamUrl, {
    method: "GET",
    headers: {
      ...passthroughHeaders,
      Accept: "text/event-stream",
    },
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: `Upstream SSE error: ${upstream.status} ${text}` },
      { status: upstream.status || 502 }
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) controller.enqueue(value);
        }
      } catch (err) {
        controller.error(err);
      } finally {
        try {
          reader.releaseLock();
        } catch {}
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: createSseHeaders(),
  });
}

async function proxyBinary(req: NextRequest, upstreamUrl: string): Promise<Response> {
  const passthroughHeaders = pickPassthroughHeaders(req);
  const upstream = await fetch(upstreamUrl, {
    method: "GET",
    headers: {
      ...passthroughHeaders,
    },
    cache: "no-store",
  });

  const headers = new Headers();
  for (const key of ["content-type", "content-length", "content-disposition", "cache-control"]) {
    const value = upstream.headers.get(key);
    if (value) headers.set(key, value);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const baseUrl = getHermesWebuiConfig().baseUrl;
  const upstreamPath = mapRuntimePathToWebuiApi(path);
  const url = new URL(`${baseUrl}${upstreamPath}`);

  // Preserve querystring (stream_id, session_id, etc.)
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const key = path.join("/");
  const targetUrl = url.toString();
  try {
    if (key === "chat/stream") {
      return await proxySse(request, targetUrl);
    }

    if (key === "file/raw") {
      return await proxyBinary(request, targetUrl);
    }

    return await proxyJson(request, targetUrl);
  } catch (err) {
    return bffUpstreamUnreachableResponse(baseUrl, targetUrl, err);
  }
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const baseUrl = getHermesWebuiConfig().baseUrl;
  const upstreamPath = mapRuntimePathToWebuiApi(path);
  const url = new URL(`${baseUrl}${upstreamPath}`);

  const targetUrl = url.toString();
  try {
    if (path.join("/") === "upload") {
      return await proxyUpload(request, targetUrl);
    }

    return await proxyJson(request, targetUrl);
  } catch (err) {
    return bffUpstreamUnreachableResponse(baseUrl, targetUrl, err);
  }
}

