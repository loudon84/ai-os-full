import { NextRequest, NextResponse } from "next/server";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function normalizeOpenAiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

function getHermesOpenAiEnv() {
  const baseUrlRaw =
    process.env.HERMES_BASE_URL ??
    process.env.HERMES_GATEWAY_BASE_URL ??
    "http://192.168.0.118:8642/v1";
  const apiKey =
    process.env.HERMES_API_KEY ??
    process.env.HERMES_GATEWAY_TOKEN ??
    process.env.HERMES_GATEWAY_API_KEY ??
    "change-me-local-dev";
  const model = process.env.HERMES_MODEL ?? "default";
  return {
    baseUrl: normalizeOpenAiBaseUrl(baseUrlRaw),
    apiKey,
    model,
  };
}

/**
 * 邮件模块一次性文本补全（非流式），走 Hermes/OpenAI 兼容网关。
 * POST body: `{ system, user }` 或 `{ messages: [{role, content}] }`
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      messages?: ChatMessage[];
      system?: string;
      user?: string;
    };
    let messages: ChatMessage[] = body.messages ?? [];
    if (body.system !== undefined && body.user !== undefined) {
      messages = [
        { role: "system", content: body.system },
        { role: "user", content: body.user },
      ];
    }
    if (messages.length === 0) {
      return NextResponse.json({ message: "缺少 messages 或 system+user" }, { status: 400 });
    }

    const { baseUrl, apiKey, model } = getHermesOpenAiEnv();
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages,
      }),
    });

    const raw = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { message: `AI 网关错误 ${res.status}`, detail: raw.slice(0, 500) },
        { status: 502 },
      );
    }

    const data = JSON.parse(raw) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "服务器错误" },
      { status: 500 },
    );
  }
}
