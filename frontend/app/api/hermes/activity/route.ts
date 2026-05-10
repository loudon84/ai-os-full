import { NextRequest, NextResponse } from "next/server";
import { fetchFromGateway, toHermesError } from "@/modules/hermes/services/hermes.bff";
import { HermesActivityPointSchema } from "@/modules/hermes/types/hermes.schemas";

export async function GET(request: NextRequest) {
  try {
    const days = request.nextUrl.searchParams.get("days") ?? "14";
    const data = await fetchFromGateway(`/dashboard/activity?days=${days}`, {
      schema: HermesActivityPointSchema.array(),
    });
    return NextResponse.json(data);
  } catch (err) {
    const error = toHermesError(err);
    const status = error.code === "HERMES_GATEWAY_UNREACHABLE" ? 503 : 502;
    return NextResponse.json(error, { status });
  }
}
