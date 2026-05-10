import { NextRequest, NextResponse } from "next/server";
import { fetchFromGateway, toHermesError } from "@/modules/hermes/services/hermes.bff";

/**
 * POST /api/hermes/sessions/chat
 * Non-streaming chat endpoint for Hermes conversations.
 * Proxies to Hermes Gateway /sessions/:sessionId/chat
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, context } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "sessionId and message are required" },
        { status: 400 }
      );
    }

    const data = await fetchFromGateway(`/sessions/${sessionId}/chat`, {
      method: "POST",
      body: { message, context },
    });

    return NextResponse.json(data);
  } catch (err) {
    const error = toHermesError(err);
    const status = error.code === "HERMES_GATEWAY_UNREACHABLE" ? 503 : 502;
    return NextResponse.json(error, { status });
  }
}
